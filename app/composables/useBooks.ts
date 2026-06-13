interface Book {
  _id: string
  title: string
  author: string
  description: string
  price: number
  rentalPrice: number
  rentalDurationDays: number
  category: string
  tags: string[]
  coverImage: string
  pageCount: number
  rating: number
  reviewCount: number
  salesCount: number
  isFeatured: boolean
  isRentable: boolean
  createdAt: string
}

interface BooksResponse {
  books: Book[]
  total: number
  page: number
  totalPages: number
  categories: string[]
}

export const useBooks = () => {
  const books = useState<Book[]>('books', () => [])
  const categories = useState<string[]>('categories', () => [])
  const totalPages = useState<number>('totalPages', () => 0)
  const currentPage = useState<number>('currentPage', () => 1)
  const loading = useState<boolean>('books_loading', () => false)

  const fetchBooks = async (params: Record<string, any> = {}) => {
    loading.value = true
    try {
      const data = await $fetch<BooksResponse>('/api/books', { params })
      books.value = data.books
      categories.value = data.categories
      totalPages.value = data.totalPages
      currentPage.value = data.page
      return data
    } finally {
      loading.value = false
    }
  }

  const fetchBook = async (id: string) => {
    return await $fetch<Book>(`/api/books/${id}`)
  }

  const fetchRecommendations = async () => {
    const data = await $fetch<{ books: Book[] }>('/api/books/recommendations')
    return data.books
  }

  return {
    books,
    categories,
    totalPages,
    currentPage,
    loading,
    fetchBooks,
    fetchBook,
    fetchRecommendations
  }
}
