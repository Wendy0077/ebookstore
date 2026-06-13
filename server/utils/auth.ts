import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'

interface TokenPayload {
  userId: string
  email: string
  role: string
}

export function generateToken(payload: TokenPayload): string {
  const config = useRuntimeConfig()
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload {
  const config = useRuntimeConfig()
  return jwt.verify(token, config.jwtSecret) as TokenPayload
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function getTokenFromEvent(event: H3Event): string | null {
  const authorization = getHeader(event, 'authorization')
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice(7)
  }

  const cookie = getCookie(event, 'auth_token')
  return cookie || null
}

export function requireAuth(event: H3Event): TokenPayload {
  const token = getTokenFromEvent(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized: No token provided' })
  }
  try {
    return verifyToken(token)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized: Invalid token' })
  }
}

export function requireAdmin(event: H3Event): TokenPayload {
  const user = requireAuth(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: Admin access required' })
  }
  return user
}
