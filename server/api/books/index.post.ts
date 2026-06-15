import Book from '../../models/Book'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const body = await readBody(event)

  if (!body.title || !body.author || !body.category || body.price === undefined) {
    throw createError({ statusCode: 400, message: 'กรุณากรอกข้อมูลที่จำเป็น (title, author, category, price)' })
  }

  const book = await Book.create({
    title: body.title,
    author: body.author,
    description: body.description || '',
    isbn: body.isbn || '',
    price: body.price,
    rentalPrice: body.rentalPrice || 0,
    rentalDurationDays: body.rentalDurationDays || 30,
    category: body.category,
    tags: body.tags || [],
    coverImage: body.coverImage || '',
    fileKey: body.fileKey || '',
    pageCount: body.pageCount || 0,
    language: body.language || 'th',
    publisher: body.publisher || '',
    publishedYear: body.publishedYear || 0,
    isFeatured: body.isFeatured || false,
    isRentable: body.isRentable !== false
  })

  return book
})
