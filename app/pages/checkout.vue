<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { cart, fetchCart, total, itemCount, clearCart } = useCart()
const toast = useToast()

useSeoMeta({ title: 'ชำระเงิน — BookVerse' })

const coverErrorMap = ref<Record<string, boolean>>({})
const hasCover = (book: any) => !!book?.coverImage && !coverErrorMap.value[book._id]
const onCoverError = (bookId: string) => {
    coverErrorMap.value[bookId] = true
}

// Form state
const cardName = ref('')
const cardNumber = ref('')
const expiry = ref('')
const cvv = ref('')
const processing = ref(false)
const step = ref<'form' | 'processing' | 'success'>('form')
const completedOrder = ref<any>(null)

// Card number formatting (add spaces every 4 digits)
const formatCardNumber = (e: Event) => {
    const input = e.target as HTMLInputElement
    let val = input.value.replace(/\D/g, '').slice(0, 16)
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ')
    cardNumber.value = val
}

// Expiry formatting (MM/YY)
const formatExpiry = (e: Event) => {
    const input = e.target as HTMLInputElement
    let val = input.value.replace(/\D/g, '').slice(0, 4)
    if (val.length >= 3) {
        val = val.slice(0, 2) + '/' + val.slice(2)
    }
    expiry.value = val
}

// CVV
const formatCvv = (e: Event) => {
    const input = e.target as HTMLInputElement
    cvv.value = input.value.replace(/\D/g, '').slice(0, 3)
}

const cardBrand = computed(() => {
    const num = cardNumber.value.replace(/\s/g, '')
    if (num.startsWith('4')) return 'visa'
    if (num.startsWith('5') || num.startsWith('2')) return 'mastercard'
    if (num.startsWith('3')) return 'amex'
    return 'generic'
})

const isFormValid = computed(() => {
    return cardName.value.trim().length > 0 &&
        cardNumber.value.replace(/\s/g, '').length >= 15 &&
        expiry.value.length === 5 &&
        cvv.value.length === 3
})

const handleCheckout = async () => {
    if (!isFormValid.value) {
        toast.add({ title: 'กรุณากรอกข้อมูลบัตรให้ครบถ้วน', color: 'warning' })
        return
    }

    step.value = 'processing'
    processing.value = true

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2500))

    try {
        const data = await $fetch<any>('/api/checkout', {
            method: 'POST',
            body: {
                cardName: cardName.value,
                cardNumber: cardNumber.value.replace(/\s/g, ''),
                expiry: expiry.value,
                cvv: cvv.value
            }
        })

        completedOrder.value = data.order
        step.value = 'success'
        clearCart()
        toast.add({ title: 'ชำระเงินเรียบร้อย!', icon: 'i-lucide-check-circle', color: 'success' })
    } catch (err: any) {
        step.value = 'form'
        toast.add({ title: err.data?.message || 'เกิดข้อผิดพลาด', color: 'error' })
    } finally {
        processing.value = false
    }
}

onMounted(async () => {
    await fetchCart()
    if (!cart.value?.items?.length) {
        navigateTo('/cart')
    }
})
</script>

<template>
    <div class="min-h-[80vh] flex items-start justify-center py-8 px-4">
        <div class="w-full max-w-5xl">

            <!-- Header -->
            <div class="mb-8 animate-fade-in-up">
                <NuxtLink to="/cart"
                    class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4">
                    <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
                    กลับไปตะกร้า
                </NuxtLink>
                <h1 class="text-3xl font-bold flex items-center gap-2">
                    <UIcon name="i-lucide-credit-card" class="w-8 h-8 text-indigo-500" />
                    ชำระเงิน
                </h1>
            </div>

            <!-- Processing State -->
            <div v-if="step === 'processing'"
                class="flex flex-col items-center justify-center py-20 animate-fade-in-up">
                <div class="checkout-processing-ring mb-6">
                    <div class="checkout-processing-inner">
                        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                </div>
                <h2 class="text-xl font-bold mb-2">กำลังดำเนินการชำระเงิน...</h2>
                <p class="text-gray-500 text-sm">กรุณาอย่าปิดหน้านี้</p>
                <div class="checkout-progress-bar mt-6">
                    <div class="checkout-progress-fill"></div>
                </div>
            </div>

            <!-- Success State -->
            <div v-else-if="step === 'success'"
                class="flex flex-col items-center justify-center py-16 animate-fade-in-up">
                <div class="checkout-success-circle mb-6">
                    <UIcon name="i-lucide-check" class="w-10 h-10 text-white" />
                </div>
                <h2 class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">ชำระเงินสำเร็จ!</h2>
                <p class="text-gray-500 mb-8">ขอบคุณสำหรับการสั่งซื้อ</p>

                <!-- Order Summary -->
                <div
                    class="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
                    <div class="flex items-center gap-2 mb-4">
                        <UIcon name="i-lucide-receipt" class="w-5 h-5 text-indigo-500" />
                        <span class="font-semibold">สรุปคำสั่งซื้อ</span>
                    </div>
                    <div v-if="completedOrder" class="space-y-3">
                        <div v-for="item in completedOrder.items" :key="item.book?._id || item.book"
                            class="flex items-center justify-between text-sm">
                            <div class="flex items-center gap-2 min-w-0">
                                <UBadge :color="item.type === 'rental' ? 'purple' as any : 'primary'" variant="subtle"
                                    size="xs">
                                    {{ item.type === 'rental' ? 'เช่า' : 'ซื้อ' }}
                                </UBadge>
                                <span class="truncate">{{ item.book?.title || 'หนังสือ' }}</span>
                            </div>
                            <span class="font-semibold shrink-0 ml-2">฿{{ item.price }}</span>
                        </div>
                        <div class="border-t border-gray-200 dark:border-gray-800 pt-3 flex justify-between font-bold">
                            <span>รวมทั้งหมด</span>
                            <span class="text-indigo-600 dark:text-indigo-400">฿{{ completedOrder.total }}</span>
                        </div>
                        <div class="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
                            <UIcon name="i-lucide-hash" class="w-3.5 h-3.5" />
                            <span>{{ completedOrder._id }}</span>
                        </div>
                    </div>
                </div>

                <div class="flex gap-3">
                    <UButton to="/library" label="ไปคลังหนังสือ" icon="i-lucide-library" color="primary" size="lg" />
                    <UButton to="/" label="กลับหน้าหลัก" icon="i-lucide-home" variant="outline" color="neutral"
                        size="lg" />
                </div>
            </div>

            <!-- Form State -->
            <div v-else class="grid lg:grid-cols-5 gap-8 animate-fade-in-up">

                <!-- Payment Form (Left) -->
                <div class="lg:col-span-3">
                    <div
                        class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                        <h2 class="text-lg font-bold flex items-center gap-2 mb-6">
                            <UIcon name="i-lucide-wallet" class="w-5 h-5 text-indigo-500" />
                            ข้อมูลการชำระเงิน
                        </h2>

                        <!-- Card Preview -->
                        <div class="checkout-card-preview mb-8" :class="cardBrand">
                            <div class="checkout-card-bg"></div>
                            <div class="checkout-card-content">
                                <div class="flex justify-between items-start mb-8">
                                    <div class="checkout-card-chip">
                                        <div class="chip-line"></div>
                                        <div class="chip-line"></div>
                                        <div class="chip-line"></div>
                                    </div>
                                    <div class="checkout-card-brand">
                                        <template v-if="cardBrand === 'visa'">VISA</template>
                                        <template v-else-if="cardBrand === 'mastercard'">MC</template>
                                        <template v-else-if="cardBrand === 'amex'">AMEX</template>
                                        <template v-else>CARD</template>
                                    </div>
                                </div>
                                <div class="checkout-card-number">
                                    {{ cardNumber || '•••• •••• •••• ••••' }}
                                </div>
                                <div class="flex justify-between items-end mt-4">
                                    <div>
                                        <div class="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Card Holder
                                        </div>
                                        <div class="text-sm font-medium">{{ cardName || 'YOUR NAME' }}</div>
                                    </div>
                                    <div>
                                        <div class="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Expires
                                        </div>
                                        <div class="text-sm font-medium">{{ expiry || 'MM/YY' }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form @submit.prevent="handleCheckout" class="space-y-5">
                            <UFormField label="ชื่อบนบัตร">
                                <UInput v-model="cardName" placeholder="JOHN DOE" icon="i-lucide-user" size="lg" />
                            </UFormField>

                            <UFormField label="หมายเลขบัตร">
                                <UInput :model-value="cardNumber" @input="formatCardNumber"
                                    placeholder="4242 4242 4242 4242" icon="i-lucide-credit-card" size="lg"
                                    maxlength="19" />
                            </UFormField>

                            <div class="grid grid-cols-2 gap-4">
                                <UFormField label="วันหมดอายุ">
                                    <UInput :model-value="expiry" @input="formatExpiry" placeholder="MM/YY"
                                        icon="i-lucide-calendar" size="lg" maxlength="5" />
                                </UFormField>
                                <UFormField label="CVV">
                                    <UInput :model-value="cvv" @input="formatCvv" placeholder="•••" icon="i-lucide-lock"
                                        size="lg" maxlength="3" type="password" />
                                </UFormField>
                            </div>

                            <div class="pt-2">
                                <UButton type="submit" :label="`ชำระเงิน ฿${total}`" icon="i-lucide-shield-check"
                                    color="primary" size="xl" block :disabled="!isFormValid" class="checkout-pay-btn" />
                            </div>

                            <div class="flex items-center justify-center gap-2 text-xs text-gray-400 pt-1">
                                <UIcon name="i-lucide-shield-check" class="w-3.5 h-3.5" />
                                <span>การชำระเงินปลอดภัย (สาธิต)</span>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Order Summary (Right) -->
                <div class="lg:col-span-2">
                    <div
                        class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm sticky top-24">
                        <h2 class="text-lg font-bold flex items-center gap-2 mb-6">
                            <UIcon name="i-lucide-shopping-bag" class="w-5 h-5 text-purple-500" />
                            สรุปรายการ
                            <UBadge color="primary" variant="subtle" size="xs">{{ itemCount }}</UBadge>
                        </h2>

                        <div class="space-y-4 max-h-[400px] overflow-y-auto pr-1 mb-6">
                            <div v-for="item in cart?.items" :key="item.book?._id" class="flex items-start gap-3">
                                <div
                                    class="w-12 h-16 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center shrink-0 overflow-hidden">
                                    <img v-if="hasCover(item.book)" :src="item.book.coverImage" :alt="item.book.title"
                                        class="w-full h-full object-cover" @error="onCoverError(item.book._id)" />
                                    <UIcon v-else name="i-lucide-book-open" class="w-5 h-5 text-indigo-300" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h3 class="text-sm font-semibold truncate">{{ item.book?.title }}</h3>
                                    <p class="text-xs text-gray-500 truncate">{{ item.book?.author }}</p>
                                    <UBadge :color="item.type === 'rental' ? 'purple' as any : 'primary'"
                                        variant="subtle" size="xs" class="mt-1">
                                        {{ item.type === 'rental' ? 'เช่า' : 'ซื้อ' }}
                                    </UBadge>
                                </div>
                                <span class="text-sm font-bold shrink-0"
                                    :class="item.type === 'rental' ? 'text-purple-600 dark:text-purple-400' : 'text-indigo-600 dark:text-indigo-400'">
                                    ฿{{ item.price }}
                                </span>
                            </div>
                        </div>

                        <div class="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
                            <div class="flex justify-between text-sm text-gray-500">
                                <span>จำนวนสินค้า</span>
                                <span>{{ itemCount }} รายการ</span>
                            </div>
                            <div class="flex justify-between text-lg font-bold">
                                <span>รวมทั้งหมด</span>
                                <span class="text-indigo-600 dark:text-indigo-400">฿{{ total }}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<style scoped>
/* ===== Card Preview ===== */
.checkout-card-preview {
    position: relative;
    aspect-ratio: 1.586;
    max-width: 380px;
    border-radius: 1rem;
    overflow: hidden;
    margin: 0 auto;
    color: white;
    transition: all 0.5s ease;
    box-shadow: 0 20px 60px -15px rgba(99, 102, 241, 0.4);
}

.checkout-card-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #4338ca 0%, #6366f1 40%, #818cf8 100%);
    transition: background 0.5s ease;
}

.checkout-card-preview.visa .checkout-card-bg {
    background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 40%, #3b82f6 100%);
}

.checkout-card-preview.mastercard .checkout-card-bg {
    background: linear-gradient(135deg, #92400e 0%, #ea580c 40%, #f97316 100%);
}

.checkout-card-preview.amex .checkout-card-bg {
    background: linear-gradient(135deg, #1e3a5f 0%, #0d9488 40%, #14b8a6 100%);
}

.checkout-card-content {
    position: relative;
    z-index: 1;
    padding: 1.5rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.checkout-card-chip {
    width: 48px;
    height: 36px;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    padding: 6px;
}

.chip-line {
    height: 2px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 1px;
}

.checkout-card-brand {
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    opacity: 0.9;
}

.checkout-card-number {
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    font-family: 'Courier New', Courier, monospace;
}

/* ===== Processing ===== */
.checkout-processing-ring {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse-ring 2s ease-in-out infinite;
}

.checkout-processing-inner {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 24px rgba(99, 102, 241, 0.15);
}

:root.dark .checkout-processing-inner {
    background: #1e293b;
}

@keyframes pulse-ring {

    0%,
    100% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.1);
        opacity: 0.8;
    }
}

/* ===== Progress Bar ===== */
.checkout-progress-bar {
    width: 200px;
    height: 4px;
    border-radius: 2px;
    background: #e5e7eb;
    overflow: hidden;
}

:root.dark .checkout-progress-bar {
    background: #374151;
}

.checkout-progress-fill {
    height: 100%;
    border-radius: 2px;
    background: linear-gradient(90deg, #6366f1, #a855f7);
    animation: progress-fill 2.5s ease-in-out forwards;
}

@keyframes progress-fill {
    0% {
        width: 0%;
    }

    100% {
        width: 100%;
    }
}

/* ===== Success ===== */
.checkout-success-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #059669, #10b981);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12px 40px -8px rgba(16, 185, 129, 0.4);
    animation: success-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes success-pop {
    0% {
        transform: scale(0);
        opacity: 0;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* ===== Pay Button ===== */
.checkout-pay-btn {
    font-weight: 700;
    letter-spacing: 0.02em;
    transition: all 0.3s ease;
}

.checkout-pay-btn:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px -5px rgba(99, 102, 241, 0.4);
}

/* ===== Animate ===== */
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
