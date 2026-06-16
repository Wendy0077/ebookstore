import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (s3Client) return s3Client

  const config = useRuntimeConfig()

  const clientConfig: any = {
    region: config.s3Region || 'auto',
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED'
  }

  if (config.s3AccessKey && config.s3SecretKey) {
    clientConfig.credentials = {
      accessKeyId: config.s3AccessKey,
      secretAccessKey: config.s3SecretKey
    }
  }

  if (config.s3Endpoint) {
    clientConfig.endpoint = config.s3Endpoint
    clientConfig.forcePathStyle = true
  }

  s3Client = new S3Client(clientConfig)
  return s3Client
}

export async function uploadToS3(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string> {
  const config = useRuntimeConfig()
  const client = getS3Client()

  await client.send(new PutObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
    Body: body,
    ContentType: contentType
  }))

  return key
}

export async function getS3SignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const config = useRuntimeConfig()
  const client = getS3Client()

  const command = new GetObjectCommand({
    Bucket: config.s3Bucket,
    Key: key
  })

  return getSignedUrl(client, command, { expiresIn })
}

export async function getS3Object(key: string): Promise<Buffer> {
  const config = useRuntimeConfig()
  const client = getS3Client()

  const response = await client.send(new GetObjectCommand({
    Bucket: config.s3Bucket,
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
  const config = useRuntimeConfig()
  const client = getS3Client()

  await client.send(new DeleteObjectCommand({
    Bucket: config.s3Bucket,
    Key: key
  }))
}
