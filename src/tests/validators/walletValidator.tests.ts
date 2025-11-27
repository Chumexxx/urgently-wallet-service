import {fundWalletSchema, transferSchema, withdrawSchema} from '../../validators/walletValidator';

describe('Wallet Validator Unit Tests', () => {
  describe('fundWalletSchema', () => {
    describe('Valid Data', () => {
      it('should validate correct fund wallet data', () => {
        const data = { amount: 1000 };
        const { error, value } = fundWalletSchema.validate(data);

        expect(error).toBeUndefined();
        expect(value).toEqual(data);
      });

      it('should accept decimal amounts with 2 precision', () => {
        const data = { amount: 1000.50 };
        const { error } = fundWalletSchema.validate(data);

        expect(error).toBeUndefined();
      });

      it('should accept small positive amounts', () => {
        const data = { amount: 0.01 };
        const { error } = fundWalletSchema.validate(data);

        expect(error).toBeUndefined();
      });

      it('should accept large amounts', () => {
        const data = { amount: 1000000 };
        const { error } = fundWalletSchema.validate(data);

        expect(error).toBeUndefined();
      });

      it('should accept integer amounts', () => {
        const data = { amount: 5000 };
        const { error } = fundWalletSchema.validate(data);

        expect(error).toBeUndefined();
      });
    });

    describe('Amount Validation', () => {
      it('should fail with zero amount', () => {
        const data = { amount: 0 };
        const { error } = fundWalletSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Amount must be greater than zero');
      });

      it('should fail with negative amount', () => {
        const data = { amount: -100 };
        const { error } = fundWalletSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Amount must be greater than zero');
      });

      it('should fail with missing amount', () => {
        const data = {};
        const { error } = fundWalletSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Amount is required');
      });

      it('should fail with amount as string', () => {
        const data = { amount: '1000' };
        const { error } = fundWalletSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should fail with amount as null', () => {
        const data = { amount: null };
        const { error } = fundWalletSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should fail with amount as undefined', () => {
        const data = { amount: undefined };
        const { error } = fundWalletSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should fail with non-numeric amount', () => {
        const data = { amount: 'abc' };
        const { error } = fundWalletSchema.validate(data);

        expect(error).toBeDefined();
      });
    });

    describe('Edge Cases', () => {
      it('should handle very small positive amounts', () => {
        const data = { amount: 0.001 };
        const { error } = fundWalletSchema.validate(data);

        expect(error).toBeUndefined();
      });

      it('should reject extra fields with stripUnknown', () => {
        const data = { amount: 1000, extraField: 'remove me' };
        const { error, value } = fundWalletSchema.validate(data, { stripUnknown: true });

        expect(error).toBeUndefined();
        expect(value.extraField).toBeUndefined();
      });
    });
  });

  describe('transferSchema', () => {
    const validData = {
      recipient_email: 'recipient@example.com',
      amount: 1000,
      description: 'Payment for services',
    };

    describe('Valid Data', () => {
      it('should validate correct transfer data', () => {
        const { error, value } = transferSchema.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual(validData);
      });

      it('should validate transfer without description', () => {
        const data = {
          recipient_email: 'recipient@example.com',
          amount: 1000,
        };
        const { error } = transferSchema.validate(data);

        expect(error).toBeUndefined();
      });

      it('should accept decimal amounts', () => {
        const data = { ...validData, amount: 1000.99 };
        const { error } = transferSchema.validate(data);

        expect(error).toBeUndefined();
      });

      it('should accept empty description', () => {
        const data = { ...validData, description: '' };
        const { error } = transferSchema.validate(data);

        expect(error).toBeUndefined();
      });

      it('should accept description up to 255 characters', () => {
        const data = { ...validData, description: 'a'.repeat(255) };
        const { error } = transferSchema.validate(data);

        expect(error).toBeUndefined();
      });
    });

    describe('Recipient Email Validation', () => {
      it('should fail with invalid recipient email', () => {
        const data = { ...validData, recipient_email: 'invalid-email' };
        const { error } = transferSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Please provide a valid recipient email');
      });

      it('should fail with missing recipient email', () => {
        const data = { amount: 1000 };
        const { error } = transferSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Recipient email is required');
      });

      it('should fail with empty recipient email', () => {
        const data = { ...validData, recipient_email: '' };
        const { error } = transferSchema.validate(data);

        expect(error).toBeDefined();
      });
    });

    describe('Amount Validation', () => {
      it('should fail with zero amount', () => {
        const data = { ...validData, amount: 0 };
        const { error } = transferSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Amount must be greater than zero');
      });

      it('should fail with negative amount', () => {
        const data = { ...validData, amount: -500 };
        const { error } = transferSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should fail with missing amount', () => {
        const data = { recipient_email: 'recipient@example.com' };
        const { error } = transferSchema.validate(data);

        expect(error).toBeDefined();
      });
    });

    describe('Description Validation', () => {
      it('should fail with description longer than 255 characters', () => {
        const data = { ...validData, description: 'a'.repeat(256) };
        const { error } = transferSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should fail with description as number', () => {
        const data = { ...validData, description: 12345 };
        const { error } = transferSchema.validate(data);

        expect(error).toBeDefined();
      });
    });

    describe('Edge Cases', () => {
      it('should report all validation errors', () => {
        const invalidData = {
          recipient_email: 'invalid',
          amount: -100,
          description: 'a'.repeat(300),
        };
        const { error } = transferSchema.validate(invalidData, { abortEarly: false });

        expect(error).toBeDefined();
        expect(error?.details.length).toBe(3);
      });

      it('should handle null values', () => {
        const data = {
          recipient_email: null,
          amount: null,
          description: null,
        };
        const { error } = transferSchema.validate(data);

        expect(error).toBeDefined();
      });
    });
  });

  describe('withdrawSchema', () => {
    const validData = {
      amount: 5000,
      description: 'ATM withdrawal',
    };

    describe('Valid Data', () => {
      it('should validate correct withdraw data', () => {
        const { error, value } = withdrawSchema.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual(validData);
      });

      it('should validate withdraw without description', () => {
        const data = { amount: 5000 };
        const { error } = withdrawSchema.validate(data);

        expect(error).toBeUndefined();
      });

      it('should accept decimal amounts', () => {
        const data = { ...validData, amount: 2500.75 };
        const { error } = withdrawSchema.validate(data);

        expect(error).toBeUndefined();
      });

      it('should accept description up to 255 characters', () => {
        const data = { ...validData, description: 'a'.repeat(255) };
        const { error } = withdrawSchema.validate(data);

        expect(error).toBeUndefined();
      });
    });

    describe('Amount Validation', () => {
      it('should fail with zero amount', () => {
        const data = { amount: 0 };
        const { error } = withdrawSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Amount must be greater than zero');
      });

      it('should fail with negative amount', () => {
        const data = { amount: -1000 };
        const { error } = withdrawSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should fail with missing amount', () => {
        const data = { description: 'Withdrawal' };
        const { error } = withdrawSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Amount is required');
      });

      it('should fail with amount as string', () => {
        const data = { amount: '5000' };
        const { error } = withdrawSchema.validate(data);

        expect(error).toBeDefined();
      });
    });

    describe('Description Validation', () => {
      it('should fail with description longer than 255 characters', () => {
        const data = { amount: 5000, description: 'a'.repeat(256) };
        const { error } = withdrawSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should fail with description as number', () => {
        const data = { amount: 5000, description: 12345 };
        const { error } = withdrawSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should fail with description as array', () => {
        const data = { amount: 5000, description: ['withdrawal'] };
        const { error } = withdrawSchema.validate(data);

        expect(error).toBeDefined();
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty description as valid', () => {
        const data = { amount: 5000, description: '' };
        const { error } = withdrawSchema.validate(data);

        expect(error).toBeUndefined();
      });

      it('should report all validation errors', () => {
        const invalidData = {
          amount: -100,
          description: 'a'.repeat(300),
        };
        const { error } = withdrawSchema.validate(invalidData, { abortEarly: false });

        expect(error).toBeDefined();
        expect(error?.details.length).toBe(2);
      });

      it('should handle all fields missing', () => {
        const { error } = withdrawSchema.validate({});

        expect(error).toBeDefined();
      });
    });
  });
});