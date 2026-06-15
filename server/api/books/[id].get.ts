import Book from '../../models/Book'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const book = await Book.findById(id).lean()
  if (!book) {
    throw createError({ statusCode: 404, message: 'ไม่พบหนังสือ' })
  }

  return book
})
