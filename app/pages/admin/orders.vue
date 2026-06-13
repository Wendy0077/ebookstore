<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useSeoMeta({ title: 'จัดการคำสั่งซื้อ — Admin' })

const toast = useToast()
const orders = ref<any[]>([])
const loading = ref(false)
const refundingId = ref<string | null>(null)
const page = ref(1)
const totalPages = ref(1)
const totalOrders = ref(0)
const statusFilter = ref('all')
const expandedId = ref<string | null>(null)

const statusMap: Record<string, any> = {
  paid: { label: 'ชำระแล้ว', color: 'success' },
  pending: { label: 'รอชำระ', color: 'warning' },
  failed: { label: 'ล้มเหลว', color: 'error' },
  refunded: { label: 'คืนเงินแล้ว', color: 'neutral' }
}

const statusOptions = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'ชำระแล้ว', value: 'paid' },
  { label: 'รอชำระ', value: 'pending' },
  { label: 'คืนเงินแล้ว', value: 'refunded' }
]

const fetchOrders = async () => {
  loading.value = true
  try {
    const data = await $fetch<any>('/api/admin/orders', {
      params: { page: page.value, limit: 20, status: statusFilter.value }
    })
    orders.value = data.orders || []
    totalPages.value = data.totalPages || 1
    totalOrders.value = data.total || 0
  } catch {
    toast.add({ title: 'โหลดคำสั่งซื้อไม่สำเร็จ', color: 'error' })
  } finally {
    loading.value = false
  }
}

const refund = async (orderId: string) => {
  refundingId.value = orderId
  try {
    await $fetch(`/api/admin/orders/${orderId}/refund`, { method: 'post' as any })
    toast.add({ title: 'คืนเงินเรียบร้อย', color: 'success' })
    await fetchOrders()
  } catch (err: any) {
    toast.add({ title: err.data?.statusMessage || 'เกิดข้อผิดพลาด', color: 'error' })
  } finally {
    refundingId.value = null
  }
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

watch([statusFilter], () => { page.value = 1; fetchOrders() })
watch(page, fetchOrders)
onMounted(fetchOrders)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <AdminNav />
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold flex items-center gap-2">
          <UIcon name="i-lucide-package" class="w-8 h-8 text-indigo-500" />
          จัดการคำสั่งซื้อ
        </h1>
        <p class="text-gray-500 text-sm mt-1">ทั้งหมด {{ totalOrders }} รายการ</p>
      </div>
    </div>

    <div class="flex gap-2 mb-6">
      <USelect
        v-model="statusFilter"
        :items="statusOptions.map(s => ({ label: s.label, value: s.value }))"
        class="w-40"
      />
    </div>

    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-indigo-500" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th class="text-left px-4 py-3 font-semibold">รหัส</th>
              <th class="text-left px-4 py-3 font-semibold">ผู้ใช้</th>
              <th class="text-left px-4 py-3 font-semibold hidden sm:table-cell">วันที่</th>
              <th class="text-center px-4 py-3 font-semibold hidden md:table-cell">รายการ</th>
              <th class="text-right px-4 py-3 font-semibold">ยอดรวม</th>
              <th class="text-center px-4 py-3 font-semibold">สถานะ</th>
              <th class="text-center px-4 py-3 font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="order in orders" :key="order._id">
              <tr
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
                @click="expandedId = expandedId === order._id ? null : order._id"
              >
                <td class="px-4 py-3 font-mono text-xs text-gray-400">#{{ order._id?.slice(-8).toUpperCase() }}</td>
                <td class="px-4 py-3">
                  <p class="font-medium">{{ order.user?.name }}</p>
                  <p class="text-xs text-gray-400">{{ order.user?.email }}</p>
                </td>
                <td class="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{{ formatDate(order.createdAt) }}</td>
                <td class="px-4 py-3 text-center hidden md:table-cell">{{ order.items?.length }}</td>
                <td class="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">฿{{ order.total?.toLocaleString() }}</td>
                <td class="px-4 py-3 text-center">
                  <UBadge :color="statusMap[order.status]?.color || 'neutral'" variant="subtle" size="xs">
                    {{ statusMap[order.status]?.label || order.status }}
                  </UBadge>
                </td>
                <td class="px-4 py-3 text-center">
                  <UButton
                    v-if="order.status === 'paid'"
                    label="คืนเงิน"
                    icon="i-lucide-undo-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :loading="refundingId === order._id"
                    @click.stop="refund(order._id)"
                  />
                </td>
              </tr>
              <tr v-if="expandedId === order._id" class="bg-gray-50 dark:bg-gray-800/50">
                <td colspan="7" class="px-6 py-4">
                  <div class="space-y-2">
                    <div v-for="item in order.items" :key="item.book?._id" class="flex items-center gap-3 text-sm">
                      <div class="w-8 h-11 rounded bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
                        <img v-if="item.book?.coverImage" :src="item.book.coverImage" class="w-full h-full object-cover rounded" />
                        <UIcon v-else name="i-lucide-book-open" class="w-4 h-4 text-indigo-400" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-medium truncate">{{ item.book?.title }}</p>
                        <UBadge :color="item.type === 'rental' ? 'warning' : 'primary'" variant="subtle" size="xs">
                          {{ item.type === 'rental' ? 'เช่า' : 'ซื้อ' }}
                        </UBadge>
                      </div>
                      <span class="font-bold">฿{{ item.price }}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <div v-if="orders.length === 0" class="text-center py-12 text-gray-400">
          <UIcon name="i-lucide-package-x" class="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p>ไม่พบคำสั่งซื้อ</p>
        </div>
        <div class="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 flex items-center justify-between">
          <span>{{ totalOrders }} รายการ</span>
          <UPagination v-if="totalPages > 1" v-model="page" :total="totalOrders" :items-per-page="20" size="xs" />
        </div>
      </div>
    </div>
  </div>
</template>