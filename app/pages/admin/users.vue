<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useSeoMeta({ title: 'จัดการผู้ใช้ — Admin' })

const toast = useToast()
const users = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const page = ref(1)
const totalPages = ref(1)
const totalUsers = ref(0)
const updatingId = ref<string | null>(null)

const fetchUsers = async () => {
  loading.value = true
  try {
    const data = await $fetch<any>('/api/admin/users', {
      params: { page: page.value, limit: 20, search: search.value || undefined }
    })
    users.value = data.users || []
    totalPages.value = data.totalPages || 1
    totalUsers.value = data.total || 0
  } catch {
    toast.add({ title: 'โหลดผู้ใช้ไม่สำเร็จ', color: 'error' })
  } finally {
    loading.value = false
  }
}

const updateUser = async (userId: string, payload: any) => {
  updatingId.value = userId
  try {
    await $fetch(`/api/admin/users/${userId}`, { method: 'put' as any, body: payload })
    toast.add({ title: 'อัปเดตผู้ใช้เรียบร้อย', color: 'success' })
    await fetchUsers()
  } catch (err: any) {
    toast.add({ title: err.data?.message || 'เกิดข้อผิดพลาด', color: 'error' })
  } finally {
    updatingId.value = null
  }
}

const toggleBan = (u: any) => updateUser(u._id, { status: u.status === 'banned' ? 'active' : 'banned' })
const toggleAdmin = (u: any) => updateUser(u._id, { role: u.role === 'admin' ? 'user' : 'admin' })

const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })

watch([search], () => { page.value = 1; fetchUsers() })
watch(page, fetchUsers)
onMounted(fetchUsers)
</script>

<template>
  <div class="max-w-[96rem] mx-auto px-4 py-8">
    <AdminNav />
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold flex items-center gap-2">
          <UIcon name="i-lucide-users" class="w-8 h-8 text-indigo-500" />
          จัดการผู้ใช้
        </h1>
        <p class="text-gray-500 text-sm mt-1">ทั้งหมด {{ totalUsers }} ราย</p>
      </div>
    </div>

    <!-- Search -->
    <UInput v-model="search" placeholder="ค้นหาชื่อหรืออีเมล..." icon="i-lucide-search" class="max-w-md mb-6" />

    <!-- Table -->
    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-indigo-500" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th class="text-left px-4 py-3 font-semibold">ผู้ใช้</th>
              <th class="text-left px-4 py-3 font-semibold hidden sm:table-cell">สมัครเมื่อ</th>
              <th class="text-center px-4 py-3 font-semibold hidden md:table-cell">คำสั่งซื้อ</th>
              <th class="text-right px-4 py-3 font-semibold hidden md:table-cell">ยอดรวม</th>
              <th class="text-center px-4 py-3 font-semibold">Role</th>
              <th class="text-center px-4 py-3 font-semibold">สถานะ</th>
              <th class="text-center px-4 py-3 font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in users"
              :key="u._id"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {{ u.name?.charAt(0) || 'U' }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold truncate max-w-[150px]">{{ u.name }}</p>
                    <p class="text-xs text-gray-400 truncate max-w-[150px]">{{ u.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{{ formatDate(u.createdAt) }}</td>
              <td class="px-4 py-3 text-center hidden md:table-cell">{{ u.orderCount || 0 }}</td>
              <td class="px-4 py-3 text-right font-medium hidden md:table-cell">฿{{ (u.totalSpent || 0).toLocaleString() }}</td>
              <td class="px-4 py-3 text-center">
                <UBadge :color="u.role === 'admin' ? 'warning' : 'neutral'" variant="subtle" size="xs">
                  {{ u.role }}
                </UBadge>
              </td>
              <td class="px-4 py-3 text-center">
                <UBadge :color="u.status === 'banned' ? 'error' : 'success'" variant="subtle" size="xs">
                  {{ u.status === 'banned' ? 'แบน' : 'ใช้งาน' }}
                </UBadge>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <UButton
                    :icon="u.role === 'admin' ? 'i-lucide-shield-off' : 'i-lucide-shield'"
                    :color="u.role === 'admin' ? 'warning' : 'neutral'"
                    variant="ghost"
                    size="xs"
                    :loading="updatingId === u._id"
                    :title="u.role === 'admin' ? 'ถอด Admin' : 'ให้สิทธิ์ Admin'"
                    @click="toggleAdmin(u)"
                  />
                  <UButton
                    :icon="u.status === 'banned' ? 'i-lucide-user-check' : 'i-lucide-user-x'"
                    :color="u.status === 'banned' ? 'success' : 'error'"
                    variant="ghost"
                    size="xs"
                    :loading="updatingId === u._id"
                    :title="u.status === 'banned' ? 'ปลดแบน' : 'แบนผู้ใช้'"
                    @click="toggleBan(u)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="users.length === 0" class="text-center py-12 text-gray-400">
          <UIcon name="i-lucide-users" class="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p>ไม่พบผู้ใช้</p>
        </div>
        <div class="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 flex items-center justify-between">
          <span>{{ totalUsers }} ราย</span>
          <UPagination v-if="totalPages > 1" v-model="page" :total="totalUsers" :items-per-page="20" size="xs" />
        </div>
      </div>
    </div>
  </div>
</template>