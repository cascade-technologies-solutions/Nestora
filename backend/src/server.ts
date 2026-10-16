import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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
