import Cart from '../../models/Cart'
import Book from '../../models/Book'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)

  const { bookId, type } = body || {}

  if (!bookId) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุ bookId' })
  }

  if (type !== 'purchase' && type !== 'rental') {
    throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุ type ให้ถูกต้อง (purchase หรือ rental)' })
  }

  const cart = await Cart.findOne({ user: user.userId })
  if (!cart) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบตะกร้า' })
  }

  const item = cart.items.find((i: any) => i.book.toString() === String(bookId))
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบหนังสือในตะกร้า' })
  }

  const book = await Book.findById(bookId)
  if (!book) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบหนังสือ' })
  }

  if (type === 'rental' && (!book.isRentable || !book.rentalPrice || book.rentalPrice <= 0)) {
    throw createError({ statusCode: 400, statusMessage: 'หนังสือเล่มนี้ไม่สามารถเช่าได้' })
  }

  item.type = type
  item.price = type === 'rental' ? book.rentalPrice : book.price

  await cart.save()

  const populated = await Cart.findById(cart._id).populate('items.book').lean()
  return populated
})
