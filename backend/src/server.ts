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

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:8080', 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // allow requests with no origin like curl or mobile apps
      if (!origin) return callback(null, true);
      if (corsOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
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

// Phase 1 + 2 Core: Health Check endpoint
app.get('/api/v1/health', async (req: Request, res: Response) => {
  try {
    // Attempt real database connection validation
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'UP', 
      message: 'Backend connects securely to database.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection failed', error);
    res.status(500).json({ 
      status: 'DOWN', 
      error: 'Database connection failure',
      timestamp: new Date().toISOString()
    });
  }
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
