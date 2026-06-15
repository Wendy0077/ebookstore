import Review from '../models/Review'
import Book from '../models/Book'

export async function recalculateBookRating(bookId: any): Promise<void> {
  const reviews = await Review.find({ book: bookId })
  if (reviews.length > 0) {
    const avg = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    await Book.updateOne({ _id: bookId }, { rating: Math.round(avg * 10) / 10, reviewCount: reviews.length })
  } else {
    await Book.updateOne({ _id: bookId }, { rating: 0, reviewCount: 0 })
  }
}