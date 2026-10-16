import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Helmet Security Headers
export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows /uploads images to load in frontend
  contentSecurityPolicy: false,
});

// General Global Rate Limiter: 300 requests / 15 minutes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.',
    },
  },
});

// Sensitive Auth Rate Limiter: 10 attempts / 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts. Please try again in 15 minutes.',
    },
  },
});

// Public Enquiry Rate Limiter: 5 submissions / hour per IP
export const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many enquiry submissions from this IP. Please try again in an hour.',
    },
  },
});

// Boot Environment Validation
export function validateBootEnvironment(): void {
  const issues: string[] = [];

  if (!process.env.DATABASE_URL) {
    issues.push('DATABASE_URL is not set.');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 16 || jwtSecret === 'replace_with_a_secure_random_key_min_32_chars') {
    issues.push('JWT_SECRET must be set to a secure string with at least 16 characters.');
  }

  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!refreshSecret || refreshSecret.length < 16 || refreshSecret === 'replace_with_another_secure_key_min_32_chars') {
    issues.push('JWT_REFRESH_SECRET must be set to a secure string with at least 16 characters.');
  }

  if (issues.length > 0 && process.env.NODE_ENV === 'production') {
    console.error('❌ FATAL: Production Boot Environment Validation Failed:\n' + issues.join('\n'));
    process.exit(1);
  } else if (issues.length > 0) {
    console.warn('⚠️ WARNING: Boot Environment Notices:\n' + issues.join('\n'));
  }
}
