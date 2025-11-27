import jwt, { SignOptions } from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { ApiError } from './apiError';
import dotenv from 'dotenv';
dotenv.config();

class TokenService {
  private static readonly secret = process.env.JWT_SECRET;
  private static readonly expiresIn: string | number = process.env.JWT_EXPIRES_IN || '30m'; 

  private static getSecret(): string {
    if (!this.secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return this.secret;
  }

  static generateToken(payload: JwtPayload): string {
    const secret = this.getSecret();
    
    return jwt.sign(payload, secret, {
      expiresIn: this.expiresIn,
      algorithm: 'HS256',
    } as any);
  }

  static verifyToken(token: string): JwtPayload {
    const secret = this.getSecret();

    try {
      const decoded = jwt.verify(token, secret) as JwtPayload;
      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw ApiError.unauthorized('Invalid token');
      }
      throw ApiError.unauthorized('Token verification failed');
    }
  }
}

export default TokenService;