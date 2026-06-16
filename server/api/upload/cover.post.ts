import { randomUUID } from 'crypto'
import { uploadToS3 } from '../../utils/s3'

export default defineEventHandler(async (event) => {
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
        throw createError({ statusCode: 400, message: 'ไม่พบไฟล์ที่อัปโหลด' })
    }

    const file = formData.find(f => f.name === 'cover')
    if (!file || !file.data) {
        throw createError({ statusCode: 400, message: 'ไม่พบไฟล์ปกหนังสือ' })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!file.type || !allowedTypes.includes(file.type)) {
        throw createError({ statusCode: 400, message: 'รองรับเฉพาะไฟล์ภาพ (JPEG, PNG, WebP, GIF)' })
    }

    const maxSize = 5 * 1024 * 1024
    if (file.data.length > maxSize) {
        throw createError({ statusCode: 400, message: 'ขนาดไฟล์ต้องไม่เกิน 5MB' })
    }

    const ext = file.filename?.split('.').pop() || 'jpg'
    const filename = `${randomUUID()}.${ext}`
    const key = `covers/${filename}`

    await uploadToS3(key, file.data, file.type)

    return {
        url: `/api/covers/${filename}`,
        filename
    }
})