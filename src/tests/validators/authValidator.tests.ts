import { registerSchema, loginSchema } from '../../validators/authValidator';

describe('Auth Validator Unit Tests', () => {
  describe('registerSchema', () => {
    const validData = {
      email: 'test@example.com',
      password: 'password123',
      first_name: 'John',
      last_name: 'Doe',
      phone: '08012345678',
    };

    describe('Valid Data', () => {
      it('should validate correct registration data', () => {
        const { error, value } = registerSchema.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual(validData);
      });

      it('should accept 10-digit phone number', () => {
        const data = { ...validData, phone: '0801234567' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeUndefined();
      });

      it('should accept 15-digit phone number', () => {
        const data = { ...validData, phone: '080123456789012' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeUndefined();
      });

      it('should accept minimum 2 character names', () => {
        const data = { ...validData, first_name: 'Al', last_name: 'Bo' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeUndefined();
      });

      it('should accept minimum 6 character password', () => {
        const data = { ...validData, password: '123456' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeUndefined();
      });
    });

    describe('Email Validation', () => {
      it('should fail with invalid email format', () => {
        const data = { ...validData, email: 'invalid-email' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Please provide a valid email');
      });

      it('should fail with missing email', () => {
        const data: any = { ...validData };
        delete data.email;
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Email is required');
      });

      it('should fail with empty email', () => {
        const data = { ...validData, email: '' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
      });
    });

    describe('Password Validation', () => {
      it('should fail with password less than 6 characters', () => {
        const data = { ...validData, password: '12345' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Password must be at least 6 characters');
      });

      it('should fail with missing password', () => {
        const data: any = { ...validData };
        delete data.password;
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Password is required');
      });

      it('should fail with empty password', () => {
        const data = { ...validData, password: '' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
      });
    });

    describe('First Name Validation', () => {
      it('should fail with first name less than 2 characters', () => {
        const data = { ...validData, first_name: 'A' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('First name must be at least 2 characters');
      });

      it('should fail with missing first name', () => {
        const data: any = { ...validData };
        delete data.first_name;
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('First name is required');
      });

      it('should fail with empty first name', () => {
        const data = { ...validData, first_name: '' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
      });
    });

    describe('Last Name Validation', () => {
      it('should fail with last name less than 2 characters', () => {
        const data = { ...validData, last_name: 'D' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Last name must be at least 2 characters');
      });

      it('should fail with missing last name', () => {
        const data: any = { ...validData };
        delete data.last_name;
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Last name is required');
      });

      it('should fail with empty last name', () => {
        const data = { ...validData, last_name: '' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
      });
    });

    describe(' Phone Validation', () => {
      it('should fail with phone less than 10 digits', () => {
        const data = { ...validData, phone: '123456789' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Please provide a valid phone number');
      });

      it('should fail with phone more than 15 digits', () => {
        const data = { ...validData, phone: '1234567890123456' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Please provide a valid phone number');
      });

      it('should fail with phone containing non-numeric characters', () => {
        const data = { ...validData, phone: '080-1234-5678' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Please provide a valid phone number');
      });

      it('should fail with phone containing letters', () => {
        const data = { ...validData, phone: '080123456ab' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should fail with missing phone', () => {
        const data: any = { ...validData };
        delete data.phone;
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Phone number is required');
      });

      it('should fail with empty phone', () => {
        const data = { ...validData, phone: '' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should fail with phone containing spaces', () => {
        const data = { ...validData, phone: '0801 234 5678' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should fail with phone containing special characters', () => {
        const data = { ...validData, phone: '+2348012345678' };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
      });
    });

    describe('Edge Cases', () => {
      it('should fail with all fields missing', () => {
        const { error } = registerSchema.validate({});

        expect(error).toBeDefined();
        expect(error?.details.length).toBeGreaterThan(0);
      });

      it('should report all validation errors', () => {
        const invalidData = {
          email: 'invalid-email',
          password: '123',
          first_name: 'A',
          last_name: 'B',
          phone: '123',
        };
        const { error } = registerSchema.validate(invalidData, { abortEarly: false });

        expect(error).toBeDefined();
        expect(error?.details.length).toBe(5);
      });

      it('should handle null values', () => {
        const data = {
          email: null,
          password: null,
          first_name: null,
          last_name: null,
          phone: null,
        };
        const { error } = registerSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should reject extra unknown fields with stripUnknown', () => {
        const data = {
          ...validData,
          unknownField: 'should be removed',
        };
        const { error, value } = registerSchema.validate(data, { stripUnknown: true });

        expect(error).toBeUndefined();
        expect(value.unknownField).toBeUndefined();
      });
    });
  });

  describe('loginSchema', () => {
    const validData = {
      email: 'test@example.com',
      password: 'password123',
    };

    describe('Valid Data', () => {
      it('should validate correct login data', () => {
        const { error, value } = loginSchema.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual(validData);
      });

      it('should accept any password length', () => {
        const data = { ...validData, password: '12' };
        const { error } = loginSchema.validate(data);

        expect(error).toBeUndefined();
      });

      it('should accept various email formats', () => {
        const emails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.co.uk',
        ];

        emails.forEach(email => {
          const { error } = loginSchema.validate({ ...validData, email });
          expect(error).toBeUndefined();
        });
      });
    });

    describe('Email Validation', () => {
      it('should fail with invalid email format', () => {
        const data = { ...validData, email: 'invalid-email' };
        const { error } = loginSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Please provide a valid email');
      });

      it('should fail with missing email', () => {
        const data = { password: 'password123' };
        const { error } = loginSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Email is required');
      });

      it('should fail with empty email', () => {
        const data = { ...validData, email: '' };
        const { error } = loginSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should fail with email as number', () => {
        const data = { email: 12345, password: 'password123' };
        const { error } = loginSchema.validate(data);

        expect(error).toBeDefined();
      });
    });

    describe('Password Validation', () => {
      it('should fail with missing password', () => {
        const data = { email: 'test@example.com' };
        const { error } = loginSchema.validate(data);

        expect(error).toBeDefined();
        expect(error?.details[0].message).toBe('Password is required');
      });

      it('should fail with empty password', () => {
        const data = { ...validData, password: '' };
        const { error } = loginSchema.validate(data);

        expect(error).toBeDefined();
      });

      it('should fail with password as number', () => {
        const data = { email: 'test@example.com', password: 123456 };
        const { error } = loginSchema.validate(data);

        expect(error).toBeDefined();
      });
    });

    describe('Edge Cases', () => {
      it('should fail with all fields missing', () => {
        const { error } = loginSchema.validate({});

        expect(error).toBeDefined();
        expect(error?.details.length).toBeGreaterThan(0);
      });

      it('should report all validation errors', () => {
        const invalidData = {
          email: 'invalid-email',
        };
        const { error } = loginSchema.validate(invalidData, { abortEarly: false });

        expect(error).toBeDefined();
        expect(error?.details.length).toBe(2);
      });

      it('should handle null values', () => {
        const data = { email: null, password: null };
        const { error } = loginSchema.validate(data);

        expect(error).toBeDefined();
      });
    });
  });
});