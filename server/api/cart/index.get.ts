import Cart from '../../models/Cart'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  let cart = await Cart.findOne({ user: user.userId }).populate('items.book').lean()
  if (!cart) {
    cart = { items: [], user: user.userId } as any
  }

  return cart
})
