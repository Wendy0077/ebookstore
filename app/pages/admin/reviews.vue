<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useSeoMeta({ title: 'จัดการรีวิว — Admin' })

const toast = useToast()
const reviews = ref<any[]>([])
const loading = ref(false)
const deletingId = ref<string | null>(null)
const page = ref(1)
const totalPages = ref(1)
const totalReviews = ref(0)
const showConfirm = ref(false)
const targetReview = ref<any>(null)

const fetchReviews = async () => {
  loading.value = true
  try {
    const data = await $fetch<any>('/api/admin/reviews', { params: { page: page.value, limit: 20 } })
    reviews.value = data.reviews || []
    totalPages.value = data.totalPages || 1
    totalReviews.value = data.total || 0
  } catch {
    toast.add({ title: 'โหลดรีวิวไม่สำเร็จ', color: 'error' })
  } finally {
    loading.value = false
  }
}

const confirmDelete = (review: any) => { targetReview.value = review; showConfirm.value = true }

const deleteReview = async () => {
  if (!targetReview.value) return
  deletingId.value = targetReview.value._id
  try {
    await $fetch(`/api/admin/reviews/${targetReview.value._id}`, { method: 'delete' as any })
    toast.add({ title: 'ลบรีวิวเรียบร้อย', color: 'success' })
    showConfirm.value = false
    await fetchReviews()
  } catch (err: any) {
    toast.add({ title: err.data?.statusMessage || 'ลบไม่สำเร็จ', color: 'error' })
  } finally {
    deletingId.value = null
  }
}

const renderStars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))
const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })

watch(page, fetchReviews)
onMounted(fetchReviews)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <AdminNav />
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold flex items-center gap-2">
          <UIcon name="i-lucide-message-square" class="w-8 h-8 text-indigo-500" />
          จัดการรีวิว
        </h1>
        <p class="text-gray-500 text-sm mt-1">ทั้งหมด {{ totalReviews }} รีวิว</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-indigo-500" />
    </div>

    <div v-else class="space-y-4">
      <NuxtLink
        v-for="review in reviews"
        :key="review._id"
        :to="`/books/${review.book?._id}`"
        class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
      >
        <!-- Book cover -->
        <div class="w-12 h-16 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img v-if="review.book?.coverImage" :src="review.book.coverImage" class="w-full h-full object-cover" />
          <UIcon v-else name="i-lucide-book-open" class="w-5 h-5 text-indigo-300" />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2 mb-1">
            <div>
              <p class="font-semibold text-sm truncate">{{ review.book?.title }}</p>
              <p class="text-xs text-gray-400">{{ review.book?.author }}</p>
            </div>
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
              :loading="deletingId === review._id"
              @click.stop.prevent="confirmDelete(review)"
            />
          </div>

          <div class="flex items-center gap-2 mb-2">
            <div class="flex items-center gap-1">
              <div class="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {{ review.user?.name?.charAt(0) || 'U' }}
              </div>
              <span class="text-sm font-medium">{{ review.user?.name }}</span>
              <span class="text-xs text-gray-400">{{ review.user?.email }}</span>
            </div>
            <span class="text-yellow-400 text-sm">{{ renderStars(review.rating) }}</span>
            <span class="text-xs text-gray-400">{{ formatDate(review.createdAt) }}</span>
          </div>

          <p v-if="review.comment" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{{ review.comment }}</p>
          <p v-else class="text-xs text-gray-300 italic">ไม่มีความคิดเห็น</p>
        </div>
      </NuxtLink>

      <div v-if="reviews.length === 0" class="text-center py-16 text-gray-400">
        <UIcon name="i-lucide-message-circle" class="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>ไม่พบรีวิว</p>
      </div>

      <div v-if="totalPages > 1" class="flex justify-center mt-4">
        <UPagination v-model="page" :total="totalReviews" :items-per-page="20" />
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <UModal v-model:open="showConfirm" title="ยืนยันการลบรีวิว">
      <template #content>
        <div class="p-6 text-center">
          <div class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-alert-triangle" class="w-7 h-7 text-red-500" />
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-6">ต้องการลบรีวิวของ <strong>{{ targetReview?.user?.name }}</strong> หรือไม่?</p>
          <div class="flex justify-center gap-3">
            <UButton label="ยกเลิก" variant="ghost" color="neutral" @click="showConfirm = false" />
            <UButton label="ลบรีวิว" icon="i-lucide-trash-2" color="error" :loading="!!deletingId" @click="deleteReview" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>