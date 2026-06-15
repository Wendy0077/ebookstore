import { readFile } from 'fs/promises'
import { join } from 'path'
import AccessControl from '../../../models/AccessControl'
import Book from '../../../models/Book'
import { requireAuth } from '../../../utils/auth'
import { assertRentalNotExpired } from '../../../utils/access'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const bookId = getRouterParam(event, 'bookId')

  const [ac, book] = await Promise.all([
    AccessControl.findOne({ user: user.userId, book: bookId, isActive: true }),
    Book.findById(bookId).select('fileKey').lean() as Promise<any>
  ])
  if (!ac) throw createError({ statusCode: 403, message: 'ไม่มีสิทธิ์เข้าถึงหนังสือนี้' })

  await assertRentalNotExpired(ac)

  if (!book?.fileKey) throw createError({ statusCode: 404, message: 'ไม่พบไฟล์หนังสือ' })

  const filePath = join(process.cwd(), 'public', book.fileKey)
  const data = await readFile(filePath)

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', 'inline; filename="book.pdf"')
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')

  return data
})