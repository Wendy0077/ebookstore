import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// Parse .env manually
function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  try {
    const content = readFileSync(join(rootDir, '.env'), 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      env[key] = val
    }
  } catch {
    console.error('ไม่พบไฟล์ .env')
    process.exit(1)
  }
  return env
}

function walkDir(dir: string): string[] {
  const results: string[] = []
  try {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) {
        results.push(...walkDir(full))
      } else {
        results.push(full)
      }
    }
  } catch {}
  return results
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif'
  }
  return map[ext ?? ''] ?? 'application/octet-stream'
}

async function main() {
  const env = loadEnv()

  const endpoint = env.NUXT_S3_ENDPOINT || env.S3_ENDPOINT || ''
  const region = env.NUXT_S3_REGION || env.S3_REGION || 'auto'
  const bucket = env.NUXT_S3_BUCKET || env.S3_BUCKET || ''
  const accessKey = env.NUXT_S3_ACCESS_KEY || env.S3_ACCESS_KEY || ''
  const secretKey = env.NUXT_S3_SECRET_KEY || env.S3_SECRET_KEY || ''

  if (!bucket || !accessKey || !secretKey || !endpoint) {
    console.error('ขาด S3 config: ต้องมี NUXT_S3_ENDPOINT, NUXT_S3_BUCKET, NUXT_S3_ACCESS_KEY, NUXT_S3_SECRET_KEY')
    process.exit(1)
  }

  console.log(`R2 endpoint: ${endpoint}`)
  console.log(`Bucket: ${bucket}`)

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey }
  })

  const uploadsDir = join(rootDir, 'public', 'uploads')
  const files = walkDir(uploadsDir)

  if (files.length === 0) {
    console.log('ไม่พบไฟล์ใน public/uploads/')
    return
  }

  console.log(`\nพบ ${files.length} ไฟล์ — เริ่ม upload...\n`)

  let success = 0
  let skipped = 0
  let failed = 0

  for (const filePath of files) {
    const rel = relative(join(rootDir, 'public'), filePath).replace(/\\/g, '/')
    // rel = "uploads/books/uuid_name.pdf" or "uploads/covers/uuid.jpg"

    // Check if already exists in R2
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: rel }))
      console.log(`  SKIP  ${rel}`)
      skipped++
      continue
    } catch {}

    try {
      const body = readFileSync(filePath)
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: rel,
        Body: body,
        ContentType: getMimeType(filePath)
      }))
      console.log(`  OK    ${rel}`)
      success++
    } catch (err: any) {
      console.error(`  FAIL  ${rel} — ${err?.message}`)
      failed++
    }
  }

  console.log(`\nเสร็จ: ${success} อัปโหลดสำเร็จ, ${skipped} ข้าม (มีอยู่แล้ว), ${failed} ล้มเหลว`)
}

main()