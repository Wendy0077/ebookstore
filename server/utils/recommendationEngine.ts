import Book from '../models/Book'
import Order from '../models/Order'
import Rental from '../models/Rental'
import Review from '../models/Review'
import ReadingHistory from '../models/ReadingHistory'
import Recommendation from '../models/Recommendation'

const MAX_TAGS = 15
const MIN_POSITIVES = 3
const TOP_N = 12

interface Vocab {
  categories: string[]
  tags: string[]
  maxPrice: number
  maxSales: number
}

function buildVocab(books: any[]): Vocab {
  const categories = [...new Set(books.map(b => b.category))].sort()

  const tagCounts = new Map<string, number>()
  for (const book of books) {
    for (const tag of book.tags || []) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    }
  }
  const tags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TAGS)
    .map(([tag]) => tag)

  const maxPrice = Math.max(1, ...books.map(b => b.price || 0))
  const maxSales = Math.max(1, ...books.map(b => b.salesCount || 0))

  return { categories, tags, maxPrice, maxSales }
}

function featurize(book: any, vocab: Vocab): number[] {
  const categoryVec = vocab.categories.map(c => (book.category === c ? 1 : 0))
  const tagSet = new Set(book.tags || [])
  const tagVec = vocab.tags.map(t => (tagSet.has(t) ? 1 : 0))
  const rating = (book.rating || 0) / 5
  const price = (book.price || 0) / vocab.maxPrice
  const sales = (book.salesCount || 0) / vocab.maxSales
  return [...categoryVec, ...tagVec, rating, price, sales]
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy
}

interface LinearSVM {
  weights: number[]
  bias: number
}

// Soft-margin linear SVM trained with the Pegasos stochastic sub-gradient algorithm
function trainLinearSVM(features: number[][], labels: number[], lambda = 0.01, epochs = 200): LinearSVM {
  const dim = features[0].length
  const weights = new Array(dim).fill(0)
  let bias = 0
  let t = 0

  for (let epoch = 0; epoch < epochs; epoch++) {
    for (let i = 0; i < features.length; i++) {
      t++
      const eta = 1 / (lambda * t)
      const x = features[i]
      const y = labels[i]
      let dot = bias
      for (let d = 0; d < dim; d++) dot += weights[d] * x[d]

      if (y * dot < 1) {
        for (let d = 0; d < dim; d++) weights[d] = (1 - eta * lambda) * weights[d] + eta * y * x[d]
        bias += eta * y
      } else {
        for (let d = 0; d < dim; d++) weights[d] = (1 - eta * lambda) * weights[d]
      }
    }
  }

  return { weights, bias }
}

function svmMargin(model: LinearSVM, x: number[]): number {
  let dot = model.bias
  for (let d = 0; d < x.length; d++) dot += model.weights[d] * x[d]
  return dot
}

async function collectUserPositives(): Promise<Map<string, Set<string>>> {
  const positives = new Map<string, Set<string>>()

  const addAll = (userId: string, bookIds: string[]) => {
    if (!positives.has(userId)) positives.set(userId, new Set())
    const set = positives.get(userId)!
    for (const id of bookIds) set.add(id)
  }

  const orders = await Order.find({ status: 'paid' }).lean()
  for (const order of orders as any[]) {
    addAll(order.user.toString(), order.items.map((item: any) => item.book.toString()))
  }

  const rentals = await Rental.find({}).lean()
  for (const rental of rentals as any[]) {
    addAll(rental.user.toString(), [rental.book.toString()])
  }

  const reviews = await Review.find({ rating: { $gte: 4 } }).lean()
  for (const review of reviews as any[]) {
    addAll(review.user.toString(), [review.book.toString()])
  }

  const history = await ReadingHistory.find({}).lean()
  for (const entry of history as any[]) {
    addAll(entry.user.toString(), [entry.book.toString()])
  }

  return positives
}

export async function trainAllRecommendations() {
  const books = await Book.find({ isActive: true }).lean()
  if (books.length < 2) {
    return { usersTrained: 0, usersSkipped: 0, totalUsers: 0, reason: 'not enough active books' }
  }

  const vocab = buildVocab(books)
  const booksById = new Map(books.map((b: any) => [b._id.toString(), b]))
  const userPositives = await collectUserPositives()

  let usersTrained = 0
  let usersSkipped = 0

  for (const [userId, positiveSet] of userPositives) {
    const positiveIds = [...positiveSet].filter(id => booksById.has(id))
    if (positiveIds.length < MIN_POSITIVES) {
      usersSkipped++
      continue
    }

    const negativePool = books.filter((b: any) => !positiveSet.has(b._id.toString()))
    if (negativePool.length === 0) {
      usersSkipped++
      continue
    }

    const negativeCount = Math.min(negativePool.length, Math.max(positiveIds.length * 3, 10))
    const negativeSample = shuffle(negativePool).slice(0, negativeCount)

    const features = [
      ...positiveIds.map(id => featurize(booksById.get(id), vocab)),
      ...negativeSample.map((b: any) => featurize(b, vocab))
    ]
    const labels = [
      ...positiveIds.map(() => 1),
      ...negativeSample.map(() => -1)
    ]

    let model: LinearSVM
    try {
      model = trainLinearSVM(features, labels)
    } catch {
      usersSkipped++
      continue
    }

    const candidates = books.filter((b: any) => !positiveSet.has(b._id.toString()))
    const margins = candidates.map((b: any) => svmMargin(model, featurize(b, vocab)))

    const ranked = candidates
      .map((b: any, i: number) => ({ book: b._id, score: margins[i] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N)

    await Recommendation.findOneAndUpdate(
      { user: userId },
      { user: userId, books: ranked, generatedAt: new Date() },
      { upsert: true }
    )
    usersTrained++
  }

  return { usersTrained, usersSkipped, totalUsers: userPositives.size }
}
