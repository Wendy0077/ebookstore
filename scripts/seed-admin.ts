import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bookverse.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234'
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin'

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: String,
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String, default: '' }
}, { timestamps: true })

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB')

  const User = mongoose.models.User || mongoose.model('User', userSchema)

  const existing = await User.findOne({ email: ADMIN_EMAIL })
  if (existing) {
    if (existing.role !== 'admin') {
      await User.updateOne({ _id: existing._id }, { role: 'admin' })
      console.log(`✅ Promoted existing user "${ADMIN_EMAIL}" to admin`)
    } else {
      console.log(`ℹ️  Admin "${ADMIN_EMAIL}" already exists`)
    }
    await mongoose.disconnect()
    return
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12)
  await User.create({ email: ADMIN_EMAIL, password: hashed, name: ADMIN_NAME, role: 'admin' })

  console.log('✅ Admin account created:')
  console.log(`   Email   : ${ADMIN_EMAIL}`)
  console.log(`   Password: ${ADMIN_PASSWORD}`)
  console.log('   ⚠️  กรุณาเปลี่ยนรหัสผ่านหลังจาก login ครั้งแรก')

  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})