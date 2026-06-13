import DownloadToken from '../../models/DownloadToken'
import { requireAuth } from '../../utils/auth'

type BookRef = string | { _id?: string | { toString: () => string }, toString?: () => string }

type DownloadOrderItem = {
  book?: BookRef
  type?: 'purchase' | 'rental'
  price?: number
}

type DownloadOrder = {
  _id?: string | { toString: () => string }
  items?: DownloadOrderItem[]
}

type DownloadTokenRecord = {
  _id: string | { toString: () => string }
  token: string
  book?: BookRef
  order?: DownloadOrder
  maxDownloads: number
  downloadCount: number
  expiresAt: string | Date
  createdAt?: string | Date
}

const toId = (value?: BookRef | DownloadOrder['_id']) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if ('_id' in value && value._id) return toId(value._id)
  return value.toString?.() || ''
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const tokens = await DownloadToken.find({ user: user.userId })
    .populate('book')
    .populate('order')
    .sort({ createdAt: -1 })
    .lean() as unknown as DownloadTokenRecord[]

  return tokens.map((token) => {
    const bookId = toId(token.book)
    const orderItem = token.order?.items?.find(item => toId(item.book) === bookId)
    const expiresAt = new Date(token.expiresAt)
    const isExpired = expiresAt.getTime() < Date.now()

    return {
      _id: token._id,
      token: token.token,
      book: token.book,
      orderId: toId(token.order?._id),
      type: orderItem?.type || 'purchase',
      price: orderItem?.price || 0,
      maxDownloads: token.maxDownloads,
      downloadCount: token.downloadCount,
      remainingDownloads: Math.max(token.maxDownloads - token.downloadCount, 0),
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
      isExpired,
      canDownload: !isExpired && token.downloadCount < token.maxDownloads
    }
  })
})
