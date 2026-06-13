import Review from '../../../models/Review'
import Book from '../../../models/Book'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const review = await Review.findByIdAndDelete(id)
  if (!review) throw createError({ statusCode: 404, statusMessage: 'ไม่พบรีวิว' })

  const reviews = await Review.find({ book: review.book })
  if (reviews.length > 0) {
    const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
    await Book.updateOne({ _id: review.book }, { rating: Math.round(avg * 10) / 10, reviewCount: reviews.length })
  } else {
    await Book.updateOne({ _id: review.book }, { rating: 0, reviewCount: 0 })
  }

  return { message: 'ลบรีวิวเรียบร้อย' }
})