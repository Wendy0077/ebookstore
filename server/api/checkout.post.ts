import Cart from '../models/Cart'
import Order from '../models/Order'
import Rental from '../models/Rental'
import DownloadToken from '../models/DownloadToken'
import AccessControl from '../models/AccessControl'
import Book from '../models/Book'
import { requireAuth } from '../utils/auth'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const body = await readBody(event)

    // Validate payment info (mock — just check fields exist)
    const { cardName, cardNumber, expiry, cvv } = body || {}
    if (!cardName || !cardNumber || !expiry || !cvv) {
        throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกข้อมูลบัตรให้ครบถ้วน' })
    }

    // Get cart
    const cart = await Cart.findOne({ user: user.userId }).populate('items.book')
    if (!cart || !cart.items || cart.items.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'ตะกร้าสินค้าว่างเปล่า' })
    }

    // Calculate total
    const total = cart.items.reduce((sum: number, item: any) => sum + item.price, 0)

    // Create order
    const order = await Order.create({
        user: user.userId,
        items: cart.items.map((item: any) => ({
            book: item.book._id || item.book,
            type: item.type,
            price: item.price
        })),
        total,
        status: 'paid',
        stripePaymentId: `mock_pay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        stripeSessionId: `mock_sess_${Date.now()}`
    })

    // Process each item
    for (const item of cart.items) {
        const bookId = item.book._id || item.book

        if (item.type === 'rental') {
            // Create rental record
            const durationDays = item.book.rentalDurationDays || 30
            const endDate = new Date()
            endDate.setDate(endDate.getDate() + durationDays)

            await Rental.create({
                user: user.userId,
                book: bookId,
                order: order._id,
                startDate: new Date(),
                endDate,
                status: 'active'
            })
        }

        // Create download token for all items (both purchase and rental)
        const expiresAt = new Date()
        if (item.type === 'rental') {
            expiresAt.setDate(expiresAt.getDate() + (item.book.rentalDurationDays || 30))
        } else {
            // Purchase: long-lived token (1 year)
            expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        }

        await DownloadToken.create({
            user: user.userId,
            book: bookId,
            order: order._id,
            maxDownloads: item.type === 'rental' ? 3 : 10,
            expiresAt
        })

        // Create or update AccessControl for web reader
        const existingAC = await AccessControl.findOne({ user: user.userId, book: bookId })
        if (!existingAC) {
            await AccessControl.create({
                user: user.userId,
                book: bookId,
                order: order._id,
                accessType: item.type,
                isActive: true,
                rentalExpireAt: item.type === 'rental' ? expiresAt : null,
                watermarkText: `${user.email} | ${user.userId}`
            })
        } else if (existingAC.accessType === 'rental' && item.type === 'purchase') {
            await AccessControl.updateOne(
                { _id: existingAC._id },
                { accessType: 'purchase', rentalExpireAt: null, isActive: true }
            )
        }

        // Update sales count
        await Book.updateOne({ _id: bookId }, { $inc: { salesCount: 1 } })
    }

    // Clear cart
    cart.items = []
    await cart.save()

    // Populate the order for response
    const populatedOrder = await Order.findById(order._id).populate('items.book').lean()

    return {
        message: 'ชำระเงินเรียบร้อยแล้ว',
        order: populatedOrder
    }
})
