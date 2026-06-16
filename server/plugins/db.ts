import { connectDB } from '../utils/db'

export default defineNitroPlugin(async () => {
  const uri = useRuntimeConfig().mongodbUri
  if (!uri || uri.includes('localhost')) {
    console.log('⏭️  Skipping DB connection (no Atlas URI configured)')
    return
  }
  await connectDB()
})