<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const toast = useToast()

useSeoMeta({ title: 'ดาวน์โหลด — BookVerse' })

type DownloadItem = {
  _id: string
  token: string
  book?: {
    _id?: string
    title?: string
    author?: string
    coverImage?: string
  }
  orderId?: string
  type: 'purchase' | 'rental'
  maxDownloads: number
  remainingDownloads: number
  expiresAt: string
  isExpired: boolean
  canDownload: boolean
}

type FetchError = {
  data?: {
    statusMessage?: string
  }
}

const downloads = ref<DownloadItem[]>([])
const loading = ref(true)

const getErrorMessage = (error: unknown) => {
  const fetchError = error as FetchError
  return fetchError.data?.statusMessage || 'โหลดรายการดาวน์โหลดไม่สำเร็จ'
}

const fetchDownloads = async () => {
  loading.value = true
  try {
    downloads.value = await $fetch<DownloadItem[]>('/api/downloads')
  } catch (err: unknown) {
    toast.add({
      title: getErrorMessage(err),
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const statusColor = (item: DownloadItem) => {
  if (item.canDownload) return item.type === 'rental' ? 'primary' : 'success'
  return 'neutral'
}

const statusLabel = (item: DownloadItem) => {
  if (item.isExpired) return 'หมดอายุ'
  if (item.remainingDownloads <= 0) return 'ครบจำนวนดาวน์โหลด'
  return item.type === 'rental' ? 'เช่าอยู่' : 'ซื้อแล้ว'
}

onMounted(fetchDownloads)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold mb-2 flex items-center gap-2">
          <UIcon
            name="i-lucide-download"
            class="w-8 h-8 text-indigo-500"
          />
          ดาวน์โหลด
        </h1>
        <p class="text-gray-500">
          หนังสือที่คุณซื้อหรือเช่าไว้
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        variant="soft"
        color="neutral"
        aria-label="รีเฟรช"
        :loading="loading"
        @click="fetchDownloads"
      />
    </div>

    <div
      v-if="loading"
      class="flex justify-center py-20"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-indigo-500"
      />
    </div>

    <div
      v-else-if="downloads.length === 0"
      class="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800"
    >
      <UIcon
        name="i-lucide-package"
        class="w-16 h-16 text-gray-300 mx-auto mb-4"
      />
      <p class="text-gray-500 text-lg mb-2">
        ยังไม่มีรายการดาวน์โหลด
      </p>
      <p class="text-gray-400 text-sm mb-6">
        ซื้อหรือเช่าหนังสือเพื่อเริ่มดาวน์โหลด
      </p>
      <UButton
        to="/books"
        label="สำรวจหนังสือ"
        icon="i-lucide-book-open"
        color="primary"
      />
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <article
        v-for="item in downloads"
        :key="item._id"
        class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-5"
      >
        <div class="flex gap-4">
          <NuxtLink
            :to="`/books/${item.book?._id}`"
            class="w-20 sm:w-24 aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center shrink-0"
          >
            <img
              v-if="item.book?.coverImage"
              :src="item.book.coverImage"
              :alt="item.book?.title"
              class="w-full h-full object-cover"
            >
            <UIcon
              v-else
              name="i-lucide-book-open"
              class="w-8 h-8 text-indigo-300"
            />
          </NuxtLink>

          <div class="min-w-0 flex-1">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div class="min-w-0">
                <NuxtLink
                  :to="`/books/${item.book?._id}`"
                  class="font-semibold text-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1"
                >
                  {{ item.book?.title || 'หนังสือ' }}
                </NuxtLink>
                <p class="text-sm text-gray-500 line-clamp-1">
                  {{ item.book?.author }}
                </p>
              </div>
              <UBadge
                :color="statusColor(item)"
                variant="subtle"
                class="self-start"
              >
                {{ statusLabel(item) }}
              </UBadge>
            </div>

            <div class="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
              <div class="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <p class="text-xs text-gray-400 mb-1">
                  ประเภท
                </p>
                <p class="font-semibold">
                  {{ item.type === 'rental' ? 'เช่า' : 'ซื้อ' }}
                </p>
              </div>
              <div class="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <p class="text-xs text-gray-400 mb-1">
                  วันหมดอายุ
                </p>
                <p class="font-semibold">
                  {{ formatDate(item.expiresAt) }}
                </p>
              </div>
              <div class="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <p class="text-xs text-gray-400 mb-1">
                  ดาวน์โหลดคงเหลือ
                </p>
                <p class="font-semibold">
                  {{ item.remainingDownloads }} / {{ item.maxDownloads }}
                </p>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
              <p class="text-xs text-gray-400">
                คำสั่งซื้อ #{{ item.orderId?.slice(-8)?.toUpperCase() }}
              </p>
              <UButton
                :to="`/api/downloads/${item.token}`"
                external
                target="_blank"
                icon="i-lucide-download"
                label="ดาวน์โหลด PDF"
                :disabled="!item.canDownload"
                color="primary"
              />
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
