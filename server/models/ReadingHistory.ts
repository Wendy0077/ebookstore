import mongoose from 'mongoose'

const readingHistorySchema = new mongoose.Schema({
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
  currentPage: {
    type: Number,
    default: 0
  },
  totalPages: {
    type: Number,
    default: 0
  },
  lastReadAt: {
    type: Date,
    default: Date.now
  },
  readingTimeMinutes: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

readingHistorySchema.index({ user: 1, book: 1 }, { unique: true })
readingHistorySchema.index({ user: 1, lastReadAt: -1 })

export const ReadingHistory = (mongoose.models.ReadingHistory || mongoose.model('ReadingHistory', readingHistorySchema)) as mongoose.Model<any>
export default ReadingHistory
