import Review from '../../../models/Review'
import { requireAdmin } from '../../../utils/auth'
import { recalculateBookRating } from '../../../utils/reviews'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const review = await Review.findByIdAndDelete(id)
  if (!review) throw createError({ statusCode: 404, message: 'ไม่พบรีวิว' })

  await recalculateBookRating(review.book)

  return { message: 'ลบรีวิวเรียบร้อย' }
})