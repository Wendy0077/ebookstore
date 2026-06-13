<script setup lang="ts">
const { login, loginWithGoogle } = useAuth()
const { fetchCart } = useCart()
const toast = useToast()
const config = useRuntimeConfig()

useSeoMeta({ title: 'เข้าสู่ระบบ — BookVerse' })

const email = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)
const googleBtnEl = ref<HTMLElement | null>(null)

const handleLogin = async () => {
  if (!email.value || !password.value) {
    toast.add({ title: 'กรุณากรอกข้อมูลให้ครบ', color: 'warning' })
    return
  }
  loading.value = true
  try {
    await login(email.value, password.value)
    await fetchCart()
    toast.add({ title: 'เข้าสู่ระบบเรียบร้อย', icon: 'i-lucide-check-circle', color: 'success' })
    navigateTo('/')
  } catch (err: any) {
    toast.add({ title: err.data?.statusMessage || 'เกิดข้อผิดพลาด', color: 'error' })
  } finally {
    loading.value = false
  }
}

const handleGoogleCallback = async (response: { credential: string }) => {
  loading.value = true
  try {
    await loginWithGoogle(response.credential)
    await fetchCart()
    toast.add({ title: 'เข้าสู่ระบบด้วย Google เรียบร้อย', icon: 'i-lucide-check-circle', color: 'success' })
    navigateTo('/')
  } catch (err: any) {
    toast.add({ title: err.data?.statusMessage || 'เกิดข้อผิดพลาด', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const clientId = config.public.googleClientId
  if (!clientId || !googleBtnEl.value) return
  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true
  script.onload = () => {
    const google = (window as any).google
    if (!google) return
    google.accounts.id.initialize({ client_id: clientId, callback: handleGoogleCallback })
    google.accounts.id.renderButton(googleBtnEl.value!, {
      theme: 'outline',
      size: 'large',
      width: googleBtnEl.value!.offsetWidth || 360,
      text: 'signin_with',
      locale: 'th'
    })
  }
  document.head.appendChild(script)
})
</script>

<template>
  <div class="lux-page">

    <!-- Left Brand Panel -->
    <div class="lux-brand-panel">
      <div class="lux-brand-glow" />
      <div class="lux-brand-content">
        <div class="lux-monogram">
          <UIcon name="i-lucide-book-open" class="w-6 h-6" />
        </div>
        <p class="lux-wordmark">BookVerse</p>
        <div class="lux-brand-rule" />
        <blockquote class="lux-quote">
          "ทุกหน้า<br>คือประตูสู่<br>โลกใหม่"
        </blockquote>
        <p class="lux-tagline">ห้องสมุดดิจิทัลระดับพรีเมียม</p>
      </div>
      <div class="lux-brand-corner-tl" />
      <div class="lux-brand-corner-br" />
    </div>

    <!-- Right Form Panel -->
    <div class="lux-form-panel">
      <div class="lux-form-inner">

        <!-- Mobile logo -->
        <div class="lux-mobile-logo">
          <UIcon name="i-lucide-book-open" class="w-5 h-5 lux-text-gold" />
          <span class="lux-wordmark-sm">BookVerse</span>
        </div>

        <header class="lux-form-header">
          <h1 class="lux-form-title">เข้าสู่ระบบ</h1>
          <p class="lux-form-sub">ยินดีต้อนรับกลับสู่ BookVerse</p>
        </header>

        <form class="lux-form" @submit.prevent="handleLogin">
          <div class="lux-field">
            <label class="lux-label">อีเมล</label>
            <input
              v-model="email"
              type="email"
              class="lux-input"
              placeholder="you@example.com"
              autocomplete="email"
              autofocus
            />
          </div>

          <div class="lux-field">
            <label class="lux-label">รหัสผ่าน</label>
            <div class="lux-input-row">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="lux-input"
                placeholder="••••••••"
                autocomplete="current-password"
              />
              <button type="button" class="lux-eye" tabindex="-1" @click="showPassword = !showPassword">
                <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <button type="submit" class="lux-btn" :disabled="loading">
            <span v-if="loading" class="lux-btn-loading">
              <span class="lux-spinner" />
              กำลังเข้าสู่ระบบ...
            </span>
            <span v-else>เข้าสู่ระบบ</span>
          </button>
        </form>

        <div class="lux-sep">
          <span>หรือ</span>
        </div>

        <div v-if="config.public.googleClientId" class="lux-google">
          <div ref="googleBtnEl" class="w-full" />
        </div>

        <p class="lux-switch">
          ยังไม่มีบัญชี?
          <NuxtLink to="/register" class="lux-switch-link">สมัครสมาชิก</NuxtLink>
        </p>

      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── Layout ── */
.lux-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 400px 1fr;
}

/* ── Brand Panel ── */
.lux-brand-panel {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6366f1 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.lux-brand-glow {
  position: absolute;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.lux-brand-corner-tl,
.lux-brand-corner-br {
  position: absolute;
  width: 80px;
  height: 80px;
  border-color: rgba(129, 140, 248, 0.15);
  border-style: solid;
}

.lux-brand-corner-tl {
  top: 2rem;
  left: 2rem;
  border-width: 1px 0 0 1px;
}

.lux-brand-corner-br {
  bottom: 2rem;
  right: 2rem;
  border-width: 0 1px 1px 0;
}

.lux-brand-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 3rem;
}

.lux-monogram {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid rgba(129, 140, 248, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  margin: 0 auto 1.25rem;
}

.lux-wordmark {
  font-size: 0.8125rem;
  font-weight: 400;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: #f0ece4;
  margin-bottom: 2rem;
}

.lux-brand-rule {
  width: 32px;
  height: 1px;
  background: rgba(129, 140, 248, 0.45);
  margin: 0 auto 2rem;
}

.lux-quote {
  font-size: 1.625rem;
  font-weight: 300;
  line-height: 1.75;
  color: rgba(240, 236, 228, 0.65);
  font-style: italic;
  letter-spacing: 0.01em;
  margin-bottom: 2rem;
}

.lux-tagline {
  font-size: 0.625rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(129, 140, 248, 0.6);
}

/* ── Form Panel ── */
.lux-form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafaf8;
  padding: 3rem 2rem;
}

:root.dark .lux-form-panel {
  background: #0f0f0f;
}

.lux-form-inner {
  width: 100%;
  max-width: 380px;
}

/* Mobile logo */
.lux-mobile-logo {
  display: none;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2.5rem;
}

.lux-text-gold { color: #6366f1; }

.lux-wordmark-sm {
  font-size: 0.8125rem;
  font-weight: 400;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #0a0a0a;
}

:root.dark .lux-wordmark-sm { color: #f0ece4; }

/* Header */
.lux-form-header {
  margin-bottom: 2.75rem;
}

.lux-form-title {
  font-size: 2.125rem;
  font-weight: 300;
  letter-spacing: -0.01em;
  color: #0a0a0a;
  margin-bottom: 0.375rem;
  line-height: 1.15;
}

:root.dark .lux-form-title { color: #f0ece4; }

.lux-form-sub {
  font-size: 0.875rem;
  color: #999;
  letter-spacing: 0.01em;
}

/* Form */
.lux-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.lux-field { position: relative; }

.lux-label {
  display: block;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #aaa;
  margin-bottom: 0.625rem;
}

.lux-input-row {
  position: relative;
  display: flex;
  align-items: center;
}

.lux-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid #d8d4cc;
  padding: 0.5rem 0;
  font-size: 0.9375rem;
  color: #0a0a0a;
  outline: none;
  transition: border-color 0.25s ease;
  letter-spacing: 0.01em;
}

:root.dark .lux-input {
  color: #f0ece4;
  border-bottom-color: #2a2a2a;
}

.lux-input:focus { border-bottom-color: #6366f1; }

.lux-input::placeholder {
  color: #ccc;
  font-weight: 300;
}

:root.dark .lux-input::placeholder { color: #3a3a3a; }

.lux-eye {
  position: absolute;
  right: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #bbb;
  display: flex;
  align-items: center;
  padding: 0.25rem;
  transition: color 0.2s;
}

.lux-eye:hover { color: #6366f1; }

/* CTA Button */
.lux-btn {
  width: 100%;
  padding: 0.9375rem;
  background: linear-gradient(135deg, #4338ca, #6366f1);
  color: #fff;
  border: none;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: opacity 0.25s ease, box-shadow 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.lux-btn:hover:not(:disabled) {
  opacity: 0.88;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
}

.lux-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.lux-btn-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lux-spinner {
  width: 14px;
  height: 14px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Separator */
.lux-sep {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
  color: #bbb;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.lux-sep::before,
.lux-sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e8e4dc;
}

:root.dark .lux-sep::before,
:root.dark .lux-sep::after {
  background: #222;
}

/* Google */
.lux-google {
  display: flex;
  justify-content: center;
  margin-bottom: 1.75rem;
}

/* Switch */
.lux-switch {
  text-align: center;
  font-size: 0.8125rem;
  color: #999;
  letter-spacing: 0.01em;
}

.lux-switch-link {
  color: #4338ca;
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid rgba(99, 102, 241, 0.4);
  padding-bottom: 1px;
  margin-left: 0.25rem;
  transition: color 0.2s, border-color 0.2s;
}

:root.dark .lux-switch-link { color: #818cf8; }

.lux-switch-link:hover {
  color: #6366f1;
  border-color: #6366f1;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .lux-page { grid-template-columns: 1fr; }
  .lux-brand-panel { display: none; }
  .lux-mobile-logo { display: flex; }

  .lux-form-panel {
    min-height: 100vh;
    padding: 3rem 1.5rem;
    align-items: flex-start;
  }
}
</style>