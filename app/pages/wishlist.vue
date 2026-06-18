<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { books, fetchWishlist, toggleWishlist } = useWishlist()
const { addToCart, isInCart } = useCart()
const toast = useToast()

const loading = ref(true)

const coverErrorMap = ref<Record<string, boolean>>({})
const hasCover = (book: any) => !!book?.coverImage && !coverErrorMap.value[book._id]
const onCoverError = (bookId: string) => {
  coverErrorMap.value[bookId] = true
}

useSeoMeta({
  title: 'รายการที่บันทึกไว้ — BookVerse',
  description: 'หนังสือที่คุณกดบันทึกไว้'
})

onMounted(async () => {
  try {
    await fetchWishlist()
  } finally {
    loading.value = false
  }
})

const handleRemove = async (bookId: string) => {
  try {
    await toggleWishlist(bookId)
    toast.add({ title: 'นำออกจากรายการที่บันทึกแล้ว', color: 'neutral' })
  } catch (err: any) {
    toast.add({ title: err.data?.statusMessage || 'เกิดข้อผิดพลาด', color: 'error' })
  }
}

const handleAddToCart = async (bookId: string) => {
  try {
    await addToCart(bookId)
    toast.add({ title: 'เพิ่มลงตะกร้าเรียบร้อย', icon: 'i-lucide-check-circle', color: 'success' })
  } catch (err: any) {
    toast.add({ title: err.data?.statusMessage || 'เกิดข้อผิดพลาด', color: 'error' })
  }
}

const renderStars = (rating: number) =>
  '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2 flex items-center gap-2">
        <UIcon name="i-lucide-heart" class="w-7 h-7 text-rose-500" />
        รายการที่บันทึกไว้
      </h1>
      <p class="text-gray-500">หนังสือที่คุณกดบันทึกไว้ทั้งหมด</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-indigo-500" />
    </div>

    <!-- Empty -->
    <div v-else-if="books.length === 0" class="text-center py-20">
      <UIcon name="i-lucide-heart-off" class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <p class="text-gray-500 text-lg">ยังไม่มีหนังสือที่บันทึกไว้</p>
      <UButton to="/books" label="ไปเลือกหนังสือ" variant="soft" class="mt-4" />
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
              class="w-full h-full object-contain"
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
              icon="i-lucide-heart"
              color="error"
              variant="ghost"
              size="xs"
              class="absolute bottom-2 right-2"
              @click.prevent="handleRemove(book._id)"
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
  </div>
</template>
