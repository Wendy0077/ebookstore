<script setup lang="ts">
const route = useRoute()
const { fetchBook } = useBooks()
const { isLoggedIn } = useAuth()
const { addToCart, isInCart } = useCart()
const { fetchWishlist, toggleWishlist, isWished } = useWishlist()
const toast = useToast()

const book = ref<any>(null)
const reviews = ref<any[]>([])
const reviewsTotal = ref(0)
const loadingBook = ref(true)
const purchaseType = ref<'purchase' | 'rental'>('purchase')
const alreadyOwned = ref(false)

// Review form
const showReviewForm = ref(false)
const reviewRating = ref(5)
const reviewComment = ref('')
const submittingReview = ref(false)

const coverErrorMap = ref<Record<string, boolean>>({})
const hasCover = (b: any) => !!b?.coverImage && !coverErrorMap.value[b._id]
const onCoverError = (bookId: string) => {
  coverErrorMap.value[bookId] = true
}

const bookId = route.params.id as string

const loadBook = async () => {
  loadingBook.value = true
  try {
    book.value = await fetchBook(bookId)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบหนังสือ' })
  } finally {
    loadingBook.value = false
  }
}

const loadReviews = async () => {
  try {
    const data = await $fetch<any>(`/api/reviews/${bookId}`)
    reviews.value = data.reviews
    reviewsTotal.value = data.total
  } catch { }
}


const handleAddToCart = async (redirectToCheckout = false) => {
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  // If already in cart and want checkout, just navigate
  if (redirectToCheckout && isInCart(book.value?._id)) {
    await navigateTo('/checkout')
    return
  }
  try {
    await addToCart(bookId, purchaseType.value)
    if (redirectToCheckout) {
      await navigateTo('/checkout')
    } else {
      toast.add({ title: 'เพิ่มลงตะกร้าเรียบร้อย', icon: 'i-lucide-check-circle', color: 'success' })
    }
  } catch (err: any) {
    if (redirectToCheckout) {
      // Even if add fails (already in cart), still go to checkout
      await navigateTo('/checkout')
    } else {
      toast.add({ title: err.data?.statusMessage || 'เกิดข้อผิดพลาด', color: 'error' })
    }
  }
}

const submitReview = async () => {
  submittingReview.value = true
  try {
    await $fetch(`/api/reviews/${bookId}`, {
      method: 'POST',
      body: { rating: reviewRating.value, comment: reviewComment.value }
    })
    toast.add({ title: 'ส่งรีวิวเรียบร้อย', icon: 'i-lucide-check-circle', color: 'success' })
    showReviewForm.value = false
    reviewComment.value = ''
    await loadReviews()
    await loadBook()
  } catch (err: any) {
    const status = err.data?.statusCode || err.statusCode
    if (status === 403) {
      toast.add({ title: err.data?.statusMessage || 'ขออภัย เฉพาะผู้ที่ซื้อหนังสือเล่มนี้แล้วเท่านั้นจึงจะสามารถรีวิวได้', icon: 'i-lucide-shield-alert', color: 'warning' })
    } else {
      toast.add({ title: err.data?.statusMessage || 'เกิดข้อผิดพลาด', color: 'error' })
    }
  } finally {
    submittingReview.value = false
  }
}

const renderStars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))

const checkOwnership = async () => {
  if (!isLoggedIn.value) return
  try {
    const data = await $fetch<any>('/api/library')
    alreadyOwned.value = (data.purchased || []).some((b: any) => b._id === bookId)
  } catch { }
}

onMounted(async () => {
  await loadBook()
  await loadReviews()
  try {
    await fetchWishlist()
  } catch { }
  await checkOwnership()
})

const handleToggleWishlist = async () => {
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  if (!book.value?._id) return
  try {
    const res = await toggleWishlist(book.value._id)
    toast.add({ title: res.liked ? 'บันทึกไว้แล้ว' : 'นำออกจากรายการที่บันทึกแล้ว', color: 'neutral' })
  } catch (err: any) {
    toast.add({ title: err.data?.statusMessage || 'เกิดข้อผิดพลาด', color: 'error' })
  }
}

watch(() => book.value, (b) => {
  if (b) {
    useSeoMeta({
      title: `${b.title} — BookVerse`,
      description: b.description
    })
  }
})
</script>

<template>
  <div class="max-w-[96rem] mx-auto px-4 py-8">
    <!-- Loading -->
    <div v-if="loadingBook" class="flex justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-indigo-500" />
    </div>

    <!-- Book Detail -->
    <div v-else-if="book" class="animate-fade-in-up">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-1.5 text-sm text-gray-500 mb-6 sm:mb-8 min-w-0">
        <NuxtLink to="/books" class="hover:text-indigo-600 flex items-center gap-1 shrink-0">
          <UIcon name="i-lucide-chevron-left" class="w-4 h-4" />
          หนังสือ
        </NuxtLink>
        <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5 shrink-0 hidden sm:block" />
        <span class="text-gray-800 dark:text-gray-200 truncate hidden sm:block">{{ book.title }}</span>
      </div>

      <div class="grid lg:grid-cols-3 gap-6 lg:gap-12">
        <!-- Cover Image -->
        <div class="lg:col-span-1">
          <div class="max-w-[200px] sm:max-w-xs lg:max-w-none mx-auto">
            <div
              class="aspect-[3/4] rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center shadow-xl overflow-hidden">
              <img v-if="hasCover(book)" :src="book.coverImage" :alt="book.title" class="w-full h-full object-contain"
                @error="onCoverError(book._id)" />
              <UIcon v-else name="i-lucide-book-open" class="w-24 h-24 text-indigo-300 dark:text-indigo-700" />
            </div>
          </div>
        </div>

        <!-- Book Info -->
        <div class="lg:col-span-2">
          <div class="flex items-start gap-2 mb-2">
            <UBadge color="primary" variant="subtle">{{ book.category }}</UBadge>
            <UBadge v-if="book.isFeatured" color="warning" variant="subtle">
              <UIcon name="i-lucide-star" class="w-3 h-3 mr-1" /> แนะนำ
            </UBadge>
          </div>

          <div class="flex items-start justify-between gap-3 mb-2">
            <h1 class="text-2xl md:text-3xl lg:text-4xl font-extrabold">{{ book.title }}</h1>
            <UButton :icon="isWished(book._id) ? 'i-lucide-heart' : 'i-lucide-heart'"
              :color="isWished(book._id) ? 'error' : 'neutral'" variant="ghost" size="sm"
              @click="handleToggleWishlist" />
          </div>
          <p class="text-lg text-gray-500 mb-4">โดย {{ book.author }}</p>

          <!-- Rating -->
          <div class="flex items-center gap-3 mb-6">
            <span class="text-lg star-gold">{{ renderStars(book.rating) }}</span>
            <span class="text-sm text-gray-500">{{ book.rating }}/5 ({{ book.reviewCount }} รีวิว)</span>
          </div>

          <!-- Description -->
          <p class="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">{{ book.description }}</p>

          <!-- Book Meta -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <UIcon name="i-lucide-file-text" class="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p class="text-sm font-semibold">{{ book.pageCount }} หน้า</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <UIcon name="i-lucide-globe" class="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p class="text-sm font-semibold">{{ book.language === 'th' ? 'ภาษาไทย' : book.language }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <UIcon name="i-lucide-building" class="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p class="text-sm font-semibold truncate">{{ book.publisher || '-' }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <UIcon name="i-lucide-calendar" class="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p class="text-sm font-semibold">{{ book.publishedYear || '-' }}</p>
            </div>
          </div>

          <!-- Already Owned -->
          <div v-if="alreadyOwned" class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-6 mb-8 flex items-center gap-4">
            <UIcon name="i-lucide-check-circle" class="w-8 h-8 text-emerald-500 shrink-0" />
            <div class="flex-1">
              <p class="font-semibold text-emerald-700 dark:text-emerald-400">คุณซื้อหนังสือเล่มนี้ไปแล้ว</p>
              <p class="text-sm text-emerald-600/80 dark:text-emerald-500/70">ดาวน์โหลดและอ่านได้ตลอดในคลังหนังสือของคุณ</p>
            </div>
            <UButton to="/library" label="ไปคลังหนังสือ" icon="i-lucide-library" color="success" />
          </div>

          <!-- Purchase Options -->
          <div v-else class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-8">
            <div class="flex flex-col sm:flex-row gap-4 mb-6">
              <button class="flex-1 rounded-xl p-4 border-2 transition-all text-left" :class="purchaseType === 'purchase'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'" @click="purchaseType = 'purchase'">
                <div class="flex items-center gap-2 mb-1">
                  <UIcon name="i-lucide-shopping-bag" class="w-5 h-5 text-indigo-600" />
                  <span class="font-semibold">ซื้อ</span>
                </div>
                <p class="text-2xl font-bold text-indigo-600">฿{{ book.price }}</p>
                <p class="text-xs text-gray-500">ดาวน์โหลดได้ตลอด</p>
              </button>

              <button v-if="book.isRentable && book.rentalPrice > 0"
                class="flex-1 rounded-xl p-4 border-2 transition-all text-left" :class="purchaseType === 'rental'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'" @click="purchaseType = 'rental'">
                <div class="flex items-center gap-2 mb-1">
                  <UIcon name="i-lucide-clock" class="w-5 h-5 text-purple-600" />
                  <span class="font-semibold">เช่า</span>
                </div>
                <p class="text-2xl font-bold text-purple-600">฿{{ book.rentalPrice }}</p>
                <p class="text-xs text-gray-500">{{ book.rentalDurationDays }} วัน</p>
              </button>
            </div>

            <div class="flex flex-col gap-3">
              <UButton
                label="ซื้อเลย"
                icon="i-lucide-zap"
                color="primary"
                size="lg"
                block
                @click="() => handleAddToCart(true)"
              />
              <UButton
                :label="isInCart(book._id) ? 'อยู่ในตะกร้าแล้ว' : 'เพิ่มลงตะกร้า'"
                :icon="isInCart(book._id) ? 'i-lucide-check' : 'i-lucide-shopping-cart'"
                :color="isInCart(book._id) ? 'success' : 'neutral'"
                variant="outline"
                size="lg"
                block
                :disabled="isInCart(book._id)"
                @click="() => handleAddToCart(false)"
              />
            </div>
          </div>

          <!-- Tags -->
          <div v-if="book.tags?.length > 0" class="flex flex-wrap gap-2 mb-8">
            <UBadge v-for="tag in book.tags" :key="tag" color="neutral" variant="subtle">
              {{ tag }}
            </UBadge>
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <section class="mt-16 border-t pt-12">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-bold flex items-center gap-2">
            <UIcon name="i-lucide-message-square" class="w-6 h-6 text-indigo-500" />
            รีวิว ({{ reviewsTotal }})
          </h2>
          <UButton v-if="isLoggedIn && !showReviewForm" label="เขียนรีวิว" icon="i-lucide-pen-line" variant="soft"
            @click="showReviewForm = true" />
        </div>

        <!-- Review Form -->
        <div v-if="showReviewForm" class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 mb-8 border">
          <h3 class="font-semibold mb-4">เขียนรีวิวของคุณ</h3>
          <div class="mb-4">
            <label class="text-sm text-gray-500 mb-2 block">คะแนน</label>
            <div class="flex gap-1">
              <button v-for="i in 5" :key="i" class="text-2xl transition-colors"
                :class="i <= reviewRating ? 'text-yellow-400' : 'text-gray-300'" @click="reviewRating = i">
                ★
              </button>
            </div>
          </div>
          <UTextarea v-model="reviewComment" placeholder="แชร์ความคิดเห็นของคุณ..." :rows="4" class="mb-4" />
          <div class="flex gap-2">
            <UButton label="ส่งรีวิว" icon="i-lucide-send" :loading="submittingReview" @click="submitReview" />
            <UButton label="ยกเลิก" variant="ghost" color="neutral" @click="showReviewForm = false" />
          </div>
        </div>

        <!-- Reviews List -->
        <div v-if="reviews.length > 0" class="space-y-6">
          <div v-for="review in reviews" :key="review._id"
            class="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div class="flex items-center gap-3 mb-3">
              <div
                class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {{ review.user?.name?.charAt(0) || 'U' }}
              </div>
              <div>
                <p class="font-semibold text-sm">{{ review.user?.name }}</p>
                <p class="text-xs text-gray-400">{{ new Date(review.createdAt).toLocaleDateString('th-TH') }}</p>
              </div>
              <div class="ml-auto text-sm star-gold">
                {{ renderStars(review.rating) }}
              </div>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-sm">{{ review.comment }}</p>
          </div>
        </div>

        <div v-else class="text-center py-12">
          <UIcon name="i-lucide-message-circle" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p class="text-gray-500">ยังไม่มีรีวิว เป็นคนแรกที่รีวิวหนังสือเล่มนี้</p>
        </div>
      </section>
    </div>
  </div>
</template>
