import Order from '../../models/Order'
import User from '../../models/User'
import Book from '../../models/Book'
import ReadingHistory from '../../models/ReadingHistory'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const query = getQuery(event)
  const now = new Date()
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const parseDate = (v: unknown) => {
    if (typeof v === 'string' && v) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
      if (m) return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
      const d = new Date(v)
      if (!isNaN(d.getTime())) return d
    }
    return null
  }

  const defaultFrom = new Date(todayUTC)
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 6)

  const fromDate = parseDate(query.from) || defaultFrom
  fromDate.setUTCHours(0, 0, 0, 0)
  const toDate = parseDate(query.to) || todayUTC
  toDate.setUTCHours(23, 59, 59, 999)

  const rangeDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1)
  const groupByMonth = rangeDays > 31
  const dateFormat = groupByMonth ? '%Y-%m' : '%Y-%m-%d'

  const buckets: Date[] = []
  if (groupByMonth) {
    const cursor = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), 1))
    const end = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), 1))
    while (cursor <= end) {
      buckets.push(new Date(cursor))
      cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    }
  } else {
    const cursor = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()))
    const end = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate()))
    while (cursor <= end) {
      buckets.push(new Date(cursor))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }

  const [dailySales, categoryStats, userGrowth, topBooks, readingStats] = await Promise.all([
    Order.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: fromDate, $lte: toDate } } },
      { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt' } }, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
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
      { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
      { $group: { _id: null, avgTime: { $avg: '$readingTimeMinutes' }, totalReads: { $sum: 1 }, completed: { $sum: { $cond: ['$completed', 1, 0] } } } }
    ])
  ])

  const salesMap = Object.fromEntries(dailySales.map((d: any) => [d._id, d]))
  const salesChart = buckets.map(d => {
    const key = groupByMonth ? d.toISOString().slice(0, 7) : d.toISOString().slice(0, 10)
    return { date: key, revenue: salesMap[key]?.revenue || 0, orders: salesMap[key]?.count || 0 }
  })

  return {
    salesChart,
    groupBy: groupByMonth ? 'month' : 'day',
    range: { from: fromDate.toISOString(), to: toDate.toISOString() },
    categoryStats: categoryStats.map((c: any) => ({ name: c._id, books: c.books, sales: c.sales })),
    userGrowth: userGrowth.map((u: any) => ({ month: u._id, count: u.count })),
    topBooks,
    readingStats: readingStats[0] || { avgTime: 0, totalReads: 0, completed: 0 }
  }
})