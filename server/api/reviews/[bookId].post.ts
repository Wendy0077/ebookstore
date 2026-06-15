import Review from '../../models/Review'
import Order from '../../models/Order'
import { requireAuth } from '../../utils/auth'
import { recalculateBookRating } from '../../utils/reviews'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const bookId = getRouterParam(event, 'bookId')
  const body = await readBody(event)

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    throw createError({ statusCode: 400, message: 'กรุณาให้คะแนน 1-5' })
  }

  // Check if user has purchased or rented this book
  const hasPurchased = await Order.findOne({
    user: user.userId,
    'items.book': bookId,
    status: 'paid'
  })

  if (!hasPurchased) {
    throw createError({ statusCode: 403, message: 'ขออภัย เฉพาะผู้ที่ซื้อหนังสือเล่มนี้แล้วเท่านั้นจึงจะสามารถรีวิวได้' })
  }

  // Check existing review
  const existing = await Review.findOne({ user: user.userId, book: bookId })
  if (existing) {
    throw createError({ statusCode: 409, message: 'คุณรีวิวหนังสือนี้แล้ว' })
  }

  const review = await Review.create({
    user: user.userId,
    book: bookId,
    rating: body.rating,
    comment: body.comment || ''
  })

  await recalculateBookRating(bookId)

  return review
})
