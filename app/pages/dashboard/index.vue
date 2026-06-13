<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user } = useAuth()
useSeoMeta({ title: 'แดชบอร์ด — BookVerse' })

const stats = ref({ purchased: 0, rented: 0 })

onMounted(async () => {
  try {
    const data = await $fetch<any>('/api/library')
    stats.value = { purchased: data.purchased?.length || 0, rented: data.rented?.length || 0 }
  } catch {}
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold">แดชบอร์ด</h1>
      <p class="text-gray-500 mt-1">สวัสดีคุณ {{ user?.name }}</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-4 mb-8">
      <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white">
        <UIcon name="i-lucide-book-open" class="w-7 h-7 text-indigo-200 mb-2" />
        <p class="text-3xl font-bold">{{ stats.purchased }}</p>
        <p class="text-indigo-200 text-sm">หนังสือที่ซื้อ</p>
      </div>
      <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
        <UIcon name="i-lucide-clock" class="w-7 h-7 text-purple-200 mb-2" />
        <p class="text-3xl font-bold">{{ stats.rented }}</p>
        <p class="text-purple-200 text-sm">หนังสือที่เช่า</p>
      </div>
    </div>

    <!-- Quick links -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <NuxtLink to="/library" class="book-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6 group hover:border-indigo-300 transition-colors flex sm:block items-center gap-4">
        <UIcon name="i-lucide-library" class="w-9 h-9 sm:w-10 sm:h-10 text-indigo-500 shrink-0 sm:mb-3" />
        <div>
          <h3 class="font-semibold text-base sm:text-lg mb-0.5 sm:mb-1">คลังหนังสือ</h3>
          <p class="text-sm text-gray-500">หนังสือที่ซื้อและเช่าทั้งหมด</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/orders" class="book-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6 group hover:border-purple-300 transition-colors flex sm:block items-center gap-4">
        <UIcon name="i-lucide-package" class="w-9 h-9 sm:w-10 sm:h-10 text-purple-500 shrink-0 sm:mb-3" />
        <div>
          <h3 class="font-semibold text-base sm:text-lg mb-0.5 sm:mb-1">คำสั่งซื้อ</h3>
          <p class="text-sm text-gray-500">ประวัติการซื้อและเช่าหนังสือ</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/books" class="book-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6 group hover:border-sky-300 transition-colors flex sm:block items-center gap-4">
        <UIcon name="i-lucide-compass" class="w-9 h-9 sm:w-10 sm:h-10 text-sky-500 shrink-0 sm:mb-3" />
        <div>
          <h3 class="font-semibold text-base sm:text-lg mb-0.5 sm:mb-1">สำรวจหนังสือ</h3>
          <p class="text-sm text-gray-500">ค้นหาหนังสือเล่มใหม่ที่ตรงใจ</p>
        </div>
      </NuxtLink>

      <NuxtLink v-if="user?.role === 'admin'" to="/admin" class="book-card bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 sm:p-6 text-white flex sm:block items-center gap-4">
        <UIcon name="i-lucide-shield" class="w-9 h-9 sm:w-10 sm:h-10 text-white/80 shrink-0 sm:mb-3" />
        <div>
          <h3 class="font-semibold text-base sm:text-lg mb-0.5 sm:mb-1">Admin Panel</h3>
          <p class="text-sm text-white/70">จัดการหนังสือ ผู้ใช้ และ Analytics</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
