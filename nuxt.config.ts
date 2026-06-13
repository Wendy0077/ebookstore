// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Server-only keys (not exposed to client)
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore',
    jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    s3Region: process.env.S3_REGION || 'ap-southeast-1',
    s3Bucket: process.env.S3_BUCKET || 'bookstore-files',
    s3AccessKey: process.env.S3_ACCESS_KEY || '',
    s3SecretKey: process.env.S3_SECRET_KEY || '',
    s3Endpoint: process.env.S3_ENDPOINT || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    // Client-exposed keys
    public: {
      appName: 'BookVerse',
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      googleClientId: process.env.GOOGLE_CLIENT_ID || ''
    }
  },

  ignoreOptions: {
    allowRelativePaths: true
  },

  nitro: {
    preset: 'node-server'
  },

  routeRules: {
    '/': { prerender: true },
    // Cache static assets aggressively
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/**': { headers: { 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' } }
  },

  vite: {
    optimizeDeps: {
      include: ['@tato30/vue-pdf', 'pdfjs-dist']
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // PDF libs → only load on /read/* page (lazy imported)
            if (id.includes('pdfjs-dist') || id.includes('@tato30/vue-pdf')) {
              return 'pdf-reader'
            }
            // Stripe → only load on checkout
            if (id.includes('@stripe')) {
              return 'stripe'
            }
            // Let Rollup auto-split everything else into optimal chunks
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  },

  experimental: {
    viewTransition: false,
    payloadExtraction: true
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  icon: {
    clientBundle: {
      scan: {
        globInclude: ['app/**/*.vue'],
        globExclude: ['node_modules/**', '.nuxt/**', 'dist/**']
      }
    }
  }
})
