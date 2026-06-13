interface WishlistResponse {
  ids: string[]
  books?: any[]
}

export const useWishlist = () => {
  const ids = useState<string[]>('wishlist_ids', () => [])

  const fetchWishlist = async () => {
    const data = await $fetch<WishlistResponse>('/api/wishlist')
    ids.value = data.ids || []
    return data
  }

  const toggleWishlist = async (bookId: string) => {
    const data = await $fetch<{ liked: boolean; ids: string[] }>('/api/wishlist/toggle', {
      method: 'POST',
      body: { bookId }
    })
    ids.value = data.ids || []
    return data
  }

  const isWished = (bookId: string) => ids.value.includes(bookId)

  return {
    ids,
    fetchWishlist,
    toggleWishlist,
    isWished
  }
}
