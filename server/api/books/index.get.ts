import Book from '../../models/Book'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 12
  const skip = (page - 1) * limit

  // Build filter
  const filter: any = { isActive: true }

  if (query.category) {
    filter.category = query.category
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {}
    if (query.minPrice) filter.price.$gte = parseFloat(query.minPrice as string)
    if (query.maxPrice) filter.price.$lte = parseFloat(query.maxPrice as string)
  }

  if (query.search) {
    filter.$text = { $search: query.search as string }
  }

  if (query.featured === 'true') {
    filter.isFeatured = true
  }

  if (query.rentable === 'true') {
    filter.isRentable = true
  }

  // Build sort
  let sort: any = { createdAt: -1 }
  if (query.sort === 'price_asc') sort = { price: 1 }
  else if (query.sort === 'price_desc') sort = { price: -1 }
  else if (query.sort === 'rating') sort = { rating: -1 }
  else if (query.sort === 'popular') sort = { salesCount: -1 }
  else if (query.sort === 'title') sort = { title: 1 }

  const [books, total] = await Promise.all([
    Book.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Book.countDocuments(filter)
  ])

  // Get available categories for filters
  const categories = await Book.distinct('category', { isActive: true })

  return {
    books,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    categories
  }
})
