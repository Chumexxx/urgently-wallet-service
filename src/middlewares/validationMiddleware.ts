import { Request, Response, NextFunction } from 'express';
import {Schema} from 'joi';

export const validate = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''), // Remove quotes from message
      }));

      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors,
        statusCode: 400,
      });
    }
    req.body = value;
    next();
  };
};

