import mongoose from 'mongoose'

const rentalSchema = new mongoose.Schema({
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
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'returned'],
    default: 'active'
  }
}, {
  timestamps: true
})

rentalSchema.index({ user: 1, status: 1 })
rentalSchema.index({ endDate: 1 })

export const Rental = (mongoose.models.Rental || mongoose.model('Rental', rentalSchema)) as mongoose.Model<any>
export default Rental
