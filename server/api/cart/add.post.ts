import Cart from '../../models/Cart'
import Book from '../../models/Book'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)

  if (!body.bookId) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุ bookId' })
  }

  const book = await Book.findById(body.bookId)
  if (!book) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบหนังสือ' })
  }

  const type = body.type || 'purchase'
  const price = type === 'rental' ? book.rentalPrice : book.price

  let cart = await Cart.findOne({ user: user.userId })

  if (!cart) {
    cart = new Cart({
      user: user.userId,
      items: []
    })
  }

  // Check if book already in cart
  const existingItem = cart.items.find(
    (item: any) => item.book.toString() === body.bookId
  )

  if (existingItem) {
    throw createError({ statusCode: 409, statusMessage: 'หนังสือนี้อยู่ในตะกร้าแล้ว' })
  }

  cart.items.push({
    book: body.bookId,
    type,
    price
  })

  await cart.save()

  const populated = await Cart.findById(cart._id).populate('items.book').lean()
  return populated
})
