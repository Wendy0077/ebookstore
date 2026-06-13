import Book from '../../models/Book'
import Order from '../../models/Order'
import { getTokenFromEvent, verifyToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // Get user's purchase history if logged in
  let userBookIds: string[] = []

  const token = getTokenFromEvent(event)
  if (token) {
    try {
      const payload = verifyToken(token)
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

  // If user has purchased books, recommend by same categories
  let recommendedBooks: any[] = []
  if (userBookIds.length > 0) {
    const purchasedBooks = await Book.find({ _id: { $in: userBookIds } }).lean()
    const categories = [...new Set(purchasedBooks.map((b: any) => b.category))]

    recommendedBooks = await Book.find({
      _id: { $nin: userBookIds },
      category: { $in: categories },
      isActive: true
    })
      .sort({ rating: -1, salesCount: -1 })
      .limit(12)
      .lean()
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
