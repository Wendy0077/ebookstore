import { randomUUID } from 'crypto'
import { PDFDocument } from 'pdf-lib'
import { uploadToS3 } from '../../utils/s3'

export default defineEventHandler(async (event) => {
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
        throw createError({ statusCode: 400, message: 'ไม่พบไฟล์ที่อัปโหลด' })
    }

    const file = formData.find(f => f.name === 'pdf')
    if (!file || !file.data) {
        throw createError({ statusCode: 400, message: 'ไม่พบไฟล์ PDF' })
    }

    if (!file.type || file.type !== 'application/pdf') {
        throw createError({ statusCode: 400, message: 'รองรับเฉพาะไฟล์ PDF เท่านั้น' })
    }

    const maxSize = 50 * 1024 * 1024
    if (file.data.length > maxSize) {
        throw createError({ statusCode: 400, message: 'ขนาดไฟล์ต้องไม่เกิน 50MB' })
    }

    let pageCount = 0
    try {
        const pdfDoc = await PDFDocument.load(file.data, { ignoreEncryption: true })
        pageCount = pdfDoc.getPageCount()
    }
    catch {}

    const originalName = file.filename?.replace(/[^a-zA-Z0-9._-]/g, '_') || 'book.pdf'
    const key = `books/${randomUUID()}_${originalName}`

    await uploadToS3(key, file.data, 'application/pdf')

    return {
        url: key,
        filename: key,
        originalName: file.filename || 'book.pdf',
        size: file.data.length,
        pageCount
    }
})