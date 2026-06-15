import User from '../../../models/User'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const allowed: any = {}
  if (body.role !== undefined && ['user', 'admin'].includes(body.role)) allowed.role = body.role
  if (body.status !== undefined && ['active', 'banned'].includes(body.status)) allowed.status = body.status

  const user = await User.findByIdAndUpdate(id, allowed, { new: true }).select('-password')
  if (!user) throw createError({ statusCode: 404, message: 'ไม่พบผู้ใช้' })

  return user
})