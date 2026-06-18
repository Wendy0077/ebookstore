<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'คลังหนังสือ — BookVerse' })

const toast = useToast()

const purchased = ref<any[]>([])
const rented = ref<any[]>([])
const expired = ref<any[]>([])
const loading = ref(true)

const fetchLibrary = async () => {
  loading.value = true
  try {
    const data = await $fetch<any>('/api/library')
    purchased.value = data.purchased || []
    rented.value = data.rented || []
    expired.value = data.expired || []
  } catch (err: any) {
    toast.add({ title: 'โหลดคลังหนังสือไม่สำเร็จ', color: 'error' })
  } finally {
    loading.value = false
  }
}

const allBooks = computed(() => [
  ...purchased.value.map(b => ({ ...b, _status: 'purchased' })),
  ...rented.value.map(b => ({ ...b, _status: 'rented' })),
  ...expired.value.map(b => ({ ...b, _status: 'expired' }))
])

const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })

const daysLeft = (expireAt: string) => {
  const diff = new Date(expireAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

const progressPercent = (h: any) => {
  if (!h || !h.totalPages) return 0
  return Math.min(100, Math.round((h.currentPage / h.totalPages) * 100))
}

const coverErrorMap = ref<Record<string, boolean>>({})
const hasCover = (b: any) => !!b?.coverImage && !coverErrorMap.value[b._id]

const openReader = (book: any) => {
  if (book._status !== 'expired') navigateTo(`/read/${book._id}`)
}

onMounted(fetchLibrary)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold flex items-center gap-2">
          <UIcon name="i-lucide-library" class="w-8 h-8 text-indigo-500" />
          คลังหนังสือของฉัน
        </h1>
        <p class="text-gray-500 text-sm mt-1">หนังสือที่ซื้อและเช่าทั้งหมด</p>
      </div>
      <UButton icon="i-lucide-refresh-cw" variant="soft" color="neutral" :loading="loading" @click="fetchLibrary" />
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-indigo-500" />
    </div>

    <div v-else-if="allBooks.length === 0" class="text-center py-20">
      <UIcon name="i-lucide-book-open" class="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
      <p class="text-gray-500 text-lg mb-2">ยังไม่มีหนังสือในคลัง</p>
      <UButton to="/books" label="สำรวจหนังสือ" icon="i-lucide-compass" color="primary" class="mt-2" />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
      <div
        v-for="book in allBooks"
        :key="book._id"
        class="flex sm:flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        :class="{ 'cursor-pointer': book._status !== 'expired' }"
        @click="openReader(book)"
      >
        <!-- Cover -->
        <div class="w-24 shrink-0 sm:w-full sm:aspect-[3/4] relative bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center overflow-hidden">
          <img
            v-if="hasCover(book)"
            :src="book.coverImage"
            :alt="book.title"
            class="w-full h-full object-cover"
            @error="coverErrorMap[book._id] = true"
          />
          <UIcon v-else name="i-lucide-book-open" class="w-8 h-8 sm:w-16 sm:h-16 text-indigo-300 dark:text-indigo-700" />

          <!-- Access type badge -->
          <div class="absolute top-2 left-2">
            <UBadge
              :color="book.accessControl?.accessType === 'rental' ? 'warning' : 'success'"
              variant="solid"
              size="xs"
            >
              {{ book.accessControl?.accessType === 'rental' ? 'เช่า' : 'ซื้อ' }}
            </UBadge>
          </div>

          <!-- Expired overlay -->
          <div v-if="book._status === 'expired'" class="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span class="text-white text-xs font-semibold bg-red-500 px-2 py-1 rounded-full">หมดอายุ</span>
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0 p-3 sm:p-4 flex flex-col">
          <h3 class="font-semibold text-sm truncate mb-0.5">{{ book.title }}</h3>
          <p class="text-xs text-gray-500 truncate mb-2 sm:mb-3">{{ book.author }}</p>

          <!-- Reading progress -->
          <div v-if="book.readingHistory" class="mb-2 sm:mb-3">
            <div class="flex justify-between text-xs text-gray-400 mb-1">
              <span>อ่านแล้ว</span>
              <span>{{ progressPercent(book.readingHistory) }}%</span>
            </div>
            <div class="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                :style="{ width: progressPercent(book.readingHistory) + '%' }"
              />
            </div>
            <p v-if="book.readingHistory.completed" class="text-xs text-emerald-500 mt-1 flex items-center gap-1">
              <UIcon name="i-lucide-check-circle" class="w-3 h-3" /> อ่านจบแล้ว
            </p>
          </div>

          <!-- Rental expiry -->
          <div v-if="book.accessControl?.accessType === 'rental' && book.accessControl?.rentalExpireAt && book._status === 'rented'" class="text-xs text-gray-400 mb-2 sm:mb-3 flex items-center gap-1">
            <UIcon name="i-lucide-clock" class="w-3 h-3" />
            เหลือ {{ daysLeft(book.accessControl.rentalExpireAt) }} วัน
          </div>

          <!-- Actions -->
          <div class="flex gap-2 mt-auto">
            <UButton
              v-if="book._status !== 'expired'"
              :to="`/read/${book._id}`"
              label="อ่านเลย"
              icon="i-lucide-book-open"
              color="primary"
              size="sm"
              class="flex-1"
              @click.stop
            />
            <UButton
              :to="`/books/${book._id}`"
              icon="i-lucide-info"
              variant="soft"
              color="neutral"
              size="sm"
              @click.stop
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>