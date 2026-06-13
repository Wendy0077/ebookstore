import mongoose from 'mongoose'

const cartItemSchema = new mongoose.Schema({
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

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema]
}, {
  timestamps: true
})

export const Cart = (mongoose.models.Cart || mongoose.model('Cart', cartSchema)) as mongoose.Model<any>
export default Cart
