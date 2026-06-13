import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  type: {
    type: String,
    enum: ['purchase', 'rental'],
    default: 'purchase'
  },
  price: {
    type: Number,
    required: true
  }
})

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  stripePaymentId: {
    type: String,
    default: ''
  },
  stripeSessionId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
})

orderSchema.index({ user: 1, createdAt: -1 })

export const Order = (mongoose.models.Order || mongoose.model('Order', orderSchema)) as mongoose.Model<any>
export default Order
