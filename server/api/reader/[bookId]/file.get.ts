import AccessControl from '../../../models/AccessControl'
import Book from '../../../models/Book'
import { requireAuth } from '../../../utils/auth'
import { assertRentalNotExpired } from '../../../utils/access'
import { getS3ObjectStream } from '../../../utils/s3'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const bookId = getRouterParam(event, 'bookId')

  const [ac, book] = await Promise.all([
    AccessControl.findOne({ user: user.userId, book: bookId, isActive: true }),
    Book.findById(bookId).select('fileKey').lean() as Promise<any>
  ])
  if (!ac) throw createError({ statusCode: 403, message: 'ไม่มีสิทธิ์เข้าถึงหนังสือนี้' })

  await assertRentalNotExpired(ac)

  if (!book?.fileKey) {
    console.error(`[reader/file] book ${bookId} has no fileKey`)
    throw createError({ statusCode: 404, message: 'ไม่พบไฟล์หนังสือ' })
  }

  // Pass the client's Range header through to R2 so pdf.js can fetch only the
  // byte ranges it needs instead of downloading the entire file up front.
  const range = getHeader(event, 'range')

  let result
  try {
    result = await getS3ObjectStream(book.fileKey, range)
  }
  catch (err: any) {
    console.error(`[reader/file] S3 error for key "${book.fileKey}":`, err?.message, err?.Code, err?.$metadata)
    throw createError({ statusCode: 404, message: 'ไม่พบไฟล์หนังสือ' })
  }

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', 'inline; filename="book.pdf"')
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Accept-Ranges', 'bytes')
  if (result.contentLength != null) setHeader(event, 'Content-Length', result.contentLength)

  if (result.contentRange) {
    setHeader(event, 'Content-Range', result.contentRange)
    setResponseStatus(event, 206)
  }

  return sendStream(event, result.body)
})
