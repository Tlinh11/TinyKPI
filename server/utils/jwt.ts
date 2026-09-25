import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: TokenPayload, expiresIn = '7d'): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
