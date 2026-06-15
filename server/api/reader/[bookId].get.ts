import AccessControl from '../../models/AccessControl'
import Book from '../../models/Book'
import ReadingHistory from '../../models/ReadingHistory'
import { requireAuth } from '../../utils/auth'
import { assertRentalNotExpired } from '../../utils/access'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const bookId = getRouterParam(event, 'bookId')

  const ac = await AccessControl.findOne({ user: user.userId, book: bookId, isActive: true })
  if (!ac) throw createError({ statusCode: 403, message: 'คุณไม่มีสิทธิ์อ่านหนังสือเล่มนี้' })

  await assertRentalNotExpired(ac)

  const [book, history] = await Promise.all([
    Book.findById(bookId).select('title author pageCount coverImage fileKey').lean() as Promise<any>,
    ReadingHistory.findOne({ user: user.userId, book: bookId }).lean() as Promise<any>
  ])
  if (!book) throw createError({ statusCode: 404, message: 'ไม่พบหนังสือ' })
  if (!book.fileKey) throw createError({ statusCode: 404, message: 'ไม่พบไฟล์หนังสือ' })

  return {
    book: {
      _id: book._id,
      title: book.title,
      author: book.author,
      pageCount: book.pageCount,
      coverImage: book.coverImage,
      fileKey: book.fileKey
    },
    access: {
      type: ac.accessType,
      rentalExpireAt: ac.rentalExpireAt,
      lastReadPage: ac.lastReadPage || history?.currentPage || 0,
      watermarkText: ac.watermarkText
    },
    readingHistory: history
  }
})