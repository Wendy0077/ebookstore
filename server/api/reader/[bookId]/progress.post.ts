import AccessControl from '../../../models/AccessControl'
import Book from '../../../models/Book'
import ReadingHistory from '../../../models/ReadingHistory'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const bookId = getRouterParam(event, 'bookId')
  const body = await readBody(event)

  const page = parseInt(body.page) || 0

  const [ac, book] = await Promise.all([
    AccessControl.findOne({ user: user.userId, book: bookId, isActive: true }),
    Book.findById(bookId).select('pageCount').lean() as Promise<any>
  ])

  if (!ac) throw createError({ statusCode: 403, message: 'ไม่มีสิทธิ์เข้าถึง' })

  // Use authoritative pageCount from DB; fall back to client value only if DB has none
  const totalPages = (book?.pageCount > 0 ? book.pageCount : parseInt(body.totalPages)) || 0

  await Promise.all([
    AccessControl.updateOne({ _id: ac._id }, { lastReadPage: page }),
    ReadingHistory.findOneAndUpdate(
      { user: user.userId, book: bookId },
      {
        currentPage: page,
        totalPages,
        lastReadAt: new Date(),
        completed: totalPages > 0 && page >= totalPages,
        $inc: { readingTimeMinutes: body.minutesRead || 0 }
      },
      { upsert: true, new: true }
    )
  ])

  return { ok: true, page, totalPages }
})