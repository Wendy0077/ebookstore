import Order from '../../models/Order'
import DownloadToken from '../../models/DownloadToken'
import Rental from '../../models/Rental'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const id = getRouterParam(event, 'id')

    const order = await Order.findOne({ _id: id, user: user.userId })
        .populate('items.book')
        .lean()

    if (!order) {
        throw createError({ statusCode: 404, statusMessage: 'ไม่พบคำสั่งซื้อ' })
    }

    // Get download tokens for this order
    const downloadTokens = await DownloadToken.find({ order: id, user: user.userId }).lean()

    // Get rental info for this order
    const rentals = await Rental.find({ order: id, user: user.userId }).lean()

    return {
        ...order,
        downloadTokens,
        rentals
    }
})
