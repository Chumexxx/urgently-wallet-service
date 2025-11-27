import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest } from '../../middlewares/authMiddleware';

jest.mock('jsonwebtoken');

describe('Auth Middleware Unit Tests', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined,
    };
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
    
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('authenticate', () => {
    it('should authenticate successfully with valid token', async () => {
      const mockDecoded = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token-here',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
      });
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should call next with error if no authorization header', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'No authorization header provided',
        })
      );
    });

    it('should call next with error if authorization header does not start with Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Basic some-token',
      };

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid authorization format. Use: Bearer <token>',
        })
      );
    });

    it('should call next with error if token is empty', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'No token provided',
        })
      );
    });

    it('should call next with error if token is expired', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw expiredError;
      });

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Token has expired. Please login again',
        })
      );
    });

    it('should call next with error if token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      const invalidError = new Error('Invalid token');
      invalidError.name = 'JsonWebTokenError';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw invalidError;
      });

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid token',
        })
      );
    });

    it('should call next with generic error for other JWT errors', async () => {
      mockRequest.headers = {
        authorization: 'Bearer some-token',
      };

      const otherError = new Error('Some other JWT error');
      otherError.name = 'SomeOtherError';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw otherError;
      });

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Token verification failed',
        })
      );
    });

    it('should use JWT_SECRET from environment', async () => {
      process.env.JWT_SECRET = 'custom-secret';
      
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwt.verify as jest.Mock).mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
      });

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'custom-secret');
    });

    it('should use default secret if JWT_SECRET not set', async () => {
      delete process.env.JWT_SECRET;
      
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwt.verify as jest.Mock).mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
      });

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'your-secret-key');
    });

    it('should handle malformed Bearer token format', async () => {
      mockRequest.headers = {
        authorization: 'BearerInvalidFormat',
      };

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid authorization format. Use: Bearer <token>',
        })
      );
    });
  });
});
