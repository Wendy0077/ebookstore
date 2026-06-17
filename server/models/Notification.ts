import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['rental_expiring'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

notificationSchema.index({ user: 1, createdAt: -1 })

export const Notification = (mongoose.models.Notification || mongoose.model('Notification', notificationSchema)) as mongoose.Model<any>
export default Notification
