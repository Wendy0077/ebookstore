import mongoose from 'mongoose'

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  isbn: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  rentalPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  rentalDurationDays: {
    type: Number,
    default: 30
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  coverImage: {
    type: String,
    default: ''
  },
  fileKey: {
    type: String,
    default: ''
  },
  pageCount: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    default: 'th'
  },
  publisher: {
    type: String,
    default: ''
  },
  publishedYear: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isRentable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

bookSchema.index(
  { title: 'text', author: 'text', description: 'text', tags: 'text' },
  { default_language: 'none', language_override: 'searchLanguage' }
)
bookSchema.index({ category: 1 })
bookSchema.index({ price: 1 })
bookSchema.index({ rating: -1 })
bookSchema.index({ salesCount: -1 })

export const Book = (mongoose.models.Book || mongoose.model('Book', bookSchema)) as mongoose.Model<any>
export default Book
