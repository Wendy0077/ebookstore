import Notification from '../../models/Notification'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  await Notification.updateMany({ user: user.userId, isRead: false }, { isRead: true })
  return { success: true }
})
