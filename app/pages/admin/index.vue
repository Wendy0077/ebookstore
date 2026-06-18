<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const toast = useToast()

useSeoMeta({ title: 'Admin — BookVerse' })

// ===== State =====
const books = ref<any[]>([])
const loadingBooks = ref(false)

const searchQuery = ref('')
const showModal = ref(false)
const editingBook = ref<any>(null)
const saving = ref(false)
const deletingId = ref<string | null>(null)
const showDeleteConfirm = ref(false)
const deleteTarget = ref<any>(null)
const coverFile = ref<File | null>(null)
const uploadingCover = ref(false)
const pdfFile = ref<File | null>(null)
const uploadingPdf = ref(false)
const pdfFileName = ref('')

// ===== Form =====
const defaultForm = () => ({
  title: '',
  author: '',
  description: '',
  isbn: '',
  price: 0,
  rentalPrice: 0,
  rentalDurationDays: 30,
  category: '',
  tags: '',
  coverImage: '',
  fileKey: '',
  pageCount: 0,
  language: 'th',
  publisher: '',
  publishedYear: new Date().getFullYear(),
  isActive: true,
  isFeatured: false,
  isRentable: true
})

const form = ref(defaultForm())

// ===== Computed =====
const filteredBooks = computed(() => {
  if (!searchQuery.value) return books.value
  const q = searchQuery.value.toLowerCase()
  return books.value.filter(b =>
    b.title?.toLowerCase().includes(q) ||
    b.author?.toLowerCase().includes(q) ||
    b.category?.toLowerCase().includes(q)
  )
})

const isEditing = computed(() => !!editingBook.value)

// ===== API =====
const fetchBooks = async () => {
  loadingBooks.value = true
  try {
    const data = await $fetch<any>('/api/books', { params: { limit: 100 } })
    books.value = data.books || []
  } catch (err: any) {
    toast.add({ title: 'โหลดหนังสือไม่สำเร็จ', color: 'error' })
  } finally {
    loadingBooks.value = false
  }
}

const coverPreview = computed(() => {
  if (coverFile.value) return URL.createObjectURL(coverFile.value)
  if (form.value.coverImage) return form.value.coverImage
  return ''
})

const handleCoverSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.add({ title: 'รองรับเฉพาะไฟล์ภาพ (JPEG, PNG, WebP, GIF)', color: 'warning' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.add({ title: 'ขนาดไฟล์ต้องไม่เกิน 5MB', color: 'warning' })
      return
    }
    coverFile.value = file
  }
}

const handleCoverDrop = (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    const file = e.dataTransfer.files[0]
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.add({ title: 'รองรับเฉพาะไฟล์ภาพ (JPEG, PNG, WebP, GIF)', color: 'warning' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.add({ title: 'ขนาดไฟล์ต้องไม่เกิน 5MB', color: 'warning' })
      return
    }
    coverFile.value = file
  }
}

const removeCover = () => {
  coverFile.value = null
  form.value.coverImage = ''
}

const handlePdfSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (file.type !== 'application/pdf') {
      toast.add({ title: 'รองรับเฉพาะไฟล์ PDF เท่านั้น', color: 'warning' })
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.add({ title: 'ขนาดไฟล์ต้องไม่เกิน 50MB', color: 'warning' })
      return
    }
    pdfFile.value = file
    pdfFileName.value = file.name
  }
}

const handlePdfDrop = (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    const file = e.dataTransfer.files[0]
    if (file.type !== 'application/pdf') {
      toast.add({ title: 'รองรับเฉพาะไฟล์ PDF เท่านั้น', color: 'warning' })
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.add({ title: 'ขนาดไฟล์ต้องไม่เกิน 50MB', color: 'warning' })
      return
    }
    pdfFile.value = file
    pdfFileName.value = file.name
  }
}

const removePdf = () => {
  pdfFile.value = null
  pdfFileName.value = ''
  form.value.fileKey = ''
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const saveBook = async () => {
  if (!form.value.title || !form.value.author || !form.value.category || form.value.price === undefined) {
    toast.add({ title: 'กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, ผู้เขียน, หมวดหมู่, ราคา)', color: 'warning' })
    return
  }

  saving.value = true
  try {
    // Upload cover image if a new file is selected
    if (coverFile.value) {
      uploadingCover.value = true
      const coverFormData = new FormData()
      coverFormData.append('cover', coverFile.value)
      const uploadResult = await $fetch<{ url: string }>('/api/upload/cover', {
        method: 'post',
        body: coverFormData
      })
      form.value.coverImage = uploadResult.url
      uploadingCover.value = false
    }

    // Upload PDF file if a new file is selected
    if (pdfFile.value) {
      uploadingPdf.value = true
      const pdfFormData = new FormData()
      pdfFormData.append('pdf', pdfFile.value)
      const pdfResult = await $fetch<{ url: string; pageCount: number }>('/api/upload/pdf', {
        method: 'post',
        body: pdfFormData
      })
      form.value.fileKey = pdfResult.url
      if (pdfResult.pageCount > 0) form.value.pageCount = pdfResult.pageCount
      uploadingPdf.value = false
    }

    const body = {
      ...form.value,
      tags: form.value.tags ? form.value.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
    }

    if (isEditing.value) {
      await $fetch(`/api/books/${editingBook.value._id}`, { method: 'put' as any, body })
      toast.add({ title: 'แก้ไขหนังสือเรียบร้อย', icon: 'i-lucide-check-circle', color: 'success' })
    } else {
      await $fetch('/api/books', { method: 'post' as any, body })
      toast.add({ title: 'เพิ่มหนังสือเรียบร้อย', icon: 'i-lucide-check-circle', color: 'success' })
    }

    showModal.value = false
    coverFile.value = null
    pdfFile.value = null
    pdfFileName.value = ''
    await fetchBooks()
  } catch (err: any) {
    toast.add({ title: err.data?.message || 'เกิดข้อผิดพลาด', color: 'error' })
  } finally {
    saving.value = false
    uploadingCover.value = false
    uploadingPdf.value = false
  }
}

const deleteBook = async () => {
  if (!deleteTarget.value) return
  deletingId.value = deleteTarget.value._id
  try {
    await $fetch(`/api/books/${deleteTarget.value._id}`, { method: 'delete' as any })
    toast.add({ title: `ลบ "${deleteTarget.value.title}" เรียบร้อย`, icon: 'i-lucide-trash-2', color: 'success' })
    showDeleteConfirm.value = false
    deleteTarget.value = null
    await fetchBooks()
  } catch (err: any) {
    toast.add({ title: err.data?.message || 'ลบไม่สำเร็จ', color: 'error' })
  } finally {
    deletingId.value = null
  }
}



// ===== Actions =====
const openAddModal = () => {
  ; (document.activeElement as HTMLElement | null)?.blur?.()
  editingBook.value = null
  form.value = defaultForm()
  coverFile.value = null
  pdfFile.value = null
  pdfFileName.value = ''
  showModal.value = true
}

const openEditModal = (book: any) => {
  ; (document.activeElement as HTMLElement | null)?.blur?.()
  editingBook.value = book
  coverFile.value = null
  pdfFile.value = null
  pdfFileName.value = book.fileKey ? book.fileKey.split('/').pop() || '' : ''
  form.value = {
    title: book.title || '',
    author: book.author || '',
    description: book.description || '',
    isbn: book.isbn || '',
    price: book.price || 0,
    rentalPrice: book.rentalPrice || 0,
    rentalDurationDays: book.rentalDurationDays || 30,
    category: book.category || '',
    tags: (book.tags || []).join(', '),
    coverImage: book.coverImage || '',
    fileKey: book.fileKey || '',
    pageCount: book.pageCount || 0,
    language: book.language || 'th',
    publisher: book.publisher || '',
    publishedYear: book.publishedYear || new Date().getFullYear(),
    isActive: book.isActive !== false,
    isFeatured: book.isFeatured || false,
    isRentable: book.isRentable !== false
  }
  showModal.value = true
}

const confirmDelete = (book: any) => {
  ; (document.activeElement as HTMLElement | null)?.blur?.()
  deleteTarget.value = book
  showDeleteConfirm.value = true
}

onMounted(fetchBooks)
</script>

<template>
  <div class="max-w-[96rem] mx-auto px-4 py-8">
    <AdminNav />

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold flex items-center gap-2">
          <UIcon name="i-lucide-book-open" class="w-8 h-8 text-indigo-500" />
          จัดการหนังสือ
        </h1>
        <p class="text-gray-500 text-sm mt-1">เพิ่ม แก้ไข และลบหนังสือในระบบ</p>
      </div>
      <div class="flex items-center gap-3">
        <UButton label="เพิ่มหนังสือ" icon="i-lucide-plus" color="primary" size="sm" @click="openAddModal" />
      </div>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <UInput v-model="searchQuery" placeholder="ค้นหาตามชื่อ, ผู้เขียน, หมวดหมู่..." icon="i-lucide-search" size="lg"
        class="max-w-md" />
    </div>

    <!-- Loading -->
    <div v-if="loadingBooks" class="flex justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-indigo-500" />
    </div>

    <!-- Books Table -->
    <div v-else
      class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
              <th class="text-left px-4 py-3 font-semibold">#</th>
              <th class="text-left px-4 py-3 font-semibold">หนังสือ</th>
              <th class="text-left px-4 py-3 font-semibold">หมวดหมู่</th>
              <th class="text-right px-4 py-3 font-semibold">ราคาซื้อ</th>
              <th class="text-right px-4 py-3 font-semibold">ราคาเช่า</th>
              <th class="text-center px-4 py-3 font-semibold">สถานะ</th>
              <th class="text-center px-4 py-3 font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(book, idx) in filteredBooks" :key="book._id"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td class="px-4 py-3 text-gray-400">{{ idx + 1 }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-14 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img v-if="book.coverImage" :src="book.coverImage" :alt="book.title"
                      class="w-full h-full object-cover" />
                    <UIcon v-else name="i-lucide-book-open" class="w-5 h-5 text-indigo-400" />
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold truncate max-w-[200px]">{{ book.title }}</p>
                    <p class="text-xs text-gray-500 truncate">{{ book.author }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <UBadge color="primary" variant="subtle" size="xs">{{ book.category }}</UBadge>
              </td>
              <td class="px-4 py-3 text-right font-medium">฿{{ book.price }}</td>
              <td class="px-4 py-3 text-right text-gray-500">
                <span v-if="book.isRentable">฿{{ book.rentalPrice }}</span>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <UBadge v-if="book.isActive" color="success" variant="subtle" size="xs">Active</UBadge>
                  <UBadge v-else color="neutral" variant="subtle" size="xs">Hidden</UBadge>
                  <UBadge v-if="book.isFeatured" color="warning" variant="subtle" size="xs">
                    <UIcon name="i-lucide-star" class="w-3 h-3" />
                  </UBadge>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <UButton icon="i-lucide-pencil" variant="ghost" color="primary" size="xs"
                    @click="openEditModal(book)" />
                  <UButton icon="i-lucide-trash-2" variant="ghost" color="error" size="xs"
                    :loading="deletingId === book._id" @click="confirmDelete(book)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredBooks.length === 0" class="text-center py-12 text-gray-400">
        <UIcon name="i-lucide-book-x" class="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>ไม่พบหนังสือ</p>
      </div>

      <div class="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
        ทั้งหมด {{ filteredBooks.length }} เล่ม
      </div>
    </div>

    <!-- ===== Add/Edit Modal ===== -->
    <UModal v-model:open="showModal" :title="isEditing ? 'แก้ไขหนังสือ' : 'เพิ่มหนังสือ'"
      description="ฟอร์มสำหรับเพิ่มหรือแก้ไขข้อมูลหนังสือ">
      <template #content>
        <div class="p-6 max-h-[85vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold flex items-center gap-2">
              <UIcon :name="isEditing ? 'i-lucide-pencil' : 'i-lucide-plus-circle'" class="w-5 h-5 text-indigo-500" />
              {{ isEditing ? 'แก้ไขหนังสือ' : 'เพิ่มหนังสือ' }}
            </h2>
            <UButton icon="i-lucide-x" variant="ghost" color="neutral" size="xs" @click="showModal = false" />
          </div>

          <form @submit.prevent="saveBook" class="space-y-4">
            <!-- Basic Info -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="ชื่อหนังสือ *">
                <UInput v-model="form.title" placeholder="ชื่อหนังสือ" icon="i-lucide-book-open" />
              </UFormField>
              <UFormField label="ผู้เขียน *">
                <UInput v-model="form.author" placeholder="ชื่อผู้เขียน" icon="i-lucide-user" />
              </UFormField>
            </div>

            <UFormField label="คำอธิบาย">
              <UTextarea v-model="form.description" placeholder="รายละเอียดหนังสือ..." :rows="3" />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <UFormField label="หมวดหมู่ *">
                <UInput v-model="form.category" placeholder="เช่น พัฒนาตนเอง" icon="i-lucide-tag" />
              </UFormField>
              <UFormField label="ISBN">
                <UInput v-model="form.isbn" placeholder="978-xxx" />
              </UFormField>
              <UFormField label="ภาษา">
                <UInput v-model="form.language" placeholder="th" />
              </UFormField>
            </div>

            <!-- Pricing -->
            <div class="border-t border-gray-200 dark:border-gray-800 pt-4">
              <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                <UIcon name="i-lucide-banknote" class="w-4 h-4 inline" /> ราคา
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <UFormField label="ราคาซื้อ (฿) *">
                  <UInput v-model.number="form.price" type="number" placeholder="0" />
                </UFormField>
                <UFormField label="ราคาเช่า (฿)">
                  <UInput v-model.number="form.rentalPrice" type="number" placeholder="0" />
                </UFormField>
                <UFormField label="ระยะเวลาเช่า (วัน)">
                  <UInput v-model.number="form.rentalDurationDays" type="number" placeholder="30" />
                </UFormField>
              </div>
            </div>

            <!-- Details -->
            <div class="border-t border-gray-200 dark:border-gray-800 pt-4">
              <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                <UIcon name="i-lucide-info" class="w-4 h-4 inline" /> รายละเอียด
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <UFormField label="สำนักพิมพ์">
                  <UInput v-model="form.publisher" placeholder="ชื่อสำนักพิมพ์" />
                </UFormField>
                <UFormField label="ปีที่พิมพ์">
                  <UInput v-model.number="form.publishedYear" type="number" placeholder="2024" />
                </UFormField>
                <UFormField label="จำนวนหน้า">
                  <UInput v-model.number="form.pageCount" type="number" placeholder="0" />
                </UFormField>
              </div>
            </div>

            <!-- PDF Upload -->
            <div class="border-t border-gray-200 dark:border-gray-800 pt-4">
              <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                <UIcon name="i-lucide-file-text" class="w-4 h-4 inline" /> ไฟล์ PDF หนังสือ
              </p>
              <UFormField label="ไฟล์ PDF">
                <div class="relative border-2 border-dashed rounded-xl transition-colors cursor-pointer"
                  :class="(pdfFile || form.fileKey)
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-gray-300 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 bg-gray-50 dark:bg-gray-900'" @click="($refs.pdfInput as HTMLInputElement)?.click()"
                  @dragover.prevent @drop="handlePdfDrop">
                  <!-- Has File -->
                  <div v-if="pdfFile || form.fileKey" class="flex items-center gap-3 p-4">
                    <div
                      class="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center flex-shrink-0">
                      <UIcon name="i-lucide-file-text" class="w-6 h-6 text-red-500" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium truncate text-gray-800 dark:text-gray-200">
                        {{ pdfFile?.name || pdfFileName || 'ไฟล์ PDF' }}
                      </p>
                      <p class="text-xs text-gray-400 mt-0.5">
                        <template v-if="pdfFile">{{ formatFileSize(pdfFile.size) }} — พร้อมอัปโหลด</template>
                        <template v-else>อัปโหลดแล้ว</template>
                      </p>
                    </div>
                    <button type="button"
                      class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900 text-red-500 flex items-center justify-center transition-colors flex-shrink-0"
                      @click.stop="removePdf">
                      <UIcon name="i-lucide-x" class="w-4 h-4" />
                    </button>
                  </div>

                  <!-- Empty State -->
                  <div v-else class="flex flex-col items-center justify-center py-6 px-4">
                    <div
                      class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-3">
                      <UIcon name="i-lucide-upload" class="w-6 h-6 text-emerald-500" />
                    </div>
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">คลิกเพื่ออัปโหลดไฟล์ PDF</p>
                    <p class="text-xs text-gray-400 mt-1">หรือลากไฟล์มาวาง</p>
                    <p class="text-xs text-gray-400 mt-0.5">สูงสุด 50MB</p>
                  </div>

                  <!-- Loading overlay -->
                  <div v-if="uploadingPdf"
                    class="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center rounded-xl">
                    <div class="flex items-center gap-2">
                      <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-emerald-500" />
                      <span class="text-sm text-emerald-600 dark:text-emerald-400">กำลังอัปโหลด...</span>
                    </div>
                  </div>
                </div>
                <input ref="pdfInput" type="file" accept="application/pdf" class="hidden" @change="handlePdfSelect" />
              </UFormField>
            </div>

            <!-- Media -->
            <div class="border-t border-gray-200 dark:border-gray-800 pt-4">
              <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                <UIcon name="i-lucide-image" class="w-4 h-4 inline" /> ปกหนังสือ & แท็ก
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Cover Image Upload -->
                <UFormField label="ปกหนังสือ">
                  <div class="relative border-2 border-dashed rounded-xl transition-colors cursor-pointer"
                    :class="coverPreview
                      ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-gray-50 dark:bg-gray-900'" @click="($refs.coverInput as HTMLInputElement)?.click()"
                    @dragover.prevent @drop="handleCoverDrop">
                    <!-- Preview -->
                    <div v-if="coverPreview" class="p-3">
                      <div class="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img :src="coverPreview" alt="ตัวอย่างปก" class="w-full h-full object-cover" />
                        <button type="button"
                          class="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg"
                          @click.stop="removeCover">
                          <UIcon name="i-lucide-x" class="w-4 h-4" />
                        </button>
                      </div>
                      <p class="text-xs text-gray-500 mt-2 text-center truncate">
                        {{ coverFile?.name || form.coverImage }}
                      </p>
                    </div>

                    <!-- Empty State -->
                    <div v-else class="flex flex-col items-center justify-center py-8 px-4">
                      <div
                        class="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mb-3">
                        <UIcon name="i-lucide-upload" class="w-6 h-6 text-indigo-500" />
                      </div>
                      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">คลิกเพื่ออัปโหลด</p>
                      <p class="text-xs text-gray-400 mt-1">หรือลากไฟล์มาวาง</p>
                      <p class="text-xs text-gray-400 mt-0.5">JPEG, PNG, WebP, GIF (สูงสุด 5MB)</p>
                    </div>

                    <!-- Loading overlay -->
                    <div v-if="uploadingCover"
                      class="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center rounded-xl">
                      <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                  </div>
                  <input ref="coverInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden"
                    @change="handleCoverSelect" />
                </UFormField>
                <UFormField label="Tags (คั่นด้วย ,)">
                  <UInput v-model="form.tags" placeholder="แฟนตาซี, ผจญภัย" icon="i-lucide-tags" />
                </UFormField>
              </div>
            </div>

            <!-- Toggles -->
            <div class="border-t border-gray-200 dark:border-gray-800 pt-4">
              <div class="flex flex-wrap gap-6">
                <label class="flex items-center gap-2 cursor-pointer">
                  <USwitch v-model="form.isActive" />
                  <span class="text-sm">เผยแพร่ (Active)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <USwitch v-model="form.isFeatured" />
                  <span class="text-sm">แนะนำ (Featured)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <USwitch v-model="form.isRentable" />
                  <span class="text-sm">เช่าได้ (Rentable)</span>
                </label>
              </div>
            </div>

            <!-- Submit -->
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <UButton label="ยกเลิก" variant="ghost" color="neutral" @click="showModal = false" />
              <UButton type="submit" :label="isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มหนังสือ'"
                :icon="isEditing ? 'i-lucide-check' : 'i-lucide-plus'" color="primary" :loading="saving" />
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- ===== Delete Confirmation Modal ===== -->
    <UModal v-model:open="showDeleteConfirm" title="ยืนยันการลบ"
      description="ยืนยันการลบหนังสือที่เลือก (การลบไม่สามารถย้อนกลับได้)">
      <template #content>
        <div class="p-6">
          <div class="text-center">
            <div
              class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-lucide-alert-triangle" class="w-7 h-7 text-red-500" />
            </div>
            <h3 class="text-lg font-bold mb-2">ยืนยันการลบ</h3>
            <p class="text-gray-500 text-sm mb-6">
              คุณต้องการลบ <strong class="text-gray-900 dark:text-white">"{{ deleteTarget?.title }}"</strong>
              หรือไม่?<br>
              การลบจะไม่สามารถย้อนกลับได้
            </p>
            <div class="flex justify-center gap-3">
              <UButton label="ยกเลิก" variant="ghost" color="neutral" @click="showDeleteConfirm = false" />
              <UButton label="ลบหนังสือ" icon="i-lucide-trash-2" color="error" :loading="!!deletingId"
                @click="deleteBook" />
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
