import DownloadToken from '../../models/DownloadToken'
import Book from '../../models/Book'
import User from '../../models/User'
import { getS3Object } from '../../utils/s3'
import { watermarkPdf } from '../../utils/watermark'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  const downloadToken = await DownloadToken.findOne({ token })
  if (!downloadToken) {
    throw createError({ statusCode: 404, message: 'ไม่พบ Token หรือ Token ไม่ถูกต้อง' })
  }

  // Check expiry
  if (new Date() > downloadToken.expiresAt) {
    throw createError({ statusCode: 410, message: 'Token หมดอายุแล้ว' })
  }

  // Check download count
  if (downloadToken.downloadCount >= downloadToken.maxDownloads) {
    throw createError({ statusCode: 403, message: `ดาวน์โหลดครบ ${downloadToken.maxDownloads} ครั้งแล้ว` })
  }

  const [book, user] = await Promise.all([
    Book.findById(downloadToken.book),
    User.findById(downloadToken.user)
  ])

  if (!book || !book.fileKey) {
    throw createError({ statusCode: 404, message: 'ไม่พบไฟล์หนังสือ' })
  }

  // Get PDF from S3
  let pdfBytes: Buffer
  try {
    pdfBytes = await getS3Object(book.fileKey)
  } catch {
    throw createError({ statusCode: 500, message: 'ไม่สามารถดาวน์โหลดไฟล์ได้' })
  }

  // Watermark PDF
  const watermarkedPdf = await watermarkPdf(
    pdfBytes,
    user?.email || 'unknown',
    downloadToken.order.toString()
  )

  // Increment download count
  downloadToken.downloadCount += 1
  await downloadToken.save()

  // Send file response
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(book.title)}.pdf"`)
  setHeader(event, 'Content-Length', String(watermarkedPdf.length) as any)

  // Security headers
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, private')
  setHeader(event, 'X-Download-Remaining', (downloadToken.maxDownloads - downloadToken.downloadCount).toString())

  return watermarkedPdf
})
