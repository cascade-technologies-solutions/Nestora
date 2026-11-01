import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testNeonStorage() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3 || process.env.S3_ENDPOINT;
  const region = process.env.AWS_REGION || process.env.S3_REGION || 'ap-southeast-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET || 'uploads';

  console.log(`Connecting to Neon Object Storage endpoint: ${endpoint}, bucket: ${bucket}...`);

  const s3 = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
    forcePathStyle: true,
  });

  try {
    // 1. Put test object
    const testKey = `test/ping-${Date.now()}.txt`;
    console.log(`Uploading test object: ${testKey}...`);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: 'Neon Object Storage Test - Nestora Real Estate',
        ContentType: 'text/plain',
      })
    );
    console.log(`✅ Upload successful: ${endpoint}/${bucket}/${testKey}`);

    // 2. List objects
    const listRes = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 5,
      })
    );
    console.log(`✅ Objects in bucket "${bucket}":`, listRes.Contents?.map(c => c.Key));

    // 3. Clean up test object
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: testKey,
      })
    );
    console.log(`✅ Cleanup successful for: ${testKey}`);
    console.log('🎉 Neon Object Storage is fully functional and ready!');
  } catch (err: any) {
    console.error('❌ Neon Object Storage test failed:', err);
    process.exit(1);
  }
}

testNeonStorage();
