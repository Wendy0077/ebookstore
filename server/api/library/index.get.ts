import mongoose from 'mongoose'
import AccessControl from '../../models/AccessControl'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const now = new Date()

  const rows = await AccessControl.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(user.userId), isActive: true } },
    { $lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'bookDoc' } },
    { $unwind: '$bookDoc' },
    {
      $lookup: {
        from: 'readinghistories',
        let: { bookId: '$book', userId: '$user' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$book', '$$bookId'] }, { $eq: ['$user', '$$userId'] }] } } }
        ],
        as: 'history'
      }
    },
    { $unwind: { path: '$history', preserveNullAndEmptyArrays: true } }
  ])

  const purchased: any[] = []
  const rented: any[] = []
  const expired: any[] = []
  const expiredIds: any[] = []

  for (const row of rows) {
    const accessControl = {
      _id: row._id,
      user: row.user,
      book: row.book,
      order: row.order,
      accessType: row.accessType,
      isActive: row.isActive,
      rentalExpireAt: row.rentalExpireAt,
      lastReadPage: row.lastReadPage,
      watermarkText: row.watermarkText
    }
    const book = { ...row.bookDoc, accessControl, readingHistory: row.history || null }

    if (row.accessType === 'rental') {
      if (row.rentalExpireAt && row.rentalExpireAt < now) {
        expired.push(book)
        expiredIds.push(row._id)
      } else {
        rented.push(book)
      }
    } else {
      purchased.push(book)
    }
  }

  if (expiredIds.length > 0) {
    await AccessControl.updateMany({ _id: { $in: expiredIds } }, { isActive: false })
  }

  return { purchased, rented, expired }
})
