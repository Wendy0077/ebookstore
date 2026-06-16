import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (s3Client) return s3Client

  const region = process.env.S3_REGION || 'auto'
  const accessKey = process.env.S3_ACCESS_KEY || ''
  const secretKey = process.env.S3_SECRET_KEY || ''
  const endpoint = process.env.S3_ENDPOINT || ''

  const clientConfig: any = {
    region,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED'
  }

  if (accessKey && secretKey) {
    clientConfig.credentials = {
      accessKeyId: accessKey,
      secretAccessKey: secretKey
    }
  }

  if (endpoint) {
    clientConfig.endpoint = endpoint
    clientConfig.forcePathStyle = true
  }

  console.log('[S3] init client, endpoint:', endpoint || '(none)', 'region:', region)

  s3Client = new S3Client(clientConfig)
  return s3Client
}

export async function uploadToS3(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string> {
  const bucket = process.env.S3_BUCKET || useRuntimeConfig().s3Bucket
  const client = getS3Client()

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType
  }))

  return key
}

export async function getS3SignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const bucket = process.env.S3_BUCKET || useRuntimeConfig().s3Bucket
  const client = getS3Client()

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  })

  return getSignedUrl(client, command, { expiresIn })
}

export async function getS3Object(key: string): Promise<Buffer> {
  const bucket = process.env.S3_BUCKET || useRuntimeConfig().s3Bucket
  const client = getS3Client()

  const response = await client.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key
  }))

  const chunks: Uint8Array[] = []
  // @ts-ignore - readable stream
  for await (const chunk of response.Body) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

export async function deleteFromS3(key: string): Promise<void> {
  const bucket = process.env.S3_BUCKET || useRuntimeConfig().s3Bucket
  const client = getS3Client()

  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: key
  }))
}
