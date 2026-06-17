import Book from '../../models/Book'
import Order from '../../models/Order'
import Recommendation from '../../models/Recommendation'
import { getTokenFromEvent, verifyToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // Get user's purchase history if logged in
  let userBookIds: string[] = []
  let userId: string | null = null

  const token = getTokenFromEvent(event)
  if (token) {
    try {
      const payload = verifyToken(token)
      userId = payload.userId
      const orders = await Order.find({
        user: payload.userId,
        status: 'paid'
      }).lean()

      userBookIds = orders.flatMap((o: any) =>
        o.items.map((item: any) => item.book.toString())
      )
    } catch {
      // Not logged in, show generic recommendations
    }
  }

  // Prefer precomputed SVM recommendations if available
  let recommendedBooks: any[] = []
  if (userId) {
    const precomputed = await Recommendation.findOne({ user: userId }).lean() as any
    if (precomputed?.books?.length) {
      const bookIds = precomputed.books.map((b: any) => b.book)
      const found = await Book.find({ _id: { $in: bookIds }, isActive: true }).lean()
      const byId = new Map(found.map((b: any) => [b._id.toString(), b]))
      recommendedBooks = bookIds
        .map((id: any) => byId.get(id.toString()))
        .filter(Boolean)
    }
  }

  // If user has purchased books, fill remaining slots by same categories
  if (recommendedBooks.length < 6 && userBookIds.length > 0) {
    const purchasedBooks = await Book.find({ _id: { $in: userBookIds } }).lean()
    const categories = [...new Set(purchasedBooks.map((b: any) => b.category))]
    const existingIds = recommendedBooks.map((b: any) => b._id)

    const byCategory = await Book.find({
      _id: { $nin: [...userBookIds, ...existingIds] },
      category: { $in: categories },
      isActive: true
    })
      .sort({ rating: -1, salesCount: -1 })
      .limit(12 - recommendedBooks.length)
      .lean()

    recommendedBooks = [...recommendedBooks, ...byCategory]
  }

  // Fill with popular books if not enough recommendations
  if (!recommendedBooks || recommendedBooks.length < 6) {
    const existingIds = (recommendedBooks || []).map((b: any) => b._id)
    const popular = await Book.find({
      _id: { $nin: [...userBookIds, ...existingIds] },
      isActive: true
    })
      .sort({ salesCount: -1, rating: -1 })
      .limit(12 - (recommendedBooks?.length || 0))
      .lean()

    recommendedBooks = [...(recommendedBooks || []), ...popular]
  }

  return { books: recommendedBooks }
})
