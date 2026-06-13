import AccessControl from '../../models/AccessControl'
import Book from '../../models/Book'
import ReadingHistory from '../../models/ReadingHistory'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const bookId = getRouterParam(event, 'bookId')
  const now = new Date()

  const ac = await AccessControl.findOne({ user: user.userId, book: bookId, isActive: true })
  if (!ac) throw createError({ statusCode: 403, statusMessage: 'คุณไม่มีสิทธิ์อ่านหนังสือเล่มนี้' })

  if (ac.accessType === 'rental' && ac.rentalExpireAt && ac.rentalExpireAt < now) {
    await AccessControl.updateOne({ _id: ac._id }, { isActive: false })
    throw createError({ statusCode: 403, statusMessage: 'สิทธิ์การเช่าหมดอายุแล้ว' })
  }

  const book = await Book.findById(bookId).select('title author pageCount coverImage fileKey').lean() as any
  if (!book) throw createError({ statusCode: 404, statusMessage: 'ไม่พบหนังสือ' })

  if (!book.fileKey) throw createError({ statusCode: 404, statusMessage: 'ไม่พบไฟล์หนังสือ' })

  const history = await ReadingHistory.findOne({ user: user.userId, book: bookId }).lean() as any

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