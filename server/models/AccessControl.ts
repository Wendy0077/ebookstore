import mongoose from 'mongoose'

const accessControlSchema = new mongoose.Schema({
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
  accessType: {
    type: String,
    enum: ['purchase', 'rental'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rentalExpireAt: {
    type: Date,
    default: null
  },
  expiryNotifiedAt: {
    type: Date,
    default: null
  },
  lastReadPage: {
    type: Number,
    default: 0
  },
  watermarkText: {
    type: String,
    default: ''
  },
  deviceFingerprints: [{
    type: String
  }]
}, {
  timestamps: true
})

accessControlSchema.index({ user: 1, book: 1 })
accessControlSchema.index({ user: 1, isActive: 1 })
accessControlSchema.index({ rentalExpireAt: 1 })

export const AccessControl = (mongoose.models.AccessControl || mongoose.model('AccessControl', accessControlSchema)) as mongoose.Model<any>
export default AccessControl
