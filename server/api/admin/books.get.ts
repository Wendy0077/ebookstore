import Book from '../../models/Book'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const query = getQuery(event)
  const limit = parseInt(query.limit as string) || 100

  const books = await Book.find({}).sort({ createdAt: -1 }).limit(limit).lean()

  return { books, total: books.length }
})
