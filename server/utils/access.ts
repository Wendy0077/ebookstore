import AccessControl from '../models/AccessControl'

export async function assertRentalNotExpired(ac: any): Promise<void> {
  if (ac.accessType === 'rental' && ac.rentalExpireAt && ac.rentalExpireAt < new Date()) {
    await AccessControl.updateOne({ _id: ac._id }, { isActive: false })
    throw createError({ statusCode: 403, message: 'สิทธิ์การเช่าหมดอายุแล้ว' })
  }
}