import User from '../../models/User'
import { generateToken, setAuthCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { credential } = body

  if (!credential) {
    throw createError({ statusCode: 400, message: 'กรุณาระบุ Google credential' })
  }

  // Verify Google ID token
  const config = useRuntimeConfig()
  let googleUser: any

  try {
    const response = await $fetch<any>(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)

    // Verify audience matches our client ID
    if (config.googleClientId && response.aud !== config.googleClientId) {
      throw new Error('Invalid audience')
    }

    googleUser = {
      googleId: response.sub,
      email: response.email,
      name: response.name || response.email.split('@')[0],
      avatar: response.picture || ''
    }
  } catch (err: any) {
    throw createError({ statusCode: 401, message: 'Google token ไม่ถูกต้อง' })
  }

  // Find existing user by googleId or email
  let user = await User.findOne({
    $or: [
      { googleId: googleUser.googleId },
      { email: googleUser.email.toLowerCase() }
    ]
  })

  if (user) {
    // Link Google ID if existing email user doesn't have one
    if (!user.googleId) {
      user.googleId = googleUser.googleId
      user.authProvider = 'google'
      if (googleUser.avatar && !user.avatar) {
        user.avatar = googleUser.avatar
      }
      await user.save()
    }
  } else {
    // Create new user from Google account
    user = await User.create({
      email: googleUser.email.toLowerCase(),
      name: googleUser.name,
      avatar: googleUser.avatar,
      googleId: googleUser.googleId,
      authProvider: 'google',
      role: 'user'
    })
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
      role: user.role,
      avatar: user.avatar
    },
    token
  }
})
