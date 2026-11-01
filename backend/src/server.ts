import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { adminAuthRouter, publicAuthRouter } from './routes/authRoutes';
import { publicPropertyRouter, adminPropertyRouter } from './routes/propertyRoutes';
import { publicProjectRouter, adminProjectRouter } from './routes/projectRoutes';
import { publicServiceRouter, adminServiceRouter } from './routes/serviceRoutes';
import { publicEnquiryRouter, adminEnquiryRouter } from './routes/enquiryRoutes';
import { publicCmsRouter, adminCmsRouter } from './routes/cmsRoutes';
import { publicSettingsRouter, adminSettingsRouter } from './routes/settingsRoutes';
import { adminEmployeeRouter } from './routes/employeeRoutes';
import { adminAuditLogRouter } from './routes/auditLogRoutes';
import { adminMediaRouter } from './routes/mediaRoutes';
import { adminMigrationRouter } from './routes/migrationRoutes';
import { wishlistRouter } from './routes/wishlistRoutes';
import { UPLOAD_BASE_DIR } from './services/storageService';
import { errorHandler } from './middleware/errorHandler';
import {
  helmetMiddleware,
  globalLimiter,
  authLimiter,
  enquiryLimiter,
  validateBootEnvironment,
} from './middleware/security';
import { prisma } from './utils/prisma';

dotenv.config();
validateBootEnvironment();

const app = express();
const PORT = process.env.PORT || 4000;

// Security Headers
app.use(helmetMiddleware);

const rawCors = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || process.env.CLIENT_URL;
const corsOrigins = rawCors
  ? rawCors.split(',').map((o) => o.trim())
  : ['http://localhost:8080', 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // allow requests with no origin like curl or mobile apps
      if (!origin) return callback(null, true);
      if (
        corsOrigins.includes('*') ||
        corsOrigins.indexOf(origin) !== -1 ||
        corsOrigins.some((allowed) => allowed && (origin === allowed || origin.includes(allowed.replace(/^https?:\/\//, '')))) ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Host Disk Media Serving (Zero cloud storage fees)
app.use('/uploads', express.static(UPLOAD_BASE_DIR));

// Global API Rate Limiter (300 requests / 15m)
app.use('/api', globalLimiter);

// Auth Rate Limiters (10 attempts / 15m)
app.use('/api/v1/admin/auth/login', authLimiter);
app.use('/api/v1/auth/login', authLimiter);

// Auth routes
app.use('/api/v1/admin/auth', adminAuthRouter);
app.use('/api/v1/auth', publicAuthRouter);

// Public Business routes
app.use('/api/v1/properties', publicPropertyRouter);
app.use('/api/v1/projects', publicProjectRouter);
app.use('/api/v1/services', publicServiceRouter);
app.use('/api/v1/enquiries', enquiryLimiter, publicEnquiryRouter);
app.use('/api/v1/cms', publicCmsRouter);
app.use('/api/v1/settings', publicSettingsRouter);
app.use('/api/v1/wishlist', wishlistRouter);

// Admin Business routes
app.use('/api/v1/admin/properties', adminPropertyRouter);
app.use('/api/v1/admin/projects', adminProjectRouter);
app.use('/api/v1/admin/services', adminServiceRouter);
app.use('/api/v1/admin/enquiries', adminEnquiryRouter);
app.use('/api/v1/admin/cms', adminCmsRouter);
app.use('/api/v1/admin/settings', adminSettingsRouter);
app.use('/api/v1/admin/employees', adminEmployeeRouter);
app.use('/api/v1/admin/audit-logs', adminAuditLogRouter);
app.use('/api/v1/admin/media', adminMediaRouter);
app.use('/api/v1/admin/migrate', adminMigrationRouter);

// Health Check & Neon Integration Status endpoint
app.get('/api/v1/health', async (req: Request, res: Response) => {
  try {
    // Attempt real database connection validation
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'UP', 
      message: 'Backend connects securely to Neon database.',
      services: {
        postgres: 'UP',
        auth: process.env.NEON_AUTH_BASE_URL ? 'CONFIGURED' : 'UNCONFIGURED',
        storage: process.env.AWS_ENDPOINT_URL_S3 ? 'CONFIGURED' : 'LOCAL',
        realtime: process.env.NEON_REALTIME_URL ? 'CONFIGURED' : 'UNCONFIGURED',
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Database connection failed', error);
    res.status(500).json({ 
      status: 'DOWN', 
      error: 'Database connection failure',
      message: error?.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Neon Cloud Services Info & Health inspection endpoint
app.get('/api/v1/neon/status', async (req: Request, res: Response) => {
  let dbStatus = 'DOWN';
  let dbError = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'UP';
  } catch (err: any) {
    dbError = err?.message;
  }

  res.status(200).json({
    success: true,
    data: {
      provider: 'Neon Lakebase',
      services: {
        postgres: {
          status: dbStatus,
          error: dbError,
        },
        auth: {
          status: process.env.NEON_AUTH_BASE_URL ? 'UP' : 'DISABLED',
          baseUrl: process.env.NEON_AUTH_BASE_URL || null,
        },
        objectStorage: {
          status: process.env.AWS_ENDPOINT_URL_S3 ? 'UP' : 'LOCAL',
          endpoint: process.env.AWS_ENDPOINT_URL_S3 || null,
          bucket: process.env.S3_BUCKET || 'uploads',
        },
        realtime: {
          status: process.env.NEON_REALTIME_URL ? 'UP' : 'DISABLED',
          url: process.env.NEON_REALTIME_URL || null,
        },
      },
      timestamp: new Date().toISOString(),
    },
  });
});

// Centralized Error Handling Middleware (Sanitized, Structured, No Stack Leaks)
app.use(errorHandler);

// Setup gracefully shutting down
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Nestora Backend running on http://localhost:${PORT}`);
  });
}

export default app;
