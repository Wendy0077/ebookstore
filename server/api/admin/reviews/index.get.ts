import Review from '../../../models/Review'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20

  const [reviews, total] = await Promise.all([
    Review.find()
      .populate('user', 'name email')
      .populate('book', 'title author coverImage')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments()
  ])

  return { reviews, total, page, totalPages: Math.ceil(total / limit) }
})