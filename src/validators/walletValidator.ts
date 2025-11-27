import Joi from 'joi';

export const fundWalletSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be greater than zero',
    'any.required': 'Amount is required',
  }),
});

export const transferSchema = Joi.object({
  recipient_email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid recipient email',
    'any.required': 'Recipient email is required',
  }),
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be greater than zero',
    'any.required': 'Amount is required',
  }),
  description: Joi.string().max(255).optional(),
});

export const withdrawSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be greater than zero',
    'any.required': 'Amount is required',
  }),
  description: Joi.string().max(255).optional(),
});