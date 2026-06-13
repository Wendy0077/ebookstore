import Order from '../../models/Order'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)

    const orders = await Order.find({ user: user.userId })
        .populate('items.book')
        .sort({ createdAt: -1 })
        .lean()

    return orders
})
