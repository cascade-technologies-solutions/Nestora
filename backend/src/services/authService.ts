import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

export interface TokenPayload {
  id: string;
  role: string;
  type: 'admin' | 'public';
  username?: string;
  email?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_nestora_jwt_access_key_min_32_characters_long!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_nestora_jwt_refresh_key_min_32_characters_long!';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshTokenString(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export async function createRefreshToken(target: { employeeId?: string; userId?: string }): Promise<string> {
  const tokenString = generateRefreshTokenString();
  const tokenHash = hashToken(tokenString);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      employeeId: target.employeeId,
      userId: target.userId,
      expiresAt,
    },
  });

  return tokenString;
}

export async function rotateRefreshToken(oldToken: string): Promise<{ accessToken: string; newRefreshToken: string; payload: TokenPayload }> {
  const tokenHash = hashToken(oldToken);

  const existingToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      employee: {
        include: { permissions: true },
      },
      user: true,
    },
  });

  if (!existingToken) {
    throw new Error('INVALID_TOKEN');
  }

  // Reuse detection: if a revoked token is used, revoke all tokens for this entity for security
  if (existingToken.revokedAt) {
    if (existingToken.employeeId) {
      await prisma.refreshToken.updateMany({
        where: { employeeId: existingToken.employeeId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else if (existingToken.userId) {
      await prisma.refreshToken.updateMany({
        where: { userId: existingToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    throw new Error('REVOKED_TOKEN');
  }

  if (new Date() > existingToken.expiresAt) {
    throw new Error('EXPIRED_TOKEN');
  }

  // Revoke the old token
  await prisma.refreshToken.update({
    where: { id: existingToken.id },
    data: { revokedAt: new Date() },
  });

  let payload: TokenPayload;
  let newRefreshToken: string;

  if (existingToken.employee) {
    if (existingToken.employee.status !== 'Active') {
      throw new Error('ACCOUNT_INACTIVE');
    }
    payload = {
      id: existingToken.employee.id,
      role: existingToken.employee.role,
      type: 'admin',
      username: existingToken.employee.username,
    };
    newRefreshToken = await createRefreshToken({ employeeId: existingToken.employee.id });
  } else if (existingToken.user) {
    payload = {
      id: existingToken.user.id,
      role: 'User',
      type: 'public',
      email: existingToken.user.email,
    };
    newRefreshToken = await createRefreshToken({ userId: existingToken.user.id });
  } else {
    throw new Error('INVALID_TOKEN_SUBJECT');
  }

  const accessToken = generateAccessToken(payload);
  return { accessToken, newRefreshToken, payload };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
