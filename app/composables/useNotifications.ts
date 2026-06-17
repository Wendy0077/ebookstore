interface AppNotification {
  _id: string
  type: string
  title: string
  message: string
  book?: string
  isRead: boolean
  createdAt: string
}

export const useNotifications = () => {
  const notifications = useState<AppNotification[]>('notifications', () => [])
  const unreadCount = useState<number>('notifications_unread_count', () => 0)

  const fetchNotifications = async () => {
    try {
      const data = await $fetch<{ notifications: AppNotification[], unreadCount: number }>('/api/notifications')
      notifications.value = data.notifications
      unreadCount.value = data.unreadCount
    } catch {
      notifications.value = []
      unreadCount.value = 0
    }
  }

  const markAsRead = async (id: string) => {
    const target = notifications.value.find(n => n._id === id)
    if (!target || target.isRead) return
    target.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    await $fetch(`/api/notifications/${id}/read`, { method: 'POST' })
  }

  const markAllAsRead = async () => {
    notifications.value.forEach(n => n.isRead = true)
    unreadCount.value = 0
    await $fetch('/api/notifications/read-all', { method: 'POST' })
  }

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  }
}
