import { NextRequest, NextResponse } from 'next/server';
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutPublicAccessBlockCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

const REGION = process.env.S3_REGION!;
const BUCKET = process.env.S3_BUCKET!;

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

let bucketReady = false;

async function ensureBucket() {
  if (bucketReady) return;
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    bucketReady = true;
    return;
  } catch (err: any) {
    const status = err?.$metadata?.httpStatusCode;
    if (status !== 404 && err?.name !== 'NotFound' && err?.Code !== 'NoSuchBucket') {
      throw err;
    }
  }

  await s3.send(
    new CreateBucketCommand({
      Bucket: BUCKET,
      ...(REGION !== 'us-east-1'
        ? { CreateBucketConfiguration: { LocationConstraint: REGION as any } }
        : {}),
    })
  );

  await s3.send(
    new PutPublicAccessBlockCommand({
      Bucket: BUCKET,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false,
      },
    })
  );

  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: BUCKET,
      Policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PublicReadForProductImages',
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${BUCKET}/*`,
          },
        ],
      }),
    })
  );

  bucketReady = true;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    await ensureBucket();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() ?? 'jpg';
    const key = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('[POST /api/upload]', error);
    return NextResponse.json({ error: error.message ?? 'Upload failed' }, { status: 500 });
  }
}
