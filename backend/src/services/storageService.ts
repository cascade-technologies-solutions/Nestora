import path from 'path';
import fs from 'fs';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

export const UPLOAD_BASE_DIR = path.resolve(__dirname, '../../uploads');

// Ensure upload subdirectories exist
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

// Disk Storage configuration
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
 * Construct public URL for uploaded file
 */
export function getPublicUrl(folder: string, filename: string): string {
  return `/uploads/${folder}/${filename}`;
}

/**
 * Delete a file physically from host disk
 */
export async function deleteLocalFile(fileUrl: string): Promise<boolean> {
  try {
    if (!fileUrl.startsWith('/uploads/')) {
      return false;
    }
    const relativePath = fileUrl.replace('/uploads/', '');
    const fullPath = path.join(UPLOAD_BASE_DIR, relativePath);

    // Prevent directory traversal attacks
    if (!fullPath.startsWith(UPLOAD_BASE_DIR)) {
      return false;
    }

    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to unlink file at ${fileUrl}:`, error);
    return false;
  }
}
