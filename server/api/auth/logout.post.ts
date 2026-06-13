export default defineEventHandler(async (event) => {
  deleteCookie(event, 'auth_token')
  return { message: 'ออกจากระบบเรียบร้อย' }
})
