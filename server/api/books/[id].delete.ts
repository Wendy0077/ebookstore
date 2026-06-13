import Book from '../../models/Book'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')

  const book = await Book.findByIdAndDelete(id)
  if (!book) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบหนังสือ' })
  }

  return { message: 'ลบหนังสือเรียบร้อย' }
})
