import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from '../services/authService';
import { computeEffectivePermissions } from '../middleware/authMiddleware';

// ── Cookie Options Helper ──────────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === 'production';

function getRefreshTokenCookieOptions(maxAgeDays = 7) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict' as const,
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

// ── Admin Auth Controllers ─────────────────────────────────────────────────────

const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

export async function adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0]?.message || 'Invalid input data',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const { username, password } = parsed.data;
    const employee = await prisma.employee.findFirst({
      where: {
        username: {
          equals: username.trim(),
          mode: 'insensitive',
        },
      },
      include: {
        permissions: true,
      },
    });

    if (!employee) {
      // Generic error: no user enumeration
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect username or password.',
        },
      });
      return;
    }

    if (employee.status === 'Suspended') {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended. Please contact the Super Admin.',
        },
      });
      return;
    }

    if (employee.status === 'Deactivated') {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account has been deactivated.',
        },
      });
      return;
    }

    const isMatch = await verifyPassword(password, employee.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect username or password.',
        },
      });
      return;
    }

    // Update last login timestamp
    await prisma.employee.update({
      where: { id: employee.id },
      data: { lastLogin: new Date() },
    });

    const permissions = computeEffectivePermissions(employee.role, employee.permissions);
    const tokenPayload = {
      id: employee.id,
      role: employee.role,
      type: 'admin' as const,
      username: employee.username,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken({ employeeId: employee.id });

    res.cookie('adminRefreshToken', refreshToken, getRefreshTokenCookieOptions(7));

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: employee.id,
          username: employee.username,
          name: employee.name,
          role: employee.role,
          status: employee.status,
          permissions,
          loginTime: Date.now(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function adminRefresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.adminRefreshToken || req.body?.refreshToken;
    if (!rawToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Refresh token required.',
        },
      });
      return;
    }

    try {
      const { accessToken, newRefreshToken, payload } = await rotateRefreshToken(rawToken);
      res.cookie('adminRefreshToken', newRefreshToken, getRefreshTokenCookieOptions(7));

      res.status(200).json({
        success: true,
        data: {
          accessToken,
          payload,
        },
      });
    } catch (err: any) {
      res.clearCookie('adminRefreshToken', { path: '/' });
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Session has expired or token is invalid. Please log in again.',
        },
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function adminLogout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.adminRefreshToken || req.body?.refreshToken;
    if (rawToken) {
      await revokeRefreshToken(rawToken);
    }
    res.clearCookie('adminRefreshToken', { path: '/' });
    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully.' },
    });
  } catch (error) {
    next(error);
  }
}

export async function adminMe(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    data: req.user,
  });
}

// ── Public User Auth Controllers ───────────────────────────────────────────────

const publicRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

export async function publicRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = publicRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0]?.message || 'Invalid input data',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const { email, name, password, phone } = parsed.data;
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email address already exists.',
        },
      });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash,
        phone,
      },
    });

    const tokenPayload = {
      id: user.id,
      role: 'User',
      type: 'public' as const,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken({ userId: user.id });

    res.cookie('publicRefreshToken', refreshToken, getRefreshTokenCookieOptions(30));

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

const publicLoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function publicLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = publicLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0]?.message || 'Invalid input data',
        },
      });
      return;
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
      return;
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
      return;
    }

    const tokenPayload = {
      id: user.id,
      role: 'User',
      type: 'public' as const,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken({ userId: user.id });

    res.cookie('publicRefreshToken', refreshToken, getRefreshTokenCookieOptions(30));

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function publicRefresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.publicRefreshToken || req.body?.refreshToken;
    if (!rawToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Refresh token required.',
        },
      });
      return;
    }

    try {
      const { accessToken, newRefreshToken, payload } = await rotateRefreshToken(rawToken);
      res.cookie('publicRefreshToken', newRefreshToken, getRefreshTokenCookieOptions(30));

      res.status(200).json({
        success: true,
        data: {
          accessToken,
          payload,
        },
      });
    } catch (err: any) {
      res.clearCookie('publicRefreshToken', { path: '/' });
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Session has expired or token is invalid. Please log in again.',
        },
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function publicLogout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.publicRefreshToken || req.body?.refreshToken;
    if (rawToken) {
      await revokeRefreshToken(rawToken);
    }
    res.clearCookie('publicRefreshToken', { path: '/' });
    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully.' },
    });
  } catch (error) {
    next(error);
  }
}

export async function publicMe(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    data: req.user,
  });
}
