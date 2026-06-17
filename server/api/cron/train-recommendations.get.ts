import { connectDB } from '../../utils/db'
import { trainAllRecommendations } from '../../utils/recommendationEngine'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const authHeader = getHeader(event, 'authorization')?.replace('Bearer ', '')
  const provided = (query.secret as string) || authHeader

  if (config.cronSecret && provided !== config.cronSecret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  await connectDB()
  const result = await trainAllRecommendations()
  return result
})
