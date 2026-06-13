import Order from '../../models/Order'
import User from '../../models/User'
import Book from '../../models/Book'
import Rental from '../../models/Rental'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalOrders,
    monthOrders,
    totalUsers,
    activeRentals,
    totalBooks,
    recentOrders,
    popularBooks
  ] = await Promise.all([
    Order.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $match: { status: 'paid', createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $match: { status: 'paid', createdAt: { $gte: lastMonthStart, $lt: monthStart } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.countDocuments({ status: 'paid' }),
    Order.countDocuments({ status: 'paid', createdAt: { $gte: monthStart } }),
    User.countDocuments(),
    Rental.countDocuments({ status: 'active', endDate: { $gte: now } }),
    Book.countDocuments({ isActive: true }),
    Order.find({ status: 'paid' }).populate('user', 'name email').sort({ createdAt: -1 }).limit(5).lean(),
    Book.find({ isActive: true }).sort({ salesCount: -1 }).limit(5).lean()
  ])

  const rev = totalRevenue[0]?.total || 0
  const mRev = monthRevenue[0]?.total || 0
  const lmRev = lastMonthRevenue[0]?.total || 0
  const revenueGrowth = lmRev > 0 ? ((mRev - lmRev) / lmRev) * 100 : 0

  return {
    stats: {
      totalRevenue: rev,
      monthRevenue: mRev,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      totalOrders,
      monthOrders,
      totalUsers,
      activeRentals,
      totalBooks
    },
    recentOrders,
    popularBooks
  }
})