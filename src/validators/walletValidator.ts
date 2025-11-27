import Joi from 'joi';

export const fundWalletSchema = Joi.object({
  amount: Joi.number().strict().positive().required().messages({
    'number.positive': 'Amount must be greater than zero',
    'any.required': 'Amount is required',
    'number.base': 'Amount must be a number',
  }),
});

export const transferSchema = Joi.object({
  recipient_email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid recipient email',
    'any.required': 'Recipient email is required',
  }),
  amount: Joi.number().strict().positive().required().messages({
    'number.positive': 'Amount must be greater than zero',
    'any.required': 'Amount is required',
    'number.base': 'Amount must be a number',
  }),
  description: Joi.string().max(255).allow('').optional(),
});

export const withdrawSchema = Joi.object({
  amount: Joi.number().strict().positive().required().messages({
    'number.positive': 'Amount must be greater than zero',
    'any.required': 'Amount is required',
    'number.base': 'Amount must be a number',
  }),
  description: Joi.string().max(255).allow('').optional(),
});