<script setup lang="ts">
const { fetchBooks, books, categories, loading, totalPages } = useBooks()
const { isLoggedIn } = useAuth()
const { addToCart, isInCart } = useCart()
const { fetchWishlist, toggleWishlist, isWished } = useWishlist()
const toast = useToast()
const route = useRoute()

const coverErrorMap = ref<Record<string, boolean>>({})
const hasCover = (book: any) => !!book?.coverImage && !coverErrorMap.value[book._id]
const onCoverError = (bookId: string) => {
  coverErrorMap.value[bookId] = true
}

const searchQuery = ref((route.query.search as string) || '')
const selectedCategory = ref((route.query.category as string) || 'all')
const selectedSort = ref('createdAt')
const currentPage = ref(1)

useSeoMeta({
  title: 'หนังสือทั้งหมด — BookVerse',
  description: 'สำรวจหนังสือหลากหลายหมวดหมู่ ซื้อหรือเช่าในราคาสุดคุ้ม'
})

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

const handleAddToCart = async (bookId: string) => {
  if (!isLoggedIn.value) return navigateTo('/login')
  try {
    await addToCart(bookId)
    toast.add({ title: 'เพิ่มลงตะกร้าเรียบร้อย', icon: 'i-lucide-check-circle', color: 'success' })
  } catch (err: any) {
    toast.add({ title: err.data?.statusMessage || 'เกิดข้อผิดพลาด', color: 'error' })
  }
}

const renderStars = (rating: number) =>
  '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))

const sortOptions = [
  { label: 'ใหม่ล่าสุด', value: 'createdAt' },
  { label: 'ราคา: ต่ำ → สูง', value: 'price_asc' },
  { label: 'ราคา: สูง → ต่ำ', value: 'price_desc' },
  { label: 'คะแนนสูงสุด', value: 'rating' },
  { label: 'ขายดีที่สุด', value: 'popular' }
]

onMounted(loadBooks)

onMounted(async () => {
  try {
    await fetchWishlist()
  } catch {}
})

const handleToggleWishlist = async (bookId: string) => {
  if (!isLoggedIn.value) return navigateTo('/login')
  try {
    const res = await toggleWishlist(bookId)
    toast.add({ title: res.liked ? 'บันทึกไว้แล้ว' : 'นำออกจากรายการที่บันทึกแล้ว', color: 'neutral' })
  } catch (err: any) {
    toast.add({ title: err.data?.statusMessage || 'เกิดข้อผิดพลาด', color: 'error' })
  }
}

watch([searchQuery, selectedCategory, selectedSort], () => {
  currentPage.value = 1
  loadBooks()
})

watch(currentPage, loadBooks)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">หนังสือทั้งหมด</h1>
      <p class="text-gray-500">สำรวจหนังสือหลากหลายหมวดหมู่</p>
    </div>

    <!-- Search + Sort -->
    <div class="flex gap-3 mb-4">
      <UInput
        v-model="searchQuery"
        placeholder="ค้นหาหนังสือ..."
        icon="i-lucide-search"
        size="lg"
        class="flex-1"
      />
      <USelect
        v-model="selectedSort"
        :items="sortOptions.map(s => ({ label: s.label, value: s.value }))"
        size="lg"
        class="w-44 shrink-0"
      />
    </div>

    <!-- Category Tabs -->
    <div class="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide">
      <button
        class="category-tab shrink-0"
        :class="selectedCategory === 'all' ? 'category-tab-active' : 'category-tab-idle'"
        @click="selectedCategory = 'all'"
      >
        <UIcon name="i-lucide-layout-grid" class="w-3.5 h-3.5" />
        ทั้งหมด
      </button>
      <button
        v-for="cat in categories"
        :key="cat"
        class="category-tab shrink-0"
        :class="selectedCategory === cat ? 'category-tab-active' : 'category-tab-idle'"
        @click="selectedCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-indigo-500" />
    </div>

    <!-- Empty -->
    <div v-else-if="books.length === 0" class="text-center py-20">
      <UIcon name="i-lucide-book-x" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p class="text-gray-500 text-lg">ไม่พบหนังสือที่ค้นหา</p>
      <UButton label="ล้างตัวกรอง" variant="soft" class="mt-4" @click="searchQuery=''; selectedCategory=''" />
    </div>

    <!-- Books Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 stagger-children">
      <div
        v-for="book in books"
        :key="book._id"
        class="book-card rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      >
        <NuxtLink :to="`/books/${book._id}`">
          <div class="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center relative overflow-hidden">
            <img
              v-if="hasCover(book)"
              :src="book.coverImage"
              :alt="book.title"
              class="w-full h-full object-cover"
              @error="onCoverError(book._id)"
            />
            <UIcon v-else name="i-lucide-book-open" class="w-12 h-12 text-gray-300 dark:text-gray-600" />
            <div class="absolute top-2 left-2">
              <UBadge color="primary" variant="subtle" size="xs">{{ book.category }}</UBadge>
            </div>
            <div v-if="book.rating > 0" class="absolute top-2 right-2">
              <UBadge color="warning" variant="solid" size="xs">★ {{ book.rating }}</UBadge>
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
        <div class="p-4">
          <NuxtLink :to="`/books/${book._id}`">
            <h3 class="font-semibold text-sm truncate hover:text-indigo-600 transition-colors">{{ book.title }}</h3>
          </NuxtLink>
          <p class="text-xs text-gray-500 truncate mt-0.5">{{ book.author }}</p>
          <div class="text-xs star-gold mt-1">{{ renderStars(book.rating) }}</div>
          <div class="flex items-center justify-between mt-3">
            <div>
              <span class="text-lg font-bold text-indigo-600 dark:text-indigo-400">฿{{ book.price }}</span>
              <span v-if="book.isRentable" class="block text-xs text-gray-400">เช่า ฿{{ book.rentalPrice }}</span>
            </div>
            <UButton
              :icon="isInCart(book._id) ? 'i-lucide-check' : 'i-lucide-shopping-cart'"
              :color="isInCart(book._id) ? 'success' : 'primary'"
              variant="soft"
              size="xs"
              :disabled="isInCart(book._id)"
              @click.prevent="handleAddToCart(book._id)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center mt-12">
      <UPagination v-model="currentPage" :total="totalPages * 12" :items-per-page="12" />
    </div>
  </div>
</template>

<style scoped>
.category-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.category-tab-active {
  background: #4338ca;
  color: white;
  border-color: #4338ca;
  box-shadow: 0 2px 8px rgba(67, 56, 202, 0.35);
}

.category-tab-idle {
  background: white;
  color: #374151;
  border-color: #e5e7eb;
}
.category-tab-idle:hover {
  border-color: #a5b4fc;
  color: #4338ca;
  background: #eef2ff;
}

:root.dark .category-tab-idle {
  background: #1e293b;
  color: #94a3b8;
  border-color: #334155;
}
:root.dark .category-tab-idle:hover {
  border-color: #6366f1;
  color: #818cf8;
  background: #1e1b4b;
}

.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
