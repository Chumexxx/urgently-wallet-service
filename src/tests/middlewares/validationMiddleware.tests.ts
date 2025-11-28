import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validate } from '../../middlewares/validationMiddleware';

describe('Validation Middleware Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should pass validation with valid data', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
      });

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should fail validation with invalid email', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
      });

      mockRequest.body = {
        email: 'invalid-email',
      };

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Validation error',
        errors: [
          {
            field: 'email',
            message: expect.stringContaining('valid email'),
          },
        ],
        statusCode: 400,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return all validation errors when abortEarly is false', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        age: Joi.number().min(18).required(),
      });

      mockRequest.body = {
        email: 'invalid-email',
        password: '123',
      };

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'password' }),
          ]),
        })
      );
    });

    it('should strip unknown fields', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
      });

      mockRequest.body = {
        email: 'test@example.com',
        unknownField: 'should be removed',
      };

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({
        email: 'test@example.com',
      });
      expect(mockRequest.body.unknownField).toBeUndefined();
    });

    it('should handle missing required fields', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      });

      mockRequest.body = {
        email: 'test@example.com',
      };

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
              message: expect.stringContaining('required'),
            }),
          ]),
        })
      );
    });

    it('should remove quotes from error messages', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });

      mockRequest.body = {};

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      const errorMessage = jsonCall.errors[0].message;

      expect(errorMessage).not.toContain('"');
    });

    it('should handle nested field validation', () => {
      const schema = Joi.object({
        user: Joi.object({
          name: Joi.string().required(),
          age: Joi.number().required(),
        }).required(),
      });

      mockRequest.body = {
        user: {
          name: '',
        },
      };

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: expect.stringContaining('user'),
            }),
          ]),
        })
      );
    });

    it('should validate number types correctly', () => {
      const schema = Joi.object({
        amount: Joi.number().positive().required(),
      });

      mockRequest.body = {
        amount: -100,
      };

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'amount',
              message: expect.stringContaining('positive'),
            }),
          ]),
        })
      );
    });

    it('should handle complex validation rules', () => {
      const schema = Joi.object({
        email: Joi.string().email().lowercase().required(),
        password: Joi.string().min(8).pattern(/[A-Z]/).pattern(/[0-9]/).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
      });

      mockRequest.body = {
        email: 'TEST@EXAMPLE.COM',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body.email).toBe('test@example.com'); // Lowercased
    });

    it('should update request body with validated value', () => {
      const schema = Joi.object({
        email: Joi.string().email().lowercase().trim().required(),
        amount: Joi.number().default(0),
      });

      mockRequest.body = {
        email: '  TEST@EXAMPLE.COM  ',
      };

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({
        email: 'test@example.com',
        amount: 0,
      });
    });
  });
});