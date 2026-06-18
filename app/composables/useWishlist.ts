interface WishlistResponse {
  ids: string[]
  books?: any[]
}

export const useWishlist = () => {
  const ids = useState<string[]>('wishlist_ids', () => [])
  const books = useState<any[]>('wishlist_books', () => [])

  const fetchWishlist = async () => {
    const data = await $fetch<WishlistResponse>('/api/wishlist')
    ids.value = data.ids || []
    books.value = data.books || []
    return data
  }

  const toggleWishlist = async (bookId: string) => {
    const data = await $fetch<{ liked: boolean; ids: string[] }>('/api/wishlist/toggle', {
      method: 'POST',
      body: { bookId }
    })
    ids.value = data.ids || []
    if (!data.liked) books.value = books.value.filter(b => b._id !== bookId)
    return data
  }

  const isWished = (bookId: string) => ids.value.includes(bookId)

  return {
    ids,
    books,
    fetchWishlist,
    toggleWishlist,
    isWished
  }
}
