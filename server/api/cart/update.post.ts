import Cart from '../../models/Cart'
import Book from '../../models/Book'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)

  const { bookId, type } = body || {}

  if (!bookId) {
    throw createError({ statusCode: 400, message: 'กรุณาระบุ bookId' })
  }

  if (type !== 'purchase' && type !== 'rental') {
    throw createError({ statusCode: 400, message: 'กรุณาระบุ type ให้ถูกต้อง (purchase หรือ rental)' })
  }

  const [cart, book] = await Promise.all([
    Cart.findOne({ user: user.userId }),
    Book.findById(bookId)
  ])

  if (!cart) {
    throw createError({ statusCode: 404, message: 'ไม่พบตะกร้า' })
  }

  const item = cart.items.find((i: any) => i.book.toString() === String(bookId))
  if (!item) {
    throw createError({ statusCode: 404, message: 'ไม่พบหนังสือในตะกร้า' })
  }

  if (!book) {
    throw createError({ statusCode: 404, message: 'ไม่พบหนังสือ' })
  }

  if (type === 'rental' && (!book.isRentable || !book.rentalPrice || book.rentalPrice <= 0)) {
    throw createError({ statusCode: 400, message: 'หนังสือเล่มนี้ไม่สามารถเช่าได้' })
  }

  item.type = type
  item.price = type === 'rental' ? book.rentalPrice : book.price

  await cart.save()

  const populated = await Cart.findById(cart._id).populate('items.book').lean()
  return populated
})
