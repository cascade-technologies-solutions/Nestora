import path from 'path';
import fs from 'fs';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const UPLOAD_BASE_DIR = path.resolve(__dirname, '../../uploads');

// Ensure upload subdirectories exist for local disk storage
const FOLDERS = ['properties', 'projects', 'cms', 'general'];
for (const folder of FOLDERS) {
  const folderPath = path.join(UPLOAD_BASE_DIR, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

// Allowed MIME types for photos
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

// Max file size: 10 MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Determine if S3 / Neon Object Storage is configured
const isS3Configured = (): boolean => {
  const isS3 = process.env.STORAGE_PROVIDER === 's3';
  const hasEndpoint = Boolean(process.env.AWS_ENDPOINT_URL_S3 || process.env.S3_ENDPOINT);
  const hasKey = Boolean(process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID);
  return isS3 && hasEndpoint && hasKey;
};

// Lazy S3 Client instantiation
let s3ClientInstance: S3Client | null = null;
function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    const endpoint = process.env.AWS_ENDPOINT_URL_S3 || process.env.S3_ENDPOINT;
    const region = process.env.AWS_REGION || process.env.S3_REGION || 'ap-southeast-1';
    const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID)!;
    const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY)!;

    s3ClientInstance = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for Neon Object Storage
    });
  }
  return s3ClientInstance;
}

// Multer Disk Storage fallback & temporary buffer staging
const diskStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let folder = (req.body.folder || req.query.folder || 'general') as string;
    if (!FOLDERS.includes(folder)) {
      folder = 'general';
    }
    const targetDir = path.join(UPLOAD_BASE_DIR, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const basename = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    cb(null, `${basename}-${timestamp}-${randomSuffix}${ext}`);
  },
});

// File filter validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('INVALID_MIME_TYPE: Only JPEG, PNG, WebP, and AVIF images are allowed.') as any;
    error.code = 'INVALID_MIME_TYPE';
    cb(error, false);
  }
};

export const upload = multer({
  storage: diskStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

/**
 * Uploads a staged file to Neon Object Storage (if S3 configured) or retains on host disk
 */
export async function persistUploadedFile(file: Express.Multer.File, folder: string): Promise<string> {
  const filename = file.filename;
  if (isS3Configured()) {
    const s3 = getS3Client();
    const bucket = process.env.S3_BUCKET || 'uploads';
    const s3Key = `${folder}/${filename}`;
    const fileBuffer = await fs.promises.readFile(file.path);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: file.mimetype,
      })
    );

    const endpoint = (process.env.AWS_ENDPOINT_URL_S3 || process.env.S3_ENDPOINT || '').replace(/\/$/, '');
    return `${endpoint}/${bucket}/${s3Key}`;
  }

  // Local disk URL fallback
  return `/uploads/${folder}/${filename}`;
}

/**
 * Construct public URL for uploaded file (Local fallback helper)
 */
export function getPublicUrl(folder: string, filename: string): string {
  if (isS3Configured()) {
    const endpoint = (process.env.AWS_ENDPOINT_URL_S3 || process.env.S3_ENDPOINT || '').replace(/\/$/, '');
    const bucket = process.env.S3_BUCKET || 'uploads';
    return `${endpoint}/${bucket}/${folder}/${filename}`;
  }
  return `/uploads/${folder}/${filename}`;
}

/**
 * Delete a file physically from Neon Object Storage or host disk
 */
export async function deleteStoredFile(fileUrl: string): Promise<boolean> {
  try {
    const endpoint = (process.env.AWS_ENDPOINT_URL_S3 || process.env.S3_ENDPOINT || '').replace(/\/$/, '');
    const bucket = process.env.S3_BUCKET || 'uploads';

    // 1. Delete from Neon Object Storage
    if (fileUrl.startsWith(endpoint) && isS3Configured()) {
      const s3 = getS3Client();
      const prefix = `${endpoint}/${bucket}/`;
      const s3Key = fileUrl.replace(prefix, '');
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: s3Key,
        })
      );
      return true;
    }

    // 2. Delete from Local disk
    if (fileUrl.startsWith('/uploads/')) {
      const relativePath = fileUrl.replace('/uploads/', '');
      const fullPath = path.join(UPLOAD_BASE_DIR, relativePath);

      if (!fullPath.startsWith(UPLOAD_BASE_DIR)) {
        return false;
      }

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error(`Failed to unlink file at ${fileUrl}:`, error);
    return false;
  }
}

// Backward compatibility alias
export const deleteLocalFile = deleteStoredFile;
