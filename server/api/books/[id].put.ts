import Book from '../../models/Book'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const book = await Book.findByIdAndUpdate(id, body, { new: true })
  if (!book) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบหนังสือ' })
  }

  return book
})
