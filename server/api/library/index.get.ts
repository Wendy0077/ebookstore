import AccessControl from '../../models/AccessControl'
import ReadingHistory from '../../models/ReadingHistory'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const now = new Date()

  const accesses = await AccessControl.find({ user: user.userId, isActive: true })
    .populate('book')
    .lean() as any[]

  const purchased: any[] = []
  const rented: any[] = []
  const expired: any[] = []

  for (const ac of accesses) {
    if (!ac.book) continue
    if (ac.accessType === 'rental') {
      if (ac.rentalExpireAt && ac.rentalExpireAt < now) {
        expired.push({ ...ac.book, accessControl: ac })
        await AccessControl.updateOne({ _id: ac._id }, { isActive: false })
      } else {
        rented.push({ ...ac.book, accessControl: ac })
      }
    } else {
      purchased.push({ ...ac.book, accessControl: ac })
    }
  }

  const bookIds = [...purchased, ...rented].map((b: any) => b._id)
  const histories = await ReadingHistory.find({ user: user.userId, book: { $in: bookIds } }).lean() as any[]
  const historyMap = Object.fromEntries(histories.map((h: any) => [h.book.toString(), h]))

  const enrich = (b: any) => ({ ...b, readingHistory: historyMap[b._id?.toString()] || null })

  return {
    purchased: purchased.map(enrich),
    rented: rented.map(enrich),
    expired
  }
})
