<script setup lang="ts">
const route = useRoute()

const links = [
  { label: 'หนังสือ', to: '/admin', icon: 'i-lucide-book-open' },
  { label: 'ผู้ใช้', to: '/admin/users', icon: 'i-lucide-users' },
  { label: 'คำสั่งซื้อ', to: '/admin/orders', icon: 'i-lucide-package' },
  { label: 'รีวิว', to: '/admin/reviews', icon: 'i-lucide-message-square' },
  { label: 'Analytics', to: '/admin/analytics', icon: 'i-lucide-bar-chart-3' }
]

const isActive = (to: string) =>
  to === '/admin' ? route.path === '/admin' : route.path.startsWith(to)
</script>

<template>
  <nav class="flex gap-1 mb-8 overflow-x-auto pb-1">
    <UButton
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      :label="link.label"
      :icon="link.icon"
      variant="ghost"
      color="neutral"
      size="sm"
      :class="isActive(link.to)
        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
        : ''"
    />
  </nav>
</template>