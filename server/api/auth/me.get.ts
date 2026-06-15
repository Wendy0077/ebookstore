import User from '../../models/User'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)

  const user = await User.findById(payload.userId).select('-password')
  if (!user) {
    throw createError({ statusCode: 404, message: 'ไม่พบผู้ใช้งาน' })
  }

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt
  }
})
