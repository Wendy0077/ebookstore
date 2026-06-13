import Review from '../../models/Review'
import Book from '../../models/Book'
import Order from '../../models/Order'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const bookId = getRouterParam(event, 'bookId')
  const body = await readBody(event)

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณาให้คะแนน 1-5' })
  }

  // Check if user has purchased or rented this book
  const hasPurchased = await Order.findOne({
    user: user.userId,
    'items.book': bookId,
    status: 'paid'
  })

  if (!hasPurchased) {
    throw createError({ statusCode: 403, statusMessage: 'ขออภัย เฉพาะผู้ที่ซื้อหนังสือเล่มนี้แล้วเท่านั้นจึงจะสามารถรีวิวได้' })
  }

  // Check existing review
  const existing = await Review.findOne({ user: user.userId, book: bookId })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'คุณรีวิวหนังสือนี้แล้ว' })
  }

  const review = await Review.create({
    user: user.userId,
    book: bookId,
    rating: body.rating,
    comment: body.comment || ''
  })

  // Update book rating
  const reviews = await Review.find({ book: bookId })
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  await Book.findByIdAndUpdate(bookId, {
    rating: Math.round(avgRating * 10) / 10,
    reviewCount: reviews.length
  })

  return review
})
