export default defineNuxtRouteMiddleware(async () => {
  const { fetchUser, isLoggedIn, isAdmin } = useAuth()

  await fetchUser()

  if (!isLoggedIn.value) {
    return navigateTo('/login')
  }

  if (!isAdmin.value) {
    return navigateTo('/')
  }
})
