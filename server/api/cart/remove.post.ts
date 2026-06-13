import Cart from '../../models/Cart'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)

  if (!body.bookId) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุ bookId' })
  }

  const cart = await Cart.findOne({ user: user.userId })
  if (!cart) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบตะกร้า' })
  }

  cart.items = cart.items.filter(
    (item: any) => item.book.toString() !== body.bookId
  )

  await cart.save()

  const populated = await Cart.findById(cart._id).populate('items.book').lean()
  return populated
})
