import { getS3Object } from '../../utils/s3'

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif'
}

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')
  if (!filename) throw createError({ statusCode: 400 })

  let data: Buffer
  try {
    data = await getS3Object(`covers/${filename}`)
  }
  catch {
    throw createError({ statusCode: 404, message: 'ไม่พบรูปภาพ' })
  }

  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
  setHeader(event, 'Content-Type', CONTENT_TYPES[ext] || 'image/jpeg')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')

  return data
})