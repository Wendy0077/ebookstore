import Order from '../../models/Order'
import User from '../../models/User'
import Book from '../../models/Book'
import ReadingHistory from '../../models/ReadingHistory'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const now = new Date()
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  })

  const [dailySales, categoryStats, userGrowth, topBooks, readingStats] = await Promise.all([
    Order.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: last7[0] } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Book.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', books: { $sum: 1 }, sales: { $sum: '$salesCount' } } },
      { $sort: { sales: -1 } },
      { $limit: 8 }
    ]),
    User.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]),
    Book.find({ isActive: true }).sort({ salesCount: -1 }).limit(10).select('title author salesCount rating category').lean(),
    ReadingHistory.aggregate([
      { $group: { _id: null, avgTime: { $avg: '$readingTimeMinutes' }, totalReads: { $sum: 1 }, completed: { $sum: { $cond: ['$completed', 1, 0] } } } }
    ])
  ])

  const salesMap = Object.fromEntries(dailySales.map((d: any) => [d._id, d]))
  const salesChart = last7.map(d => {
    const key = d.toISOString().slice(0, 10)
    return { date: key, revenue: salesMap[key]?.revenue || 0, orders: salesMap[key]?.count || 0 }
  })

  return {
    salesChart,
    categoryStats: categoryStats.map((c: any) => ({ name: c._id, books: c.books, sales: c.sales })),
    userGrowth: userGrowth.map((u: any) => ({ month: u._id, count: u.count })),
    topBooks,
    readingStats: readingStats[0] || { avgTime: 0, totalReads: 0, completed: 0 }
  }
})