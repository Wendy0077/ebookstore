import { randomUUID } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
    // Read multipart form data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'ไม่พบไฟล์ที่อัปโหลด' })
    }

    const file = formData.find(f => f.name === 'cover')
    if (!file || !file.data) {
        throw createError({ statusCode: 400, statusMessage: 'ไม่พบไฟล์ปกหนังสือ' })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!file.type || !allowedTypes.includes(file.type)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'รองรับเฉพาะไฟล์ภาพ (JPEG, PNG, WebP, GIF)'
        })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.data.length > maxSize) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ขนาดไฟล์ต้องไม่เกิน 5MB'
        })
    }

    // Generate unique filename
    const ext = file.filename?.split('.').pop() || 'jpg'
    const filename = `${randomUUID()}.${ext}`

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'covers')
    await mkdir(uploadDir, { recursive: true })

    // Save file
    const filePath = join(uploadDir, filename)
    await writeFile(filePath, file.data)

    // Return the public URL path
    return {
        url: `/uploads/covers/${filename}`,
        filename
    }
})
