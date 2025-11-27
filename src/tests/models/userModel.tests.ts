import UserModel from '../../models/userModel';
import db from '../../config/database';

jest.mock('../../config/database', () => {
  const mockQueryBuilder = {
    insert: jest.fn(),
    where: jest.fn(),
    update: jest.fn(),
    first: jest.fn(),
    mockReturnThis: () => mockQueryBuilder,
  };

  const mockKnex = jest.fn((tableName: string) => {
    return mockQueryBuilder;
  });

  return mockKnex;
});

const mockDb = db as jest.Mocked<any>;

describe('UserModel Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashed123',
        first_name: 'John',
        last_name: 'Doe',
        phone: '08012345678',
      };

      const createdUser = {
        id: 'user-123',
        ...userData,
        is_blacklisted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb('users').insert.mockResolvedValue(['user-123']);
      mockDb('users').where.mockReturnThis();
      mockDb('users').first.mockResolvedValue(createdUser);

      const result = await UserModel.create(userData);

      expect(mockDb('users').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          is_blacklisted: false,
        })
      );
      expect(result).toEqual(createdUser);
    });

    it('should set is_blacklisted to false by default', async () => {
      mockDb('users').insert.mockResolvedValue(['user-123']);
      mockDb('users').where.mockReturnThis();
      mockDb('users').first.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        is_blacklisted: false,
      });

      await UserModel.create({
        email: 'test@example.com',
        password: 'pass',
        first_name: 'A',
        last_name: 'B',
        phone: '08012345678',
      });

      expect(mockDb('users').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          is_blacklisted: false,
        })
      );
    });

    it('should throw error if user creation fails', async () => {
      mockDb('users').insert.mockResolvedValue(['user-123']);
      mockDb('users').where.mockReturnThis();
      mockDb('users').first.mockResolvedValue(null); // Not found after insert

      await expect(
        UserModel.create({
          email: 'test@example.com',
          password: 'pass',
          first_name: 'John',
          last_name: 'Doe',
          phone: '08012345678',
        })
      ).rejects.toThrow('Failed to create user');
    });
  });

  describe('existsByEmail', () => {
    it('should return true if email exists', async () => {
      mockDb('users').where.mockReturnThis();
      mockDb('users').first.mockResolvedValue({ email: 'test@example.com' });

      const result = await UserModel.existsByEmail('test@example.com');
      expect(result).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      mockDb('users').where.mockReturnThis();
      mockDb('users').first.mockResolvedValue(null);

      const result = await UserModel.existsByEmail('nope@example.com');
      expect(result).toBe(false);
    });
  });

  describe('existsByPhone', () => {
    it('should return true if phone exists', async () => {
      mockDb('users').where.mockReturnThis();
      mockDb('users').first.mockResolvedValue({ phone: '08012345678' });

      const result = await UserModel.existsByPhone('08012345678');
      expect(result).toBe(true);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const user = { id: '123', email: 'test@example.com' };
      mockDb('users').where.mockReturnThis();
      mockDb('users').first.mockResolvedValue(user);

      const result = await UserModel.findByEmail('test@example.com');
      expect(result).toEqual(user);
    });

    it('should return null if not found', async () => {
      mockDb('users').where.mockReturnThis();
      mockDb('users').first.mockResolvedValue(null);

      const result = await UserModel.findByEmail('gone@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const user = { id: '123' };
      mockDb('users').where.mockReturnThis();
      mockDb('users').first.mockResolvedValue(user);

      const result = await UserModel.findById('123');
      expect(result).toEqual(user);
    });
  });

  describe('updateBlacklistStatus', () => {
    it('should update blacklist status', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(1);
      mockDb('users').where.mockReturnThis();
      mockDb('users').update = mockUpdate;

      await UserModel.updateBlacklistStatus('user-123', true);

      expect(mockUpdate).toHaveBeenCalledWith({ is_blacklisted: true });
    });
  });

  // These use real bcrypt — keep them (they pass)
  describe('verifyPassword & hashPassword', () => {
    it('should hash and verify correctly', async () => {
      const password = 'MyStrongPass123!';
      const hash = await UserModel.hashPassword(password);

      expect(await UserModel.verifyPassword(password, hash)).toBe(true);
      expect(await UserModel.verifyPassword('wrong', hash)).toBe(false);
    });
  });
});