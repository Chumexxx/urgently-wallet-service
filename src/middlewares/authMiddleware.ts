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

//This middleware protects the route to authenticate all requests.  
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw ApiError.unauthorized('No authorization header provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Invalid authorization format. Use: Bearer <token>');
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw ApiError.unauthorized('No token provided');
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

      req.user = { userId: decoded.userId, email: decoded.email};

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