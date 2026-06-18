<script setup lang="ts">
const { fetchBooks, books, categories, loading } = useBooks()
const { isLoggedIn } = useAuth()
const { addToCart, isInCart, fetchCart } = useCart()
const { fetchWishlist, toggleWishlist, isWished } = useWishlist()
const toast = useToast()

const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedSort = ref('createdAt')
const currentPage = ref(1)
const recommendations = ref<any[]>([])

// Track buy/rent selection per book
const cartTypeMap = ref<Record<string, 'purchase' | 'rental'>>({})

const coverErrorMap = ref<Record<string, boolean>>({})
const hasCover = (book: any) => !!book?.coverImage && !coverErrorMap.value[book._id]
const onCoverError = (bookId: string) => {
  coverErrorMap.value[bookId] = true
}

const handleToggleWishlist = async (bookId: string) => {
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  try {
    const res = await toggleWishlist(bookId)
    toast.add({ title: res.liked ? 'บันทึกไว้แล้ว' : 'นำออกจากรายการที่บันทึกแล้ว', color: 'neutral' })
  } catch (err: any) {
    toast.add({ title: err.data?.message || 'เกิดข้อผิดพลาด', color: 'error' })
  }
}

const getCartType = (bookId: string) => cartTypeMap.value[bookId] || 'purchase'
const setCartType = (bookId: string, type: 'purchase' | 'rental') => {
  cartTypeMap.value[bookId] = type
}

const sortOptions = [
  { label: 'ใหม่ล่าสุด', value: 'createdAt' },
  { label: 'ราคา: ต่ำ → สูง', value: 'price_asc' },
  { label: 'ราคา: สูง → ต่ำ', value: 'price_desc' },
  { label: 'คะแนนสูงสุด', value: 'rating' },
  { label: 'ขายดีที่สุด', value: 'popular' }
]

const loadBooks = async () => {
  const params: any = {
    page: currentPage.value,
    limit: 12,
    sort: selectedSort.value
  }
  if (searchQuery.value) params.search = searchQuery.value
  if (selectedCategory.value && selectedCategory.value !== 'all') params.category = selectedCategory.value

  await fetchBooks(params)
}

const loadRecommendations = async () => {
  try {
    const { fetchRecommendations } = useBooks()
    recommendations.value = await fetchRecommendations()
  } catch {}
}

const handleAddToCart = async (bookId: string) => {
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  try {
    const type = getCartType(bookId)
    await addToCart(bookId, type)
    const label = type === 'rental' ? 'เพิ่ม (เช่า) ลงตะกร้าเรียบร้อย' : 'เพิ่ม (ซื้อ) ลงตะกร้าเรียบร้อย'
    toast.add({ title: label, icon: 'i-lucide-check-circle', color: 'success' })
  } catch (err: any) {
    toast.add({ title: err.data?.message || 'เกิดข้อผิดพลาด', icon: 'i-lucide-alert-circle', color: 'error' })
  }
}

const featuredBooks = computed(() =>
  books.value.filter(b => b.isFeatured).slice(0, 5)
)

const carouselBooks = computed(() =>
  books.value.filter(b => b.coverImage).slice(0, 10)
)

onMounted(() => {
  // Run independent fetches in parallel instead of one-after-another —
  // each is a separate DB round-trip, so awaiting them sequentially was
  // adding up to a noticeably slow homepage load.
  loadBooks()
  loadRecommendations()
  fetchWishlist().catch(() => {})
  if (isLoggedIn.value) fetchCart()
})

watch([searchQuery, selectedCategory, selectedSort], () => {
  currentPage.value = 1
  loadBooks()
})

watch(currentPage, loadBooks)

const renderStars = (rating: number) => {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
}
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="hero-gradient text-white py-10 md:py-20 -mt-4">
      <div class="max-w-[96rem] mx-auto px-4">
        <div class="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div class="animate-fade-in-up">
            <div class="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 md:px-4 md:py-1.5 text-xs md:text-sm mb-4 md:mb-6 backdrop-blur">
              <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400" />
              <span>ประสบการณ์การอ่านรูปแบบใหม่</span>
            </div>
            <h1 class="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 md:mb-6">
              ค้นหา <span class="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">หนังสือดี</span>
              <br>ที่ตรงใจคุณ
            </h1>
            <p class="text-sm md:text-lg text-gray-300 mb-6 md:mb-8 max-w-lg">
              ค้นพบเรื่องราวที่สะท้อนตัวตนของคุณ หนังสือที่ตรงกับความชอบของคุณ
            </p>
            <div class="flex flex-col sm:flex-row gap-3">
              <UButton to="/books" size="lg" color="primary" icon="i-lucide-book-open" label="สำรวจหนังสือ" class="pulse-glow" />
              <UButton v-if="!isLoggedIn" to="/register" size="lg" variant="outline" color="neutral" icon="i-lucide-user-plus" label="สมัครสมาชิก" />
            </div>
          </div>

          <!-- Book Cover Carousel — hidden on mobile to reduce scroll -->
          <div class="hidden md:block animate-fade-in-up" style="animation-delay: 0.2s">
            <UCarousel
              v-if="carouselBooks.length > 0"
              :items="carouselBooks"
              loop
              :auto-scroll="{ speed: 1, stopOnInteraction: false }"
              class="w-full"
              :ui="{ item: 'basis-auto' }"
            >
              <template #default="{ item }">
                <NuxtLink :to="`/books/${item._id}`" class="block px-3 group">
                  <div class="aspect-[3/4] w-44 rounded-xl overflow-hidden shadow-xl ring-1 ring-white/10">
                    <img
                      :src="item.coverImage"
                      :alt="item.title"
                      class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </NuxtLink>
              </template>
            </UCarousel>
          </div>
        </div>
      </div>
    </section>

    <!-- Search & Filter Section -->
    <section class="max-w-[96rem] mx-auto px-4 mt-4 md:-mt-8 relative z-10">
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6">
        <div class="flex flex-col md:grid md:grid-cols-3 gap-3 md:gap-4">
          <UInput
            v-model="searchQuery"
            placeholder="ค้นหาหนังสือ, ผู้เขียน..."
            icon="i-lucide-search"
            size="lg"
            class="md:col-span-1"
          />
          <div class="grid grid-cols-2 md:contents gap-3 md:gap-4">
            <USelect
              v-model="selectedCategory"
              :items="[{ label: 'หมวดหมู่ทั้งหมด', value: 'all' }, ...categories.map(c => ({ label: c, value: c }))]"
              size="lg"
              placeholder="หมวดหมู่"
            />
            <USelect
              v-model="selectedSort"
              :items="sortOptions.map(s => ({ label: s.label, value: s.value }))"
              size="lg"
            />
          </div>
        </div>
      </div>
    </section>

    <div class="pt-12 md:pt-16 pb-16 space-y-12 md:space-y-16">
      <!-- Featured Books -->
      <section v-if="featuredBooks.length > 0" class="max-w-[96rem] mx-auto px-4">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl font-bold flex items-center gap-2">
              <UIcon name="i-lucide-flame" class="w-6 h-6 text-orange-500" />
              หนังสือแนะนำ
            </h2>
            <p class="text-gray-500 text-sm mt-1">คัดสรรมาเพื่อคุณโดยเฉพาะ</p>
          </div>
          <UButton to="/books" variant="ghost" color="primary" label="ดูทั้งหมด" trailing-icon="i-lucide-arrow-right" />
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 stagger-children">
          <NuxtLink
            v-for="book in featuredBooks"
            :key="book._id"
            :to="`/books/${book._id}`"
            class="book-card rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 group flex flex-col h-full"
          >
            <div class="aspect-[3/4] bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center relative overflow-hidden">
              <img
                v-if="hasCover(book)"
                :src="book.coverImage"
                :alt="book.title"
                class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                @error="onCoverError(book._id)"
              />
              <UIcon v-else name="i-lucide-book-open" class="w-16 h-16 text-indigo-300 dark:text-indigo-700" />
              <div class="absolute top-2 right-2">
                <UBadge color="warning" variant="solid" size="xs">
                  <UIcon name="i-lucide-star" class="w-3 h-3 mr-1" />
                  {{ book.rating }}
                </UBadge>
              </div>
              <UButton
                :icon="isWished(book._id) ? 'i-lucide-heart' : 'i-lucide-heart'"
                :color="isWished(book._id) ? 'error' : 'neutral'"
                variant="ghost"
                size="xs"
                class="absolute bottom-2 right-2"
                @click.prevent="handleToggleWishlist(book._id)"
              />
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-semibold text-sm truncate">{{ book.title }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ book.author }}</p>
              <div class="flex items-center justify-between mt-auto pt-3">
                <span class="text-lg font-bold text-indigo-600 dark:text-indigo-400">฿{{ book.price }}</span>
                <span v-if="book.isRentable" class="text-xs text-gray-400">เช่า ฿{{ book.rentalPrice }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- All Books -->
      <section class="max-w-[96rem] mx-auto px-4">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-bold flex items-center gap-2">
            <UIcon name="i-lucide-library" class="w-6 h-6 text-indigo-500" />
            หนังสือทั้งหมด
          </h2>
        </div>

        <div v-if="loading" class="flex justify-center py-20">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-indigo-500" />
        </div>

        <div v-else-if="books.length === 0" class="text-center py-20">
          <UIcon name="i-lucide-book-x" class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p class="text-gray-500">ไม่พบหนังสือที่ค้นหา</p>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 stagger-children">
          <div
            v-for="book in books"
            :key="book._id"
            class="book-card rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex flex-col h-full"
          >
            <NuxtLink :to="`/books/${book._id}`" class="group">
              <div class="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center relative overflow-hidden">
                <img
                  v-if="hasCover(book)"
                  :src="book.coverImage"
                  :alt="book.title"
                  class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  @error="onCoverError(book._id)"
                />
                <UIcon v-else name="i-lucide-book-open" class="w-12 h-12 text-gray-300 dark:text-gray-600" />
                <div class="absolute top-2 left-2">
                  <UBadge color="primary" variant="subtle" size="xs">{{ book.category }}</UBadge>
                </div>
                <div v-if="book.rating > 0" class="absolute top-2 right-2">
                  <UBadge color="warning" variant="solid" size="xs">
                    <UIcon name="i-lucide-star" class="w-3 h-3 mr-1" />
                    {{ book.rating }}
                  </UBadge>
                </div>
                <UButton
                  :icon="isWished(book._id) ? 'i-lucide-heart' : 'i-lucide-heart'"
                  :color="isWished(book._id) ? 'error' : 'neutral'"
                  variant="ghost"
                  size="xs"
                  class="absolute bottom-2 right-2"
                  @click.prevent="handleToggleWishlist(book._id)"
                />
              </div>
            </NuxtLink>
            <div class="p-4 flex-1 flex flex-col">
              <NuxtLink :to="`/books/${book._id}`">
                <h3 class="font-semibold text-sm truncate hover:text-indigo-600 transition-colors">{{ book.title }}</h3>
              </NuxtLink>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{{ book.author }}</p>
              <div class="text-xs star-gold mt-1">{{ renderStars(book.rating) }}</div>

              <div class="mt-auto pt-3">
                <!-- Buy / Rent Toggle -->
                <div v-if="book.isRentable" class="flex items-center gap-1 mb-2">
                  <button
                    class="flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all"
                    :class="getCartType(book._id) === 'purchase'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                    @click.prevent="setCartType(book._id, 'purchase')"
                  >
                    ซื้อ
                  </button>
                  <button
                    class="flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all"
                    :class="getCartType(book._id) === 'rental'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                    @click.prevent="setCartType(book._id, 'rental')"
                  >
                    เช่า
                  </button>
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-lg font-bold" :class="getCartType(book._id) === 'rental' ? 'text-purple-600 dark:text-purple-400' : 'text-indigo-600 dark:text-indigo-400'">
                      ฿{{ getCartType(book._id) === 'rental' && book.isRentable ? book.rentalPrice : book.price }}
                    </span>
                    <span v-if="getCartType(book._id) === 'rental' && book.isRentable" class="block text-xs text-gray-400">{{ book.rentalDurationDays || 30 }} วัน</span>
                    <span v-else-if="book.isRentable" class="block text-xs text-gray-400">เช่า ฿{{ book.rentalPrice }}</span>
                  </div>
                  <UButton
                    :icon="isInCart(book._id) ? 'i-lucide-check' : 'i-lucide-shopping-cart'"
                    :color="isInCart(book._id) ? 'success' : getCartType(book._id) === 'rental' ? 'purple' as any : 'primary'"
                    variant="soft"
                    size="xs"
                    :disabled="isInCart(book._id)"
                    @click.prevent="handleAddToCart(book._id)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Recommendations -->
      <section v-if="recommendations.length > 0" class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-900 py-16">
        <div class="max-w-[96rem] mx-auto px-4">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h2 class="text-2xl font-bold flex items-center gap-2">
                <UIcon name="i-lucide-sparkles" class="w-6 h-6 text-purple-500" />
                แนะนำสำหรับคุณ
              </h2>
              <p class="text-gray-500 text-sm mt-1">จากประวัติการอ่านและความชอบของคุณ</p>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
            <NuxtLink
              v-for="book in recommendations.slice(0, 6)"
              :key="book._id"
              :to="`/books/${book._id}`"
              class="book-card rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group"
            >
              <div class="aspect-[3/4] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950 flex items-center justify-center relative overflow-hidden">
                <img
                  v-if="hasCover(book)"
                  :src="book.coverImage"
                  :alt="book.title"
                  class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  @error="onCoverError(book._id)"
                />
                <UIcon v-else name="i-lucide-book-open" class="w-10 h-10 text-purple-300 dark:text-purple-700" />
                <UButton
                  :icon="isWished(book._id) ? 'i-lucide-heart' : 'i-lucide-heart'"
                  :color="isWished(book._id) ? 'error' : 'neutral'"
                  variant="ghost"
                  size="xs"
                  class="absolute bottom-2 right-2"
                  @click.prevent="handleToggleWishlist(book._id)"
                />
              </div>
              <div class="p-3">
                <h3 class="font-medium text-xs truncate">{{ book.title }}</h3>
                <p class="text-xs text-gray-400 truncate">{{ book.author }}</p>
                <p class="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">฿{{ book.price }}</p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
