import Notification from '../../models/Notification'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: user.userId }).sort({ createdAt: -1 }).limit(20).lean(),
    Notification.countDocuments({ user: user.userId, isRead: false })
  ])

  return { notifications, unreadCount }
})
