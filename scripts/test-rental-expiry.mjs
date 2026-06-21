import mongoose from 'mongoose'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

function loadEnv() {
  const env = {}
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
  return env
}

const env = loadEnv()
const mode = process.argv[2] || 'list'
const id = process.argv[3]

await mongoose.connect(env.MONGODB_URI)

const accessControlSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' }
}, { strict: false })
const AccessControl = mongoose.model('AccessControl', accessControlSchema)
mongoose.model('User', new mongoose.Schema({}, { strict: false }))
mongoose.model('Book', new mongoose.Schema({}, { strict: false }))
const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }))

if (mode === 'list') {
  const rentals = await AccessControl.find({ accessType: 'rental', isActive: true })
    .populate('book', 'title')
    .populate('user', 'email')
    .lean()

  console.log(`พบ rental ที่ active อยู่ ${rentals.length} รายการ:\n`)
  for (const r of rentals) {
    console.log(`_id: ${r._id}`)
    console.log(`  หนังสือ: ${r.book?.title || '(ไม่พบ)'}`)
    console.log(`  ผู้ใช้: ${r.user?.email || '(ไม่พบ)'}`)
    console.log(`  rentalExpireAt: ${r.rentalExpireAt}`)
    console.log(`  expiryNotifiedAt: ${r.expiryNotifiedAt}`)
    console.log('')
  }
} else if (mode === 'set-expiring') {
  if (!id) {
    console.error('ต้องระบุ _id ของ rental เช่น: node scripts/test-rental-expiry.mjs set-expiring <id>')
    process.exit(1)
  }
  const newExpire = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  const result = await AccessControl.updateOne(
    { _id: id },
    { rentalExpireAt: newExpire, expiryNotifiedAt: null }
  )
  console.log(`อัปเดตแล้ว: matched=${result.matchedCount} modified=${result.modifiedCount}`)
  console.log(`rentalExpireAt ใหม่: ${newExpire}`)
} else if (mode === 'check-notifications') {
  const notifs = await Notification.find({ type: 'rental_expiring' }).sort({ createdAt: -1 }).limit(10).lean()
  console.log(`แจ้งเตือนล่าสุด (${notifs.length}):\n`)
  for (const n of notifs) {
    console.log(`${n.createdAt} | user=${n.user} | ${n.title} - ${n.message}`)
  }
}

await mongoose.disconnect()
