<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const toast = useToast()

useSeoMeta({ title: 'คำสั่งซื้อของฉัน — BookVerse' })

const orders = ref<any[]>([])
const loading = ref(true)
const expandedId = ref<string | null>(null)

const statusMap: Record<string, { label: string; color: string; icon: string }> = {
    paid: { label: 'ชำระแล้ว', color: 'success', icon: 'i-lucide-check-circle' },
    pending: { label: 'รอชำระ', color: 'warning', icon: 'i-lucide-clock' },
    failed: { label: 'ล้มเหลว', color: 'error', icon: 'i-lucide-x-circle' },
    refunded: { label: 'คืนเงินแล้ว', color: 'neutral', icon: 'i-lucide-undo-2' }
}

const fetchOrders = async () => {
    loading.value = true
    try {
        orders.value = await $fetch<any[]>('/api/orders')
    } catch (err: any) {
        toast.add({ title: 'โหลดคำสั่งซื้อไม่สำเร็จ', color: 'error' })
    } finally {
        loading.value = false
    }
}

const toggleExpand = (id: string) => {
    expandedId.value = expandedId.value === id ? null : id
}

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

onMounted(fetchOrders)
</script>

<template>
    <div class="max-w-4xl mx-auto px-4 py-8">
        <!-- Header -->
        <div class="mb-8 animate-fade-in-up">
            <h1 class="text-3xl font-bold flex items-center gap-2 mb-2">
                <UIcon name="i-lucide-package" class="w-8 h-8 text-indigo-500" />
                คำสั่งซื้อของฉัน
            </h1>
            <p class="text-gray-500 text-sm">ประวัติการซื้อและเช่าหนังสือทั้งหมด</p>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-20">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-indigo-500" />
        </div>

        <!-- Empty -->
        <div v-else-if="orders.length === 0" class="text-center py-20 animate-fade-in-up">
            <UIcon name="i-lucide-package-x" class="w-20 h-20 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <p class="text-xl font-semibold text-gray-500 mb-2">ยังไม่มีคำสั่งซื้อ</p>
            <p class="text-gray-400 text-sm mb-6">เริ่มต้นสำรวจหนังสือที่น่าสนใจ</p>
            <UButton to="/books" label="สำรวจหนังสือ" icon="i-lucide-book-open" color="primary" size="lg" />
        </div>

        <!-- Orders -->
        <div v-else class="space-y-4 stagger-children">
            <div v-for="order in orders" :key="order._id"
                class="order-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm transition-all"
                :class="{ 'ring-2 ring-indigo-500/20': expandedId === order._id }">
                <!-- Order Header (Clickable) -->
                <button
                    class="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    @click="toggleExpand(order._id)">
                    <div class="flex items-center gap-4 min-w-0">
                        <div class="order-icon-circle">
                            <UIcon :name="statusMap[order.status]?.icon || 'i-lucide-package'" class="w-5 h-5" />
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-sm font-bold">คำสั่งซื้อ #{{ order._id?.slice(-8)?.toUpperCase()
                                    }}</span>
                                <UBadge :color="(statusMap[order.status]?.color || 'neutral') as any" variant="subtle"
                                    size="xs">
                                    {{ statusMap[order.status]?.label || order.status }}
                                </UBadge>
                            </div>
                            <p class="text-xs text-gray-500">{{ formatDate(order.createdAt) }}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 shrink-0">
                        <div class="text-right">
                            <span class="text-lg font-bold text-indigo-600 dark:text-indigo-400">฿{{ order.total
                                }}</span>
                            <p class="text-xs text-gray-400">{{ order.items?.length }} รายการ</p>
                        </div>
                        <UIcon name="i-lucide-chevron-down" class="w-5 h-5 text-gray-400 transition-transform"
                            :class="{ 'rotate-180': expandedId === order._id }" />
                    </div>
                </button>

                <!-- Order Details (Expandable) -->
                <div v-if="expandedId === order._id"
                    class="border-t border-gray-100 dark:border-gray-800 px-6 py-5 animate-slide-down">
                    <div class="space-y-3 mb-4">
                        <div v-for="item in order.items" :key="item.book?._id || item.book"
                            class="flex items-center gap-3">
                            <div
                                class="w-10 h-14 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center shrink-0 overflow-hidden">
                                <img v-if="item.book?.coverImage" :src="item.book.coverImage" :alt="item.book?.title"
                                    class="w-full h-full object-cover" />
                                <UIcon v-else name="i-lucide-book-open" class="w-4 h-4 text-indigo-300" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <NuxtLink :to="`/books/${item.book?._id}`"
                                    class="text-sm font-semibold truncate block hover:text-indigo-600 transition-colors">
                                    {{ item.book?.title || 'หนังสือ' }}
                                </NuxtLink>
                                <p class="text-xs text-gray-500">{{ item.book?.author }}</p>
                            </div>
                            <UBadge :color="item.type === 'rental' ? 'purple' as any : 'primary'" variant="subtle"
                                size="xs">
                                {{ item.type === 'rental' ? 'เช่า' : 'ซื้อ' }}
                            </UBadge>
                            <span class="text-sm font-bold shrink-0">฿{{ item.price }}</span>
                        </div>
                    </div>

                    <div class="flex items-center justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
                        <span class="text-sm font-bold text-indigo-600 dark:text-indigo-400">รวม ฿{{ order.total
                            }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.order-card {
    transition: all 0.3s ease;
}

.order-card:hover {
    box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.08);
}

.order-icon-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6366f1;
    flex-shrink: 0;
}

:root.dark .order-icon-circle {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
}

.animate-slide-down {
    animation: slideDown 0.3s ease-out forwards;
}

@keyframes slideDown {
    from {
        opacity: 0;
        max-height: 0;
    }

    to {
        opacity: 1;
        max-height: 1000px;
    }
}

.animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
