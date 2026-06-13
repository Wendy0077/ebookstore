import User from '../../models/User'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)

  const user = (await User.findById(payload.userId)
    .select('wishlist')
    .populate('wishlist')
    .lean()) as any

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบผู้ใช้งาน' })
  }

  const wishlist = (user.wishlist || []) as any[]

  return {
    ids: wishlist.map((b: any) => (b?._id ? b._id.toString() : b.toString())),
    books: wishlist
  }
})
