<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { cart, fetchCart, removeFromCart, updateCartItemType, total, itemCount } = useCart()
const toast = useToast()

const coverErrorMap = ref<Record<string, boolean>>({})
const hasCover = (book: any) => !!book?.coverImage && !coverErrorMap.value[book._id]
const onCoverError = (bookId: string) => {
  coverErrorMap.value[bookId] = true
}

useSeoMeta({ title: 'ตะกร้าสินค้า — BookVerse' })

const handleRemove = async (bookId: string) => {
  try {
    await removeFromCart(bookId)
    toast.add({ title: 'ลบออกจากตะกร้าแล้ว', color: 'neutral' })
  } catch (err: any) {
    toast.add({ title: err.data?.message || 'เกิดข้อผิดพลาด', color: 'error' })
  }
}

const handleChangeType = async (bookId: string, type: 'purchase' | 'rental') => {
  try {
    await updateCartItemType(bookId, type)
    toast.add({ title: 'อัปเดตประเภทเรียบร้อย', color: 'neutral' })
  } catch (err: any) {
    toast.add({ title: err.data?.message || 'เกิดข้อผิดพลาด', color: 'error' })
  }
}

onMounted(async () => {
  await fetchCart()
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-2 flex items-center gap-2">
      <UIcon name="i-lucide-shopping-cart" class="w-8 h-8 text-indigo-500" />
      ตะกร้าสินค้า
    </h1>
    <p class="text-gray-500 mb-8">{{ itemCount }} รายการ</p>

    <div v-if="!cart?.items?.length" class="text-center py-20">
      <UIcon name="i-lucide-shopping-bag" class="w-20 h-20 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
      <p class="text-xl font-semibold text-gray-500 mb-2">ตะกร้าว่างเปล่า</p>
      <UButton to="/books" label="สำรวจหนังสือ" icon="i-lucide-book-open" color="primary" size="lg" class="mt-4" />
    </div>

    <div v-else>
      <div class="space-y-4 mb-8">
        <div v-for="item in cart.items" :key="item.book?._id"
          class="flex gap-3 bg-white dark:bg-gray-900 border rounded-xl p-4">
          <!-- Cover -->
          <div
            class="w-14 h-18 min-w-[56px] rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center overflow-hidden"
            style="height: 72px">
            <img v-if="hasCover(item.book)" :src="item.book.coverImage" :alt="item.book.title"
              class="w-full h-full object-cover" @error="onCoverError(item.book._id)" />
            <UIcon v-else name="i-lucide-book-open" class="w-6 h-6 text-indigo-300" />
          </div>
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h3 class="font-semibold text-sm truncate">{{ item.book?.title }}</h3>
                <p class="text-xs text-gray-500 truncate">{{ item.book?.author }}</p>
              </div>
              <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" class="shrink-0 -mr-1 -mt-1"
                @click="handleRemove(item.book?._id || item.book)" />
            </div>
            <div class="flex items-center justify-between mt-2 gap-2">
              <div class="flex items-center gap-1">
                <button class="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                  :class="item.type === 'purchase'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'"
                  @click.prevent="handleChangeType(item.book?._id || item.book, 'purchase')">
                  ซื้อ
                </button>
                <button class="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                  :class="item.type === 'rental'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'"
                  :disabled="!item.book?.isRentable || !item.book?.rentalPrice"
                  @click.prevent="handleChangeType(item.book?._id || item.book, 'rental')">
                  เช่า
                </button>
              </div>
              <p class="text-base font-bold text-indigo-600 dark:text-indigo-400 shrink-0">฿{{ item.price }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-900 border rounded-2xl p-6">
        <div class="flex items-center justify-between mb-4">
          <span class="text-gray-500">รวมทั้งหมด</span>
          <span class="text-2xl font-bold text-indigo-600">฿{{ total }}</span>
        </div>
        <UButton to="/checkout" label="ดำเนินการชำระเงิน" icon="i-lucide-credit-card" color="primary" size="lg" block />
        <p class="text-center text-xs text-gray-400 mt-3">ชำระเงินอย่างปลอดภัย (สาธิต)</p>
      </div>
    </div>
  </div>
</template>
