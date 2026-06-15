interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
}

export const useAuth = () => {
  const user = useState<User | null>('auth_user', () => null)
  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const token = useState<string>('auth_token', () => '')
  const sessionChecked = useState<boolean>('auth_session_checked', () => false)
  const checkingSession = useState<boolean>('auth_session_checking', () => false)

  const loginWithGoogle = async (credential: string) => {
    const data = await $fetch<{ user: User; token: string }>('/api/auth/google', {
      method: 'POST',
      body: { credential }
    })
    user.value = data.user
    token.value = data.token
    sessionChecked.value = true
    return data
  }

  const login = async (email: string, password: string) => {
    const data = await $fetch<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    user.value = data.user
    token.value = data.token
    sessionChecked.value = true
    return data
  }

  const register = async (email: string, password: string, name: string) => {
    const data = await $fetch<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: { email, password, name }
    })
    user.value = data.user
    token.value = data.token
    sessionChecked.value = true
    return data
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    token.value = ''
    sessionChecked.value = true
    navigateTo('/login')
  }

  const fetchUser = async () => {
    if (sessionChecked.value || checkingSession.value) return
    checkingSession.value = true
    if (import.meta.server) {
      const authCookie = useCookie('auth_token')
      if (!authCookie.value && !token.value) {
        user.value = null
        sessionChecked.value = true
        checkingSession.value = false
        return
      }
    }
    try {
      // useRequestFetch forwards incoming request cookies on SSR so httpOnly auth_token is included
      const $apiFetch = useRequestFetch()
      const data = await $apiFetch<User>('/api/auth/me', {
        ignoreResponseError: true
      })
      if (data && (data as any).id) {
        user.value = data
      } else {
        user.value = null
        token.value = ''
      }
    } catch {
      user.value = null
      token.value = ''
    } finally {
      sessionChecked.value = true
      checkingSession.value = false
    }
  }

  return {
    user,
    isLoggedIn,
    isAdmin,
    token,
    login,
    loginWithGoogle,
    register,
    logout,
    fetchUser
  }
}
