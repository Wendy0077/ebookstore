import { randomUUID } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { PDFDocument } from 'pdf-lib'

export default defineEventHandler(async (event) => {
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'ไม่พบไฟล์ที่อัปโหลด' })
    }

    const file = formData.find(f => f.name === 'pdf')
    if (!file || !file.data) {
        throw createError({ statusCode: 400, statusMessage: 'ไม่พบไฟล์ PDF' })
    }

    if (!file.type || file.type !== 'application/pdf') {
        throw createError({
            statusCode: 400,
            statusMessage: 'รองรับเฉพาะไฟล์ PDF เท่านั้น'
        })
    }

    const maxSize = 50 * 1024 * 1024
    if (file.data.length > maxSize) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ขนาดไฟล์ต้องไม่เกิน 50MB'
        })
    }

    // Count PDF pages
    let pageCount = 0
    try {
        const pdfDoc = await PDFDocument.load(file.data, { ignoreEncryption: true })
        pageCount = pdfDoc.getPageCount()
    } catch { }

    const originalName = file.filename?.replace(/[^a-zA-Z0-9._-]/g, '_') || 'book.pdf'
    const filename = `${randomUUID()}_${originalName}`

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'books')
    await mkdir(uploadDir, { recursive: true })

    const filePath = join(uploadDir, filename)
    await writeFile(filePath, file.data)

    return {
        url: `/uploads/books/${filename}`,
        filename,
        originalName: file.filename || 'book.pdf',
        size: file.data.length,
        pageCount
    }
})
