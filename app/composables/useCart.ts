interface CartItem {
  book: any
  type: 'purchase' | 'rental'
  price: number
}

interface Cart {
  _id?: string
  user: string
  items: CartItem[]
}

export const useCart = () => {
  const cart = useState<Cart | null>('cart', () => null)
  const itemCount = computed(() => cart.value?.items?.length || 0)
  const total = computed(() =>
    cart.value?.items?.reduce((sum, item) => sum + item.price, 0) || 0
  )

  const fetchCart = async () => {
    try {
      const data = await $fetch<Cart>('/api/cart')
      cart.value = data
    } catch {
      cart.value = null
    }
  }

  const addToCart = async (bookId: string, type: 'purchase' | 'rental' = 'purchase') => {
    const data = await $fetch<Cart>('/api/cart/add', {
      method: 'POST',
      body: { bookId, type }
    })
    cart.value = data
    return data
  }

  const removeFromCart = async (bookId: string) => {
    const data = await $fetch<Cart>('/api/cart/remove', {
      method: 'POST',
      body: { bookId }
    })
    cart.value = data
    return data
  }

  const updateCartItemType = async (bookId: string, type: 'purchase' | 'rental') => {
    const data = await $fetch<Cart>('/api/cart/update', {
      method: 'POST',
      body: { bookId, type }
    })
    cart.value = data
    return data
  }

  const isInCart = (bookId: string) => {
    return cart.value?.items?.some(
      (item) => (item.book?._id || item.book) === bookId
    ) || false
  }

  const clearCart = () => {
    cart.value = null
  }

  return {
    cart,
    itemCount,
    total,
    fetchCart,
    addToCart,
    updateCartItemType,
    removeFromCart,
    isInCart,
    clearCart
  }
}
