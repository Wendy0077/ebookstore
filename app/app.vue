<script setup lang="ts">
const { fetchUser, isLoggedIn, user, logout } = useAuth()
const { fetchCart, itemCount } = useCart()
const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications()
const route = useRoute()

let notificationsInterval: ReturnType<typeof setInterval> | undefined

const title = 'BookVerse — ร้านหนังสือออนไลน์'
const description = 'ค้นหา ซื้อ และเช่าหนังสือออนไลน์ ดาวน์โหลดได้ทันที พร้อมระบบแนะนำหนังสือที่ตรงใจ'

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap',
      media: 'print',
      onload: "this.media='all'"
    }
  ],
  htmlAttrs: { lang: 'th' }
})

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})

onMounted(() => {
  // Run auth + cart fetch in parallel, don't block render
  fetchUser().then(() => {
    if (isLoggedIn.value) {
      fetchCart()
      fetchNotifications()
      notificationsInterval = setInterval(fetchNotifications, 2 * 60 * 1000)
    }
  })
})

onUnmounted(() => {
  if (notificationsInterval) clearInterval(notificationsInterval)
})

const navLinks = [
  { label: 'หน้าแรก', to: '/', icon: 'i-lucide-home' },
  { label: 'หนังสือ', to: '/books', icon: 'i-lucide-book-open' },
  { label: 'คลังหนังสือ', to: '/library', icon: 'i-lucide-library' }
]
</script>

<template>
  <UApp>
    <UHeader v-if="!route.path.startsWith('/read/')" :toggle="false">
      <template #left>
        <NuxtLink to="/" class="flex items-center gap-2 group">
          <div
            class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/25 transition-shadow">
            <UIcon name="i-lucide-book-open" class="w-5 h-5 text-white" />
          </div>
          <span class="text-lg font-bold text-gradient hidden sm:inline">BookVerse</span>
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-1 ml-6">
          <UButton v-for="link in navLinks" :key="link.to" :to="link.to" :label="link.label" :icon="link.icon"
            variant="ghost" color="neutral" size="sm" />
        </nav>
      </template>

      <template #right>
        <UColorModeButton />

        <!-- Cart Button -->
        <UButton v-if="isLoggedIn" to="/cart" icon="i-lucide-shopping-cart" color="neutral" variant="ghost"
          :badge="itemCount > 0 ? itemCount : undefined" aria-label="ตะกร้า" />

        <!-- Notifications -->
        <UPopover v-if="isLoggedIn" :content="{ side: 'bottom', align: 'end' }">
          <UButton icon="i-lucide-bell" color="neutral" variant="ghost"
            :badge="unreadCount > 0 ? unreadCount : undefined" aria-label="การแจ้งเตือน" />

          <template #content>
            <div class="w-80 max-h-96 overflow-y-auto p-2">
              <div class="flex items-center justify-between px-2 py-1.5">
                <span class="text-sm font-semibold">การแจ้งเตือน</span>
                <UButton v-if="unreadCount > 0" label="อ่านทั้งหมด" size="xs" variant="link" color="neutral"
                  @click="markAllAsRead" />
              </div>
              <p v-if="notifications.length === 0" class="text-sm text-gray-400 text-center py-6">ไม่มีการแจ้งเตือน</p>
              <button v-for="n in notifications" :key="n._id" type="button"
                class="w-full text-left px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                :class="{ 'bg-indigo-50 dark:bg-indigo-950/40': !n.isRead }" @click="markAsRead(n._id)">
                <p class="text-sm font-medium">{{ n.title }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ n.message }}</p>
              </button>
            </div>
          </template>
        </UPopover>

        <!-- User Menu -->
        <template v-if="isLoggedIn">
          <UDropdownMenu :items="[
            [
              { label: user?.name || '', type: 'label' as const }
            ],
            [
              { label: 'คลังหนังสือ', icon: 'i-lucide-library', to: '/library' },
              { label: 'รายการที่บันทึก', icon: 'i-lucide-heart', to: '/wishlist' },
              { label: 'คำสั่งซื้อ', icon: 'i-lucide-package', to: '/orders' }
            ],
            ...(user?.role === 'admin' ? [[
              { label: 'Admin', icon: 'i-lucide-shield', to: '/admin' }
            ]] : []),
            [
              { label: 'ออกจากระบบ', icon: 'i-lucide-log-out', onSelect: logout }
            ]
          ]">
            <UButton :label="user?.name" icon="i-lucide-user" color="neutral" variant="ghost" size="sm"
              class="hidden sm:inline-flex" />
            <UButton icon="i-lucide-user" color="neutral" variant="ghost" size="sm" class="sm:hidden"
              aria-label="เมนูผู้ใช้" />
          </UDropdownMenu>
        </template>

        <template v-else>
          <UButton to="/login" label="เข้าสู่ระบบ" icon="i-lucide-log-in" color="primary" variant="soft" size="sm" />
        </template>
      </template>
    </UHeader>

    <UMain class="pb-16 md:pb-0">
      <NuxtPage />
    </UMain>

    <!-- Mobile Bottom Navigation -->
    <nav
      v-if="!route.path.startsWith('/read/')"
      class="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <div class="flex items-center justify-around h-14">
        <NuxtLink
          to="/"
          class="flex flex-col items-center gap-0.5 px-4 py-1 transition-colors"
          :class="route.path === '/' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'"
        >
          <UIcon name="i-lucide-home" class="w-5 h-5" />
          <span class="text-[10px] font-medium">หน้าแรก</span>
        </NuxtLink>

        <NuxtLink
          to="/books"
          class="flex flex-col items-center gap-0.5 px-4 py-1 transition-colors"
          :class="route.path.startsWith('/books') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'"
        >
          <UIcon name="i-lucide-book-open" class="w-5 h-5" />
          <span class="text-[10px] font-medium">หนังสือ</span>
        </NuxtLink>

        <NuxtLink
          v-if="isLoggedIn"
          to="/library"
          class="flex flex-col items-center gap-0.5 px-4 py-1 transition-colors"
          :class="route.path.startsWith('/library') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'"
        >
          <UIcon name="i-lucide-library" class="w-5 h-5" />
          <span class="text-[10px] font-medium">คลัง</span>
        </NuxtLink>

        <NuxtLink
          v-if="isLoggedIn"
          to="/cart"
          class="relative flex flex-col items-center gap-0.5 px-4 py-1 transition-colors"
          :class="route.path.startsWith('/cart') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'"
        >
          <div class="relative">
            <UIcon name="i-lucide-shopping-cart" class="w-5 h-5" />
            <span
              v-if="itemCount > 0"
              class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
            >{{ itemCount > 9 ? '9+' : itemCount }}</span>
          </div>
          <span class="text-[10px] font-medium">ตะกร้า</span>
        </NuxtLink>

        <NuxtLink
          v-if="!isLoggedIn"
          to="/books"
          class="flex flex-col items-center gap-0.5 px-4 py-1 transition-colors"
          :class="route.path.startsWith('/books') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'"
        >
          <UIcon name="i-lucide-book-open" class="w-5 h-5" />
          <span class="text-[10px] font-medium">หนังสือ</span>
        </NuxtLink>

        <NuxtLink
          v-if="!isLoggedIn"
          to="/login"
          class="flex flex-col items-center gap-0.5 px-4 py-1 transition-colors"
          :class="route.path === '/login' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'"
        >
          <UIcon name="i-lucide-log-in" class="w-5 h-5" />
          <span class="text-[10px] font-medium">เข้าสู่ระบบ</span>
        </NuxtLink>
      </div>
    </nav>

    <footer class="hidden md:block border-t border-gray-200 dark:border-gray-800 mt-16">
      <div class="max-w-[96rem] mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Brand -->
          <div class="md:col-span-2">
            <div class="flex items-center gap-2 mb-4">
              <div
                class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <UIcon name="i-lucide-book-open" class="w-5 h-5 text-white" />
              </div>
              <span class="text-lg font-bold text-gradient">BookVerse</span>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              พื้นที่เล็ก ๆ สำหรับคนรักการอ่าน ที่รวมหนังสือคุณภาพจากทั่วทุกมุมโลกไว้ให้ค้นพบ
            </p>
          </div>

          <!-- Links -->
          <div>
            <h4 class="font-semibold text-sm mb-3">เมนู</h4>
            <ul class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <NuxtLink to="/" class="hover:text-indigo-500 transition-colors">หน้าแรก</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/books" class="hover:text-indigo-500 transition-colors">หนังสือทั้งหมด</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/cart" class="hover:text-indigo-500 transition-colors">ตะกร้า</NuxtLink>
              </li>
            </ul>
          </div>

          <div>
            <h4 class="font-semibold text-sm mb-3">ช่วยเหลือ</h4>
            <ul class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><a href="#" class="hover:text-indigo-500 transition-colors">ติดต่อเรา</a></li>
              <li><a href="#" class="hover:text-indigo-500 transition-colors">นโยบายความเป็นส่วนตัว</a></li>
              <li><a href="#" class="hover:text-indigo-500 transition-colors">เงื่อนไขการใช้งาน</a></li>
            </ul>
          </div>
        </div>

        <USeparator class="my-6" />

        <div class="flex items-center justify-between text-xs text-gray-400">
          <p>© {{ new Date().getFullYear() }} BookVerse — All rights reserved.</p>
        </div>
      </div>
    </footer>
  </UApp>
</template>
