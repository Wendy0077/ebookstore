<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useSeoMeta({ title: 'Analytics — Admin' })

const toast = useToast()
const data = ref<any>(null)
const loading = ref(true)

const toInputDate = (d: Date) => {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return tz.toISOString().slice(0, 10)
}

const today = new Date()
const defaultFrom = new Date(today)
defaultFrom.setDate(defaultFrom.getDate() - 6)

const dateRange = ref({ from: toInputDate(defaultFrom), to: toInputDate(today) })

const presets = [
  { label: '7 วัน', days: 7 },
  { label: '30 วัน', days: 30 },
  { label: '90 วัน', days: 90 }
]

const applyPreset = (days: number) => {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  dateRange.value = { from: toInputDate(from), to: toInputDate(to) }
  fetchAnalytics()
}

const applyThisYear = () => {
  const to = new Date()
  const from = new Date(to.getFullYear(), 0, 1)
  dateRange.value = { from: toInputDate(from), to: toInputDate(to) }
  fetchAnalytics()
}

const fetchAnalytics = async () => {
  loading.value = true
  try {
    data.value = await $fetch<any>('/api/admin/analytics', { query: { from: dateRange.value.from, to: dateRange.value.to } })
  } catch {
    toast.add({ title: 'โหลด Analytics ไม่สำเร็จ', color: 'error' })
  } finally {
    loading.value = false
  }
}

const maxRevenue = computed(() => {
  if (!data.value?.salesChart) return 1
  return Math.max(...data.value.salesChart.map((d: any) => d.revenue), 1)
})

const maxCategorySales = computed(() => {
  if (!data.value?.categoryStats) return 1
  return Math.max(...data.value.categoryStats.map((c: any) => c.sales), 1)
})

const formatCurrency = (n: number) => `฿${(n || 0).toLocaleString()}`
const formatDate = (d: string) => {
  if (data.value?.groupBy === 'month') {
    const [y, m] = d.split('-')
    return `${m}/${y}`
  }
  const date = new Date(d)
  return `${date.getDate()}/${date.getMonth() + 1}`
}

onMounted(fetchAnalytics)
</script>

<template>
  <div class="max-w-[96rem] mx-auto px-4 py-8">
    <AdminNav />
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold flex items-center gap-2">
          <UIcon name="i-lucide-bar-chart-3" class="w-8 h-8 text-indigo-500" />
          Analytics
        </h1>
        <p class="text-gray-500 text-sm mt-1">ข้อมูลสถิติและการวิเคราะห์</p>
      </div>
      <UButton icon="i-lucide-refresh-cw" variant="soft" color="neutral" :loading="loading" @click="fetchAnalytics" />
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-8">
      <div class="flex items-center gap-2">
        <UInput v-model="dateRange.from" type="date" :max="dateRange.to" @change="fetchAnalytics" />
        <span class="text-gray-400">—</span>
        <UInput v-model="dateRange.to" type="date" :min="dateRange.from" @change="fetchAnalytics" />
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-for="p in presets"
          :key="p.label"
          size="xs"
          variant="soft"
          color="neutral"
          @click="applyPreset(p.days)"
        >
          {{ p.label }}
        </UButton>
        <UButton size="xs" variant="soft" color="neutral" @click="applyThisYear">ปีนี้</UButton>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-indigo-500" />
    </div>

    <div v-else-if="data" class="space-y-8">
      <!-- Reading stats -->
      <div class="grid sm:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center">
          <UIcon name="i-lucide-book-open" class="w-8 h-8 text-indigo-500 mx-auto mb-2" />
          <p class="text-2xl font-bold">{{ (data.readingStats?.totalReads || 0).toLocaleString() }}</p>
          <p class="text-sm text-gray-500 mt-1">ครั้งที่อ่าน</p>
        </div>
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center">
          <UIcon name="i-lucide-clock" class="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p class="text-2xl font-bold">{{ Math.round(data.readingStats?.avgTime || 0) }}</p>
          <p class="text-sm text-gray-500 mt-1">เฉลี่ยนาที/ครั้ง</p>
        </div>
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center">
          <UIcon name="i-lucide-check-circle" class="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p class="text-2xl font-bold">{{ (data.readingStats?.completed || 0).toLocaleString() }}</p>
          <p class="text-sm text-gray-500 mt-1">อ่านจบ</p>
        </div>
      </div>

      <!-- Sales Chart (7 days) -->
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h2 class="text-lg font-bold mb-6 flex items-center gap-2">
          <UIcon name="i-lucide-trending-up" class="w-5 h-5 text-indigo-500" />
          ยอดขาย
        </h2>
        <div class="flex items-end gap-3 h-48">
          <div
            v-for="day in data.salesChart"
            :key="day.date"
            class="flex-1 flex flex-col items-center gap-1"
          >
            <span class="text-xs text-gray-400">{{ formatCurrency(day.revenue) }}</span>
            <div
              class="w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-purple-500 transition-all min-h-[4px]"
              :style="{ height: Math.max(4, (day.revenue / maxRevenue) * 160) + 'px' }"
            />
            <span class="text-xs text-gray-400">{{ formatDate(day.date) }}</span>
            <span class="text-xs text-gray-300">{{ day.orders }}x</span>
          </div>
        </div>
      </div>

      <!-- Category Stats -->
      <div class="grid lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
            <UIcon name="i-lucide-tag" class="w-5 h-5 text-purple-500" />
            ยอดขายตามหมวดหมู่
          </h2>
          <div class="space-y-3">
            <div v-for="cat in data.categoryStats" :key="cat.name" class="flex items-center gap-3">
              <span class="text-sm text-gray-600 dark:text-gray-400 w-28 truncate">{{ cat.name }}</span>
              <div class="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  :style="{ width: Math.max(2, (cat.sales / maxCategorySales) * 100) + '%' }"
                />
              </div>
              <span class="text-sm font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">{{ cat.sales }}</span>
            </div>
            <p v-if="data.categoryStats?.length === 0" class="text-gray-400 text-sm text-center py-4">ไม่มีข้อมูล</p>
          </div>
        </div>

        <!-- Top Books -->
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
            <UIcon name="i-lucide-flame" class="w-5 h-5 text-orange-500" />
            หนังสือขายดี Top 10
          </h2>
          <div class="space-y-2">
            <div
              v-for="(book, idx) in data.topBooks"
              :key="book._id"
              class="flex items-center gap-3 py-1.5"
            >
              <span class="w-5 text-xs text-gray-400 text-right font-mono">{{ Number(idx) + 1 }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ book.title }}</p>
                <p class="text-xs text-gray-400 truncate">{{ book.author }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <span class="text-sm font-bold text-indigo-600 dark:text-indigo-400">{{ book.salesCount }}</span>
                <span class="text-xs text-gray-400 ml-1">ขาย</span>
              </div>
            </div>
            <p v-if="data.topBooks?.length === 0" class="text-gray-400 text-sm text-center py-4">ไม่มีข้อมูล</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>