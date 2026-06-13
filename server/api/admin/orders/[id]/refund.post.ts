import Order from '../../../../models/Order'
import AccessControl from '../../../../models/AccessControl'
import Rental from '../../../../models/Rental'
import { requireAdmin } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')

  const order = await Order.findById(id)
  if (!order) throw createError({ statusCode: 404, statusMessage: 'ไม่พบคำสั่งซื้อ' })

  if (order.status !== 'paid') {
    throw createError({ statusCode: 400, statusMessage: 'ไม่สามารถคืนเงินคำสั่งซื้อนี้ได้' })
  }

  order.status = 'refunded'
  await order.save()

  const bookIds = order.items.map((i: any) => i.book)
  await Promise.all([
    AccessControl.updateMany({ user: order.user, book: { $in: bookIds }, order: id }, { isActive: false }),
    Rental.updateMany({ user: order.user, order: id, status: 'active' }, { status: 'returned' })
  ])

  return { message: 'คืนเงินเรียบร้อย', order }
})