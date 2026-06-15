import User from '../../models/User'
import { comparePassword, generateToken, setAuthCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.email || !body.password) {
    throw createError({ statusCode: 400, message: 'กรุณากรอก email และ password' })
  }

  const user = await User.findOne({ email: body.email.toLowerCase() })
  if (!user) {
    throw createError({ statusCode: 401, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
  }

  const isValid = await comparePassword(body.password, user.password)
  if (!isValid) {
    throw createError({ statusCode: 401, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
  }

  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  })

  setAuthCookie(event, token)

  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token
  }
})
