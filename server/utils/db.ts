import mongoose from 'mongoose'

let connectionPromise: Promise<void> | null = null

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return

  if (!connectionPromise) {
    const config = useRuntimeConfig()
    const uri = config.mongodbUri
    connectionPromise = mongoose.connect(uri).then(() => {
      console.log('✅ MongoDB connected')
    }).catch((error) => {
      connectionPromise = null
      console.error('❌ MongoDB connection error:', error)
      throw error
    })

    mongoose.connection.on('disconnected', () => {
      connectionPromise = null
    })
  }

  return connectionPromise
}
