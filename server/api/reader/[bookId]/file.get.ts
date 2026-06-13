import { readFile } from 'fs/promises'
import { join } from 'path'
import AccessControl from '../../../models/AccessControl'
import Book from '../../../models/Book'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const bookId = getRouterParam(event, 'bookId')
  const now = new Date()

  const ac = await AccessControl.findOne({ user: user.userId, book: bookId, isActive: true })
  if (!ac) throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึงหนังสือนี้' })

  if (ac.accessType === 'rental' && ac.rentalExpireAt && ac.rentalExpireAt < now) {
    await AccessControl.updateOne({ _id: ac._id }, { isActive: false })
    throw createError({ statusCode: 403, statusMessage: 'สิทธิ์การเช่าหมดอายุแล้ว' })
  }

  const book = await Book.findById(bookId).select('fileKey').lean() as any
  if (!book?.fileKey) throw createError({ statusCode: 404, statusMessage: 'ไม่พบไฟล์หนังสือ' })

  const filePath = join(process.cwd(), 'public', book.fileKey)
  const data = await readFile(filePath)

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', 'inline; filename="book.pdf"')
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')

  return data
})