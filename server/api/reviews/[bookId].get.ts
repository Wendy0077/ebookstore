import Review from '../../models/Review'

export default defineEventHandler(async (event) => {
  const bookId = getRouterParam(event, 'bookId')
  const query = getQuery(event)

  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 10
  const skip = (page - 1) * limit

  const [reviews, total] = await Promise.all([
    Review.find({ book: bookId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ book: bookId })
  ])

  return { reviews, total, page, totalPages: Math.ceil(total / limit) }
})
