import User from '../../../models/User'
import Order from '../../../models/Order'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20
  const search = query.search as string

  const filter: any = {}
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter)
  ])

  const userIds = users.map((u: any) => u._id)
  const orderCounts = await Order.aggregate([
    { $match: { user: { $in: userIds }, status: 'paid' } },
    { $group: { _id: '$user', count: { $sum: 1 }, total: { $sum: '$total' } } }
  ])
  const orderMap = Object.fromEntries(orderCounts.map((o: any) => [o._id.toString(), o]))

  const enriched = users.map((u: any) => ({
    ...u,
    orderCount: orderMap[u._id.toString()]?.count || 0,
    totalSpent: orderMap[u._id.toString()]?.total || 0
  }))

  return { users: enriched, total, page, totalPages: Math.ceil(total / limit) }
})