import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { adminAuthRouter, publicAuthRouter } from './routes/authRoutes';
import { prisma } from './utils/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

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
app.use(express.json());

// Auth routes
app.use('/api/v1/admin/auth', adminAuthRouter);
app.use('/api/v1/auth', publicAuthRouter);

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
