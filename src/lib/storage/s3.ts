import 'server-only';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

const endpoint = process.env.S3_ENDPOINT ?? 'http://localhost:9000';
const region = process.env.S3_REGION ?? 'us-east-1';
const bucket = process.env.S3_BUCKET ?? 'estoque-fotos';
// Base pública dos objetos. No MinIO local = endpoint/bucket; no R2/S3 = URL pública (r2.dev / CDN).
const publicBase = process.env.S3_PUBLIC_URL ?? `${endpoint}/${bucket}`;

const client = new S3Client({
  endpoint,
  region,
  forcePathStyle: true, // MinIO exige path-style
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? 'minio',
    secretAccessKey: process.env.S3_SECRET_KEY ?? 'minio12345',
  },
});

let bucketReady = false;

/** Garante que o bucket existe e é legível publicamente (fotos exibidas no <img>). */
async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    // Bucket ausente (típico do MinIO local). No R2/S3 o bucket já existe (criado no painel).
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    try {
      await client.send(
        new PutBucketPolicyCommand({
          Bucket: bucket,
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucket}/*`],
              },
            ],
          }),
        }),
      );
    } catch {
      // R2 não aceita bucket policy via API — acesso público é habilitado no painel.
    }
  }
  bucketReady = true;
}

/** Faz upload de um objeto e retorna a URL pública. */
export async function uploadObject(key: string, body: Buffer, contentType: string): Promise<string> {
  await ensureBucket();
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
  );
  return `${publicBase}/${key}`;
}
