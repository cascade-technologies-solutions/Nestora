import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import crypto from 'crypto';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();

  // Log error internally with requestId for debugging
  console.error(`[Error ${requestId}] ${req.method} ${req.url}:`, err);

  // 1. Zod validation errors -> 400
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.errors[0]?.message || 'Validation failed',
        details: err.flatten().fieldErrors,
        requestId,
      },
    });
    return;
  }

  // 2. Multer upload errors -> 413 or 400
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Uploaded file exceeds the maximum allowed limit of 10 MB',
          requestId,
        },
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message,
        requestId,
      },
    });
    return;
  }

  if (err.code === 'INVALID_MIME_TYPE') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: err.message || 'Invalid file type. Only JPEG, PNG, WebP, and AVIF are allowed.',
        requestId,
      },
    });
    return;
  }

  // 3. Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_RESOURCE',
          message: `A record with this ${target.join(', ') || 'value'} already exists`,
          target,
          requestId,
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Requested resource was not found',
          requestId,
        },
      });
      return;
    }
  }

  // 4. Custom status errors
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  if (statusCode < 500) {
    res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || 'CLIENT_ERROR',
        message: err.message || 'Request failed',
        requestId,
      },
    });
    return;
  }

  // 5. Sanitized 500 Internal Server Error (Zero stack trace or internal SQL leak)
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred. Please contact support with this Request ID.',
      requestId,
    },
  });
}
