import Book from '../../models/Book'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const allowed = [
    'title', 'author', 'description', 'isbn', 'price', 'rentalPrice',
    'rentalDurationDays', 'category', 'tags', 'coverImage', 'fileKey',
    'pageCount', 'language', 'publisher', 'publishedYear',
    'isActive', 'isFeatured', 'isRentable'
  ]
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  const book = await Book.findByIdAndUpdate(id, { $set: update }, { new: true })
  if (!book) {
    throw createError({ statusCode: 404, message: 'ไม่พบหนังสือ' })
  }

  return book
})
