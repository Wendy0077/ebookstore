import User from '../../models/User'
import Book from '../../models/Book'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)
  const body = await readBody(event)

  const { bookId } = body || {}

  if (!bookId) {
    throw createError({ statusCode: 400, message: 'กรุณาระบุ bookId' })
  }

  const book = await Book.findById(bookId).select('_id')
  if (!book) {
    throw createError({ statusCode: 404, message: 'ไม่พบหนังสือ' })
  }

  const user = await User.findById(payload.userId).select('wishlist')
  if (!user) {
    throw createError({ statusCode: 404, message: 'ไม่พบผู้ใช้งาน' })
  }

  const current = (user.wishlist || []).map((id: any) => id.toString())
  const exists = current.includes(String(bookId))

  if (exists) {
    user.wishlist = user.wishlist.filter((id: any) => id.toString() !== String(bookId))
  } else {
    user.wishlist.push(book._id)
  }

  await user.save()

  return {
    liked: !exists,
    ids: (user.wishlist || []).map((id: any) => id.toString())
  }
})
