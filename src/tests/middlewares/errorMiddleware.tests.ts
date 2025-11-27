import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler, asyncHandler } from '../../middlewares/errorMiddleware';
import { ApiError } from '../../utils/apiError';

describe('Error Middleware Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      path: '/api/test',
      method: 'GET',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();

    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle ApiError correctly', () => {
      const error = ApiError.badRequest('Invalid input');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid input',
        statusCode: 400,
      });
    });

    it('should include stack trace in development mode for ApiError', () => {
      process.env.NODE_ENV = 'development';
      const error = ApiError.badRequest('Invalid input');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: expect.any(String),
        })
      );
    });

    it('should not include stack trace in production mode for ApiError', () => {
      process.env.NODE_ENV = 'production';
      const error = ApiError.badRequest('Invalid input');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          stack: expect.anything(),
        })
      );
    });

    it('should handle ValidationError', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Validation error',
        statusCode: 400,
        errors: 'Validation failed',
      });
    });

    it('should handle UnauthorizedError', () => {
      const error = new Error('Not authorized');
      error.name = 'UnauthorizedError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('should handle duplicate entry error by name', () => {
      const error = new Error('Duplicate entry');
      error.name = 'ER_DUP_ENTRY';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Duplicate entry',
        statusCode: 409,
      });
    });

    it('should handle duplicate entry error by code', () => {
      const error: any = new Error('Duplicate entry');
      error.code = 'ER_DUP_ENTRY';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Duplicate entry',
        statusCode: 409,
      });
    });

    it('should handle generic error in production mode', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Something went wrong');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
        statusCode: 500,
      });
    });

    it('should handle generic error in development mode with details', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Something went wrong');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Something went wrong',
        statusCode: 500,
        stack: expect.any(String),
      });
    });

    it('should log unexpected errors', () => {
      const error = new Error('Unexpected error');
      const consoleSpy = jest.spyOn(console, 'error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith('Unexpected Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        path: mockRequest.path,
        method: mockRequest.method,
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with proper message', () => {
      mockRequest = {
        method: 'GET',
        path: '/api/nonexistent',
      };

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Route GET /api/nonexistent not found',
        statusCode: 404,
      });
    });

    it('should handle POST request not found', () => {
      mockRequest = {
        method: 'POST',
        path: '/api/missing',
      };

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Route POST /api/missing not found',
        statusCode: 404,
      });
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async function', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch and pass errors to next', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle synchronous errors', async () => {
      const error = new Error('Sync error');
      const asyncFn = jest.fn().mockImplementation(() => {
        throw error;
      });
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});