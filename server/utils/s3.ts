import type { Readable } from 'node:stream'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (s3Client) return s3Client

  const config = useRuntimeConfig()
  const endpoint = config.s3Endpoint || ''
  const region = config.s3Region || 'auto'

  const clientConfig: any = {
    region,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED'
  }

  if (config.s3AccessKey && config.s3SecretKey) {
    clientConfig.credentials = {
      accessKeyId: config.s3AccessKey,
      secretAccessKey: config.s3SecretKey
    }
  }

  if (endpoint) {
    clientConfig.endpoint = endpoint
    clientConfig.forcePathStyle = true
  }

  console.log('[S3] init:', {
    endpoint: endpoint || '(none)',
    region,
    bucket: config.s3Bucket || '(none)',
    hasAccessKey: !!config.s3AccessKey,
    hasSecretKey: !!config.s3SecretKey
  })

  s3Client = new S3Client(clientConfig)
  return s3Client
}

export async function uploadToS3(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string> {
  const bucket = useRuntimeConfig().s3Bucket
  const client = getS3Client()

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key.replace(/^\/+/, ''),
    Body: body,
    ContentType: contentType
  }))

  return key
}

export async function getS3SignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const bucket = useRuntimeConfig().s3Bucket
  const client = getS3Client()

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  })

  return getSignedUrl(client, command, { expiresIn })
}

export async function getS3Object(key: string): Promise<Buffer> {
  const bucket = useRuntimeConfig().s3Bucket
  const client = getS3Client()

  const response = await client.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key.replace(/^\/+/, '')
  }))

  const chunks: Uint8Array[] = []
  // @ts-ignore - readable stream
  for await (const chunk of response.Body) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

export interface S3StreamResult {
  body: Readable
  contentLength?: number
  contentRange?: string
  acceptRanges?: string
}

export async function getS3ObjectStream(key: string, range?: string): Promise<S3StreamResult> {
  const bucket = useRuntimeConfig().s3Bucket
  const client = getS3Client()

  const response = await client.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key.replace(/^\/+/, ''),
    Range: range
  }))

  return {
    body: response.Body as Readable,
    contentLength: response.ContentLength,
    contentRange: response.ContentRange,
    acceptRanges: response.AcceptRanges
  }
}

export async function deleteFromS3(key: string): Promise<void> {
  const bucket = useRuntimeConfig().s3Bucket
  const client = getS3Client()

  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: key.replace(/^\/+/, '')
  }))
}
