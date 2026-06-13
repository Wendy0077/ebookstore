<script setup lang="ts">
import { defineAsyncComponent, shallowRef } from 'vue'

const VuePDF = defineAsyncComponent(() =>
  import('@tato30/vue-pdf').then(m => m.VuePDF)
)

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { user } = useAuth()
const toast = useToast()
const bookId = route.params.bookId as string

const bookData = ref<any>(null)
const accessData = ref<any>(null)
const loading = ref(true)
const pdfLoading = ref(true)
const currentPage = ref(1)
const totalPages = ref(0)
const isFocused = ref(true)
const showSidebar = ref(false)
const lastSaveTime = ref(0)
const sessionActive = ref(true)

// PDF document loaded via usePDF composable (client-only)
const pdfDoc = shallowRef<any>(null)

const watermarkText = computed(() => {
  if (!user.value || !accessData.value) return ''
  return `${user.value.email} • ${user.value.id} • ${new Date().toISOString().slice(0, 10)}`
})

const progressPercent = computed(() => {
  if (!totalPages.value) return 0
  return Math.round((currentPage.value / totalPages.value) * 100)
})

const fetchAccess = async () => {
  loading.value = true
  try {
    const data = await $fetch<any>(`/api/reader/${bookId}`)
    bookData.value = data.book
    accessData.value = data.access
    totalPages.value = data.book.pageCount || 0
    currentPage.value = data.access.lastReadPage || 1
    if (currentPage.value < 1) currentPage.value = 1
    useSeoMeta({ title: `${data.book.title} — อ่านหนังสือ` })
  } catch (err: any) {
    const msg = err.data?.statusMessage || 'ไม่มีสิทธิ์เข้าถึงหนังสือนี้'
    toast.add({ title: msg, color: 'error' })
    await navigateTo('/library')
  } finally {
    loading.value = false
  }
}

const saveProgress = async () => {
  const now = Date.now()
  if (now - lastSaveTime.value < 5000) return
  lastSaveTime.value = now
  try {
    await $fetch(`/api/reader/${bookId}/progress`, {
      method: 'POST',
      body: { page: currentPage.value, totalPages: totalPages.value, minutesRead: 1 }
    })
  } catch {}
}

// Force save without debounce — used on exit
const forceSaveProgress = () => {
  navigator.sendBeacon(
    `/api/reader/${bookId}/progress`,
    new Blob(
      [JSON.stringify({ page: currentPage.value, totalPages: totalPages.value, minutesRead: 0 })],
      { type: 'application/json' }
    )
  )
}

onBeforeRouteLeave(() => { forceSaveProgress() })

const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }
const goToPage = (p: number) => { currentPage.value = Math.max(1, Math.min(p, totalPages.value)) }

// Zoom
const scale = ref(1.0)
const ZOOM_STEP = 0.25
const ZOOM_MIN = 0.5
const ZOOM_MAX = 3.0
const zoomIn = () => { scale.value = Math.min(+(scale.value + ZOOM_STEP).toFixed(2), ZOOM_MAX) }
const zoomOut = () => { scale.value = Math.max(+(scale.value - ZOOM_STEP).toFixed(2), ZOOM_MIN) }
const zoomReset = () => { scale.value = 1.0 }
const zoomPercent = computed(() => Math.round(scale.value * 100) + '%')

// Anti-screenshot: blur content when window loses focus
const handleVisibilityChange = () => { isFocused.value = !document.hidden }
const handleWindowBlur = () => { isFocused.value = false }
const handleWindowFocus = () => { isFocused.value = true }

// Block print screen and common shortcuts
const handleKeydown = (e: KeyboardEvent) => {
  const blocked = [
    e.key === 'PrintScreen',
    (e.ctrlKey || e.metaKey) && e.key === 'p',
    (e.ctrlKey || e.metaKey) && e.key === 's',
    (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'i',
    (e.ctrlKey || e.metaKey) && e.key === 'u',
    e.key === 'F12'
  ]
  if (blocked.some(Boolean)) {
    e.preventDefault()
    e.stopPropagation()
    toast.add({ title: 'ไม่อนุญาตให้ใช้ฟังก์ชันนี้ในโหมดอ่านหนังสือ', color: 'warning', duration: 2000 })
    return
  }
  // Zoom shortcuts: Ctrl+= zoom in, Ctrl+- zoom out, Ctrl+0 reset
  if (e.ctrlKey || e.metaKey) {
    if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn() }
    else if (e.key === '-') { e.preventDefault(); zoomOut() }
    else if (e.key === '0') { e.preventDefault(); zoomReset() }
  }
}

watch(currentPage, () => saveProgress())

onMounted(async () => {
  await fetchAccess()

  // Load PDF document client-side after access verified
  if (bookData.value?.fileKey) {
    const { usePDF } = await import('@tato30/vue-pdf')
    const { pdf, pages } = usePDF(`/api/reader/${bookId}/file`)
    watch(pdf, (doc) => { pdfDoc.value = doc }, { immediate: true })
    watch(pages, (p) => { if (p > 0) pdfLoading.value = false }, { immediate: true })
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('blur', handleWindowBlur)
  window.addEventListener('focus', handleWindowFocus)
  window.addEventListener('keydown', handleKeydown, true)
})

onUnmounted(() => {
  forceSaveProgress()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('blur', handleWindowBlur)
  window.removeEventListener('focus', handleWindowFocus)
  window.removeEventListener('keydown', handleKeydown, true)
  sessionActive.value = false
})
</script>

<template>
  <div class="reader-root select-none" @contextmenu.prevent>

    <!-- Loading screen -->
    <div v-if="loading" class="reader-loading">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-indigo-500 mb-3" />
      <p class="text-sm text-gray-400">กำลังโหลดหนังสือ...</p>
    </div>

    <template v-else-if="bookData">

      <!-- ── Top Bar ── -->
      <header class="reader-topbar">
        <!-- Left: back + title -->
        <div class="topbar-left">
          <NuxtLink to="/library" class="topbar-back-btn">
            <UIcon name="i-lucide-chevron-left" class="w-4 h-4" />
            <span class="hidden sm:inline">คลังหนังสือ</span>
          </NuxtLink>
          <div class="topbar-divider" />
          <div class="topbar-book-info">
            <p class="topbar-title">{{ bookData.title }}</p>
            <p class="topbar-author">{{ bookData.author }}</p>
          </div>
        </div>

        <!-- Center: progress -->
        <div class="topbar-progress hidden md:flex">
          <span class="topbar-progress-label">{{ currentPage }} / {{ totalPages }}</span>
          <div class="topbar-progress-track">
            <div class="topbar-progress-fill" :style="{ width: progressPercent + '%' }" />
          </div>
          <span class="topbar-progress-pct">{{ progressPercent }}%</span>
        </div>

        <!-- Right: actions -->
        <div class="topbar-right">
          <UBadge v-if="accessData?.type === 'rental'" color="warning" variant="subtle" size="xs">เช่า</UBadge>

          <!-- Zoom controls -->
          <div class="zoom-controls">
            <button class="topbar-icon-btn" :disabled="scale <= ZOOM_MIN" title="ย่อ" @click="zoomOut">
              <UIcon name="i-lucide-zoom-out" class="w-4 h-4" />
            </button>
            <button class="zoom-pct-btn" title="รีเซ็ต zoom" @click="zoomReset">
              {{ zoomPercent }}
            </button>
            <button class="topbar-icon-btn" :disabled="scale >= ZOOM_MAX" title="ขยาย" @click="zoomIn">
              <UIcon name="i-lucide-zoom-in" class="w-4 h-4" />
            </button>
          </div>

          <UColorModeButton size="sm" />
          <button class="topbar-icon-btn" @click="showSidebar = !showSidebar">
            <UIcon name="i-lucide-panel-left" class="w-4 h-4" />
          </button>
        </div>
      </header>

      <!-- ── Main ── -->
      <div class="reader-main">

        <!-- Mobile backdrop -->
        <Transition name="fade">
          <div v-if="showSidebar" class="reader-backdrop" @click="showSidebar = false" />
        </Transition>

        <!-- Sidebar -->
        <Transition name="sidebar">
          <aside v-if="showSidebar" class="reader-sidebar">
            <!-- Back to library -->
            <NuxtLink to="/library" class="sidebar-library-btn">
              <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
              <span>กลับไปคลังหนังสือ</span>
            </NuxtLink>

            <div class="sidebar-body">
              <!-- Book cover thumbnail -->
              <div v-if="bookData.coverImage" class="sidebar-cover">
                <img :src="bookData.coverImage" :alt="bookData.title" class="sidebar-cover-img" />
              </div>

              <!-- Section: navigation -->
              <p class="sidebar-section-label">นำทาง</p>

              <div class="sidebar-page-jump">
                <span class="sidebar-page-label">ไปหน้า</span>
                <input
                  type="number"
                  :min="1"
                  :max="totalPages"
                  :value="currentPage"
                  class="sidebar-page-input"
                  @change="goToPage(+($event.target as HTMLInputElement).value)"
                />
                <span class="sidebar-page-total">/ {{ totalPages }}</span>
              </div>

              <!-- Progress bar -->
              <div class="sidebar-progress">
                <div class="sidebar-progress-header">
                  <span>ความคืบหน้า</span>
                  <span class="font-medium text-indigo-500">{{ progressPercent }}%</span>
                </div>
                <div class="sidebar-progress-track">
                  <div class="sidebar-progress-fill" :style="{ width: progressPercent + '%' }" />
                </div>
              </div>

              <!-- Access info -->
              <div class="sidebar-access">
                <div class="sidebar-access-row">
                  <UIcon name="i-lucide-shield-check" class="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>{{ accessData?.type === 'rental' ? 'สิทธิ์เช่า' : 'สิทธิ์ซื้อ' }}</span>
                </div>
                <div v-if="accessData?.rentalExpireAt" class="sidebar-access-row">
                  <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                  <span>หมดอายุ {{ new Date(accessData.rentalExpireAt).toLocaleDateString('th-TH') }}</span>
                </div>
              </div>
            </div>
          </aside>
        </Transition>

        <!-- Content -->
        <div class="reader-content">

          <!-- Blur overlay -->
          <div v-if="!isFocused" class="reader-blur-overlay" @click="isFocused = true">
            <UIcon name="i-lucide-eye-off" class="w-10 h-10 mb-3 opacity-70" />
            <p class="font-semibold">คลิกเพื่อกลับมาอ่าน</p>
            <p class="text-sm opacity-60 mt-1">เนื้อหาถูกซ่อนเพื่อความปลอดภัย</p>
          </div>

          <!-- PDF area -->
          <div class="reader-canvas-area" :class="{ 'reader-blurred': !isFocused }">

            <!-- Watermark -->
            <div class="reader-watermark" aria-hidden="true">
              <span v-for="i in 12" :key="i" class="reader-watermark-text">{{ watermarkText }}</span>
            </div>

            <!-- Spinner while loading -->
            <div v-if="pdfLoading" class="reader-spinner">
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-indigo-400" />
            </div>

            <!-- PDF page (paper effect) -->
            <div v-if="pdfDoc" class="reader-paper" :class="{ 'opacity-0': pdfLoading }">
              <VuePDF :pdf="pdfDoc" :page="currentPage" :scale="scale" class="reader-pdf" />
            </div>
          </div>

          <!-- Bottom nav bar -->
          <nav class="reader-nav">
            <button class="reader-nav-btn" :disabled="currentPage <= 1" @click="prevPage">
              <UIcon name="i-lucide-chevron-left" class="w-5 h-5" />
              <span>ก่อนหน้า</span>
            </button>

            <div class="reader-nav-center">
              <span class="reader-nav-page">{{ currentPage }}</span>
              <span class="reader-nav-sep">/</span>
              <span class="reader-nav-total">{{ totalPages }} หน้า</span>
            </div>

            <button class="reader-nav-btn" :disabled="currentPage >= totalPages" @click="nextPage">
              <span>ถัดไป</span>
              <UIcon name="i-lucide-chevron-right" class="w-5 h-5" />
            </button>
          </nav>

        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ── Root ── */
.reader-root {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
  user-select: none;
  -webkit-user-select: none;
}
:root.dark .reader-root { background: #0a0f1e; }

/* ── Loading ── */
.reader-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* ── Top Bar ── */
.reader-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  height: 52px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  z-index: 40;
  gap: 1rem;
}
:root.dark .reader-topbar { background: #0f172a; border-bottom-color: #1e293b; }

.topbar-left { display: flex; align-items: center; gap: 0.75rem; min-width: 0; flex: 1; }

.topbar-back-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #64748b;
  text-decoration: none;
  padding: 0.375rem 0.625rem;
  border-radius: 0.5rem;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
  white-space: nowrap;
}
.topbar-back-btn:hover { background: #f1f5f9; color: #4338ca; }
:root.dark .topbar-back-btn { color: #94a3b8; }
:root.dark .topbar-back-btn:hover { background: #1e293b; color: #818cf8; }

.topbar-divider { width: 1px; height: 20px; background: #e2e8f0; flex-shrink: 0; }
:root.dark .topbar-divider { background: #1e293b; }

.topbar-book-info { min-width: 0; }
.topbar-title { font-size: 0.875rem; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px; }
.topbar-author { font-size: 0.75rem; color: #94a3b8; }
:root.dark .topbar-title { color: #f1f5f9; }

.topbar-progress { align-items: center; gap: 0.75rem; flex-shrink: 0; }
.topbar-progress-label { font-size: 0.75rem; color: #94a3b8; white-space: nowrap; }
.topbar-progress-track { width: 120px; height: 4px; background: #e2e8f0; border-radius: 9999px; overflow: hidden; }
:root.dark .topbar-progress-track { background: #1e293b; }
.topbar-progress-fill { height: 100%; background: linear-gradient(90deg, #4338ca, #6366f1); border-radius: 9999px; transition: width 0.4s ease; }
.topbar-progress-pct { font-size: 0.75rem; color: #6366f1; font-weight: 600; min-width: 2.5rem; text-align: right; }

.topbar-right { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

.zoom-controls { display: flex; align-items: center; gap: 0.125rem; }
.zoom-pct-btn {
  font-size: 0.75rem; font-weight: 600; min-width: 3rem; text-align: center;
  padding: 0.25rem 0.375rem; border-radius: 0.375rem;
  border: none; background: none; cursor: pointer;
  color: #6366f1;
  transition: background 0.15s;
}
.zoom-pct-btn:hover { background: #f1f5f9; }
:root.dark .zoom-pct-btn { color: #818cf8; }
:root.dark .zoom-pct-btn:hover { background: #1e293b; }
.topbar-icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }

@media (max-width: 480px) { .zoom-controls { display: none; } }

.topbar-icon-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: none; background: none; cursor: pointer;
  color: #64748b; border-radius: 0.375rem;
  transition: background 0.15s, color 0.15s;
}
.topbar-icon-btn:hover { background: #f1f5f9; color: #4338ca; }
:root.dark .topbar-icon-btn { color: #94a3b8; }
:root.dark .topbar-icon-btn:hover { background: #1e293b; color: #818cf8; }

/* ── Main Layout ── */
.reader-main { display: flex; flex: 1; overflow: hidden; position: relative; }

/* ── Mobile backdrop ── */
.reader-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 29;
  background: rgba(0,0,0,0.45);
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 767px) {
  .reader-backdrop { display: block; }
}

/* ── Sidebar ── */
.reader-sidebar {
  width: 260px;
  flex-shrink: 0;
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
:root.dark .reader-sidebar { background: #0f172a; border-right-color: #1e293b; }

/* Desktop: slide width */
.sidebar-enter-active, .sidebar-leave-active { transition: width 0.22s ease, opacity 0.22s ease; }
.sidebar-enter-from, .sidebar-leave-to { width: 0; opacity: 0; }

/* Mobile: slide from left as overlay */
@media (max-width: 767px) {
  .reader-sidebar {
    position: fixed;
    left: 0;
    top: 52px;
    bottom: 56px;
    z-index: 30;
    width: 260px;
    box-shadow: 4px 0 20px rgba(0,0,0,0.18);
  }
  .sidebar-enter-active, .sidebar-leave-active { transition: transform 0.22s ease, opacity 0.22s ease; }
  .sidebar-enter-from, .sidebar-leave-to { width: 260px; transform: translateX(-100%); opacity: 0; }
}

.sidebar-library-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #4338ca;
  text-decoration: none;
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.15s;
}
.sidebar-library-btn:hover { background: #eef2ff; }
:root.dark .sidebar-library-btn { color: #818cf8; border-bottom-color: #1e293b; }
:root.dark .sidebar-library-btn:hover { background: #1e293b; }

.sidebar-body { padding: 1rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 1.25rem; }

.sidebar-cover { display: flex; justify-content: center; }
.sidebar-cover-img { width: 90px; height: auto; border-radius: 0.375rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }

.sidebar-section-label { font-size: 0.625rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #94a3b8; }

.sidebar-page-jump { display: flex; align-items: center; gap: 0.5rem; }
.sidebar-page-label { font-size: 0.8125rem; color: #64748b; }
.sidebar-page-input {
  width: 52px; text-align: center;
  font-size: 0.8125rem;
  border: 1px solid #e2e8f0; border-radius: 0.375rem;
  padding: 0.3rem 0.5rem;
  background: transparent; color: inherit; outline: none;
  transition: border-color 0.2s;
}
.sidebar-page-input:focus { border-color: #6366f1; }
:root.dark .sidebar-page-input { border-color: #1e293b; }
.sidebar-page-total { font-size: 0.8125rem; color: #94a3b8; }

.sidebar-progress { display: flex; flex-direction: column; gap: 0.5rem; }
.sidebar-progress-header { display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; }
.sidebar-progress-track { height: 6px; background: #f1f5f9; border-radius: 9999px; overflow: hidden; }
:root.dark .sidebar-progress-track { background: #1e293b; }
.sidebar-progress-fill { height: 100%; background: linear-gradient(90deg, #4338ca, #6366f1); border-radius: 9999px; transition: width 0.4s ease; }

.sidebar-access { display: flex; flex-direction: column; gap: 0.625rem; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; }
:root.dark .sidebar-access { border-top-color: #1e293b; }
.sidebar-access-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #94a3b8; }

/* ── Content ── */
.reader-content { flex: 1; display: flex; flex-direction: column; position: relative; overflow: hidden; }

/* ── Blur overlay ── */
.reader-blur-overlay {
  position: absolute; inset: 0; z-index: 50;
  background: rgba(0,0,0,0.88);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: white; cursor: pointer;
}

/* ── Canvas area ── */
.reader-canvas-area {
  flex: 1;
  position: relative;
  overflow: auto;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 2rem 1rem;
  transition: filter 0.3s ease;
}
.reader-blurred { filter: blur(24px); pointer-events: none; }

/* ── Watermark ── */
.reader-watermark {
  position: fixed;
  inset: 52px 0 56px 0;
  z-index: 10;
  pointer-events: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
  overflow: hidden;
}
@media (max-width: 767px) {
  .reader-watermark {
    inset: 52px 0 60px 0;
    grid-template-columns: repeat(2, 1fr);
  }
}
.reader-watermark-text {
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; color: rgba(99,102,241,0.09);
  transform: rotate(-25deg);
  white-space: nowrap; letter-spacing: 0.04em; font-weight: 600;
}
:root.dark .reader-watermark-text { color: rgba(165,180,252,0.07); }

/* ── Spinner ── */
.reader-spinner {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 5;
}

/* ── Paper (PDF container) ── */
.reader-paper {
  border-radius: 2px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 40px -8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
  transition: opacity 0.3s ease;
  flex-shrink: 0;
  margin: 0 auto;
}

.reader-pdf { display: block; }
.reader-pdf canvas { display: block; }

@media (max-width: 767px) {
  .reader-paper { box-shadow: 0 2px 12px rgba(0,0,0,0.12); }
  .reader-canvas-area { padding: 1rem 0.75rem; }
}

/* ── Nav bar ── */
.reader-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 56px;
  background: white;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}
:root.dark .reader-nav { background: #0f172a; border-top-color: #1e293b; }

.reader-nav-btn {
  display: flex; align-items: center; gap: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem; font-weight: 500;
  border: 1px solid #e2e8f0; border-radius: 0.5rem;
  background: transparent; cursor: pointer; color: #374151;
  transition: all 0.15s ease;
  min-height: 44px;
}
.reader-nav-btn:hover:not(:disabled) { background: #f8faff; border-color: #c7d2fe; color: #4338ca; }
.reader-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
:root.dark .reader-nav-btn { border-color: #1e293b; color: #94a3b8; }
:root.dark .reader-nav-btn:hover:not(:disabled) { background: #1e293b; border-color: #4338ca; color: #818cf8; }

@media (max-width: 767px) {
  .reader-nav { padding: 0 1rem; height: 60px; }
  .reader-nav-btn { padding: 0.5rem 1.25rem; }
  .reader-nav-btn span { display: none; }
}

.reader-nav-center { display: flex; align-items: baseline; gap: 0.375rem; }
.reader-nav-page { font-size: 1.125rem; font-weight: 700; color: #0f172a; }
:root.dark .reader-nav-page { color: #f1f5f9; }
.reader-nav-sep { color: #94a3b8; font-size: 0.875rem; }
.reader-nav-total { font-size: 0.8125rem; color: #94a3b8; }
</style>