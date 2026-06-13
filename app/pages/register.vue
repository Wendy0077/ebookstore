<script setup lang="ts">
const { register } = useAuth()
const toast = useToast()

useSeoMeta({ title: 'สมัครสมาชิก — BookVerse' })

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const showPassword = ref(false)

const handleRegister = async () => {
  if (!name.value || !email.value || !password.value) {
    toast.add({ title: 'กรุณากรอกข้อมูลให้ครบ', color: 'warning' })
    return
  }
  if (password.value.length < 6) {
    toast.add({ title: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', color: 'warning' })
    return
  }
  if (password.value !== confirmPassword.value) {
    toast.add({ title: 'รหัสผ่านไม่ตรงกัน', color: 'warning' })
    return
  }

  loading.value = true
  try {
    await register(email.value, password.value, name.value)
    toast.add({ title: 'สมัครสมาชิกเรียบร้อย', icon: 'i-lucide-check-circle', color: 'success' })
    navigateTo('/')
  } catch (err: any) {
    toast.add({ title: err.data?.statusMessage || 'เกิดข้อผิดพลาด', color: 'error' })
  } finally {
    loading.value = false
  }
}
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
        <div class="lux-perks">
          <div class="lux-perk">
            <span class="lux-perk-mark">—</span>
            <span>หนังสือดีคัดสรรนับพันเล่ม</span>
          </div>
          <div class="lux-perk">
            <span class="lux-perk-mark">—</span>
            <span>เข้าถึงได้ทุกที่ ทุกเวลา</span>
          </div>
          <div class="lux-perk">
            <span class="lux-perk-mark">—</span>
            <span>ซื้อขาด หรือเช่าอ่านได้ตามใจ</span>
          </div>
          <div class="lux-perk">
            <span class="lux-perk-mark">—</span>
            <span>ระบบรักษาความปลอดภัยสูง</span>
          </div>
        </div>
        <p class="lux-tagline">เริ่มต้นได้ฟรี ไม่มีค่าใช้จ่าย</p>
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
          <h1 class="lux-form-title">สมัครสมาชิก</h1>
          <p class="lux-form-sub">สร้างบัญชีเพื่อเริ่มต้นการอ่าน</p>
        </header>

        <form class="lux-form" @submit.prevent="handleRegister">
          <div class="lux-field">
            <label class="lux-label">ชื่อ</label>
            <input
              v-model="name"
              type="text"
              class="lux-input"
              placeholder="ชื่อของคุณ"
              autocomplete="name"
              autofocus
            />
          </div>

          <div class="lux-field">
            <label class="lux-label">อีเมล</label>
            <input
              v-model="email"
              type="email"
              class="lux-input"
              placeholder="you@example.com"
              autocomplete="email"
            />
          </div>

          <div class="lux-field">
            <label class="lux-label">รหัสผ่าน</label>
            <div class="lux-input-row">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="lux-input"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                autocomplete="new-password"
              />
              <button type="button" class="lux-eye" tabindex="-1" @click="showPassword = !showPassword">
                <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="lux-field">
            <label class="lux-label">ยืนยันรหัสผ่าน</label>
            <div class="lux-input-row">
              <input
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                class="lux-input"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                autocomplete="new-password"
              />
              <span v-if="confirmPassword" class="lux-match-icon">
                <UIcon
                  :name="confirmPassword === password ? 'i-lucide-check' : 'i-lucide-x'"
                  class="w-4 h-4"
                  :class="confirmPassword === password ? 'lux-text-gold' : 'text-red-400'"
                />
              </span>
            </div>
          </div>

          <button type="submit" class="lux-btn" :disabled="loading">
            <span v-if="loading" class="lux-btn-loading">
              <span class="lux-spinner" />
              กำลังสมัครสมาชิก...
            </span>
            <span v-else>สร้างบัญชี</span>
          </button>
        </form>

        <div class="lux-sep">
          <span>มีบัญชีอยู่แล้ว?</span>
        </div>

        <NuxtLink to="/login" class="lux-btn-outline">
          เข้าสู่ระบบ
        </NuxtLink>

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
  margin: 0 auto 2.25rem;
}

.lux-perks {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
  text-align: left;
  margin-bottom: 2.5rem;
}

.lux-perk {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  font-size: 0.875rem;
  color: rgba(240, 236, 228, 0.6);
  font-weight: 300;
  letter-spacing: 0.01em;
  line-height: 1.5;
}

.lux-perk-mark {
  color: #6366f1;
  font-weight: 400;
  flex-shrink: 0;
  margin-top: 0.05em;
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
  gap: 1.875rem;
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

.lux-eye,
.lux-match-icon {
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
  margin-top: 0.25rem;
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
}

.lux-sep::before,
.lux-sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e8e4dc;
}

:root.dark .lux-sep::before,
:root.dark .lux-sep::after { background: #222; }

/* Outline Button (login link) */
.lux-btn-outline {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.9375rem;
  background: transparent;
  border: 1px solid #c7d2fe;
  color: #4338ca;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-decoration: none;
  transition: border-color 0.25s ease, color 0.25s ease, background 0.25s ease;
}

:root.dark .lux-btn-outline {
  border-color: rgba(99, 102, 241, 0.3);
  color: #818cf8;
}

.lux-btn-outline:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.04);
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