import Notification from '../../../models/Notification'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')
  await Notification.updateOne({ _id: id, user: user.userId }, { isRead: true })
  return { success: true }
})
