import { connectDB } from '../../utils/db'
import AccessControl from '../../models/AccessControl'
import Notification from '../../models/Notification'

const REMINDER_WINDOW_DAYS = 3

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const authHeader = getHeader(event, 'authorization')?.replace('Bearer ', '')
  const provided = (query.secret as string) || authHeader

  if (config.cronSecret && provided !== config.cronSecret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  await connectDB()

  const now = new Date()
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const expiring = await AccessControl.find({
    accessType: 'rental',
    isActive: true,
    expiryNotifiedAt: null,
    rentalExpireAt: { $gte: now, $lte: windowEnd }
  }).populate('book', 'title').lean()

  let notified = 0
  for (const ac of expiring as Array<typeof expiring[number] & { book: { _id: string, title: string } | null }>) {
    if (!ac.book) continue

    const daysLeft = Math.max(1, Math.ceil((ac.rentalExpireAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))

    await Notification.create({
      user: ac.user,
      type: 'rental_expiring',
      title: 'การเช่าหนังสือใกล้หมดอายุ',
      message: `"${ac.book.title}" จะหมดสิทธิ์เช่าในอีก ${daysLeft} วัน`,
      book: ac.book._id
    })

    await AccessControl.updateOne({ _id: ac._id }, { expiryNotifiedAt: now })
    notified++
  }

  return { notified, checked: expiring.length }
})
