import mongoose from 'mongoose'

const recommendationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  books: [{
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    },
    score: Number
  }],
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

export const Recommendation = (mongoose.models.Recommendation || mongoose.model('Recommendation', recommendationSchema)) as mongoose.Model<any>
export default Recommendation
