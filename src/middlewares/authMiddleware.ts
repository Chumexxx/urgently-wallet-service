import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError';
import { JwtPayload } from '../types';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw ApiError.unauthorized('No authorization header provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Invalid authorization format. Use: Bearer <token>');
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw ApiError.unauthorized('No token provided');
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

      // Attach user info to request object
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };

      // Continue to next middleware
      next();
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token has expired. Please login again');
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw ApiError.unauthorized('Invalid token');
      } else {
        throw ApiError.unauthorized('Token verification failed');
      }
    }
  } catch (error) {
    next(error);
  }
};