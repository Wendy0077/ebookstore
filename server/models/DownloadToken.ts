import mongoose from 'mongoose'
import crypto from 'crypto'

const downloadTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  token: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(32).toString('hex')
  },
  maxDownloads: {
    type: Number,
    default: 3
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
})

downloadTokenSchema.index({ user: 1, book: 1 })

export const DownloadToken = (mongoose.models.DownloadToken || mongoose.model('DownloadToken', downloadTokenSchema)) as mongoose.Model<any>
export default DownloadToken
