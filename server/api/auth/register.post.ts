import User from '../../models/User'
import { hashPassword, generateToken, setAuthCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.email || !body.password || !body.name) {
    throw createError({ statusCode: 400, message: 'กรุณากรอกข้อมูลให้ครบ (email, password, name)' })
  }

  if (body.password.length < 6) {
    throw createError({ statusCode: 400, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
  }

  const existingUser = await User.findOne({ email: body.email.toLowerCase() })
  if (existingUser) {
    throw createError({ statusCode: 409, message: 'อีเมลนี้ถูกใช้งานแล้ว' })
  }

  const hashedPassword = await hashPassword(body.password)

  const user = await User.create({
    email: body.email.toLowerCase(),
    password: hashedPassword,
    name: body.name,
    role: 'user'
  })

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
