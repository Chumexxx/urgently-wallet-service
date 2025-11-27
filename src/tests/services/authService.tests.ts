import AuthService from '../../services/authService';
import UserModel from '../../models/userModel';
import WalletModel from '../../models/walletModel';
import TokenService from '../../utils/generateWebToken';
import db from '../../config/database';
import KarmaService from '../../services/karmaService';

jest.mock('../../models/userModel');
jest.mock('../../models/walletModel');
jest.mock('../../utils/generateWebToken');
jest.mock('../../config/database');
jest.mock('../../services/karmaService');

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserData = {
    email: 'test@example.com',
    password: 'password123',
    first_name: 'John',
    last_name: 'Doe',
    phone: '08012345678',
  };

  const mockLoginData = {
    email: 'test@example.com',
    password: 'password123',
  };

  describe('register', () => {
    const mockUser = { id: '123', ...mockUserData, is_blacklisted: false };
    const mockWallet = { id: 'wallet-123', user_id: '123', balance: 0, currency: 'NGN' };
    const mockToken = 'mock-jwt-token';

    beforeEach(() => {
      (UserModel.existsByEmail as jest.Mock).mockResolvedValue(false);
      (UserModel.existsByPhone as jest.Mock).mockResolvedValue(false);
      (UserModel.hashPassword as jest.Mock).mockResolvedValue('hashed-password');
      (UserModel.create as jest.Mock).mockResolvedValue(mockUser);
      (WalletModel.create as jest.Mock).mockResolvedValue(mockWallet);
      (TokenService.generateToken as jest.Mock).mockReturnValue(mockToken);

      const mockTrx = { commit: jest.fn(), rollback: jest.fn() };
      (db.transaction as jest.Mock).mockImplementation((cb: any) => cb(mockTrx));
    });

    it('should register a new user successfully when Karma check passes', async () => {
      (KarmaService.isAnyIdentityBlacklisted as jest.Mock).mockResolvedValue({
        isBlacklisted: false,
        reasons: [],
      });

      const result = await AuthService.register(mockUserData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.token).toBe(mockToken);
      expect(KarmaService.isAnyIdentityBlacklisted).toHaveBeenCalledWith({
        email: mockUserData.email,
        phone: mockUserData.phone,
      });
      expect(UserModel.create).toHaveBeenCalled();
      expect(WalletModel.create).toHaveBeenCalled();
    });

    it('should BLOCK registration if Karma reports blacklist', async () => {
      (KarmaService.isAnyIdentityBlacklisted as jest.Mock).mockResolvedValue({
        isBlacklisted: true,
        reasons: ['Loan default on previous platform'],
      });

      await expect(AuthService.register(mockUserData)).rejects.toThrow(
        'You cannot be onboarded due to blacklist records'
      );

      expect(UserModel.create).not.toHaveBeenCalled();
      expect(WalletModel.create).not.toHaveBeenCalled();
    });

    it('should BLOCK registration if Karma API fails (fail-secure)', async () => {
      (KarmaService.isAnyIdentityBlacklisted as jest.Mock).mockRejectedValue(
        new Error('Network timeout')
      );

      await expect(AuthService.register(mockUserData)).rejects.toThrow(
        'Unable to verify your information at this time'
      );

      expect(UserModel.create).not.toHaveBeenCalled();
    });

    it('should throw conflict error if email already exists', async () => {
      (UserModel.existsByEmail as jest.Mock).mockResolvedValue(true);

      await expect(AuthService.register(mockUserData)).rejects.toThrow(
        'User with this email or phone already exists'
      );
    });

    it('should throw conflict error if phone already exists', async () => {
      (UserModel.existsByPhone as jest.Mock).mockResolvedValue(true);

      await expect(AuthService.register(mockUserData)).rejects.toThrow(
        'User with this email or phone already exists'
      );
    });
  });

  describe('login', () => {
    const mockUser = {
      id: '123',
      email: mockLoginData.email,
      password: 'hashed-password',
      first_name: 'John',
      last_name: 'Doe',
      phone: '08012345678',
      is_blacklisted: false,
    };

    beforeEach(() => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.verifyPassword as jest.Mock).mockResolvedValue(true);
      (TokenService.generateToken as jest.Mock).mockReturnValue('mock-jwt-token');
    });

    it('should login successfully when Karma check passes', async () => {
      (KarmaService.isAnyIdentityBlacklisted as jest.Mock).mockResolvedValue({
        isBlacklisted: false,
        reasons: [],
      });

      const result = await AuthService.login(mockLoginData);

      expect(result).toHaveProperty('token');
      expect(KarmaService.isAnyIdentityBlacklisted).toHaveBeenCalledWith({
        email: mockUser.email,
        phone: mockUser.phone,
      });
      expect(UserModel.updateBlacklistStatus).not.toHaveBeenCalled();
    });

    it('should BLOCK login and blacklist user if Karma reports blacklist now', async () => {
      (KarmaService.isAnyIdentityBlacklisted as jest.Mock).mockResolvedValue({
        isBlacklisted: true,
        reasons: ['Fraudulent activity detected'],
      });

      await expect(AuthService.login(mockLoginData)).rejects.toThrow(
        'Your account has been restricted'
      );

      expect(UserModel.updateBlacklistStatus).toHaveBeenCalledWith('123', true);
    });

    it('should still allow login if Karma API is down (fail-safe on login)', async () => {
      (KarmaService.isAnyIdentityBlacklisted as jest.Mock).mockRejectedValue(
        new Error('Karma service unavailable')
      );

      const result = await AuthService.login(mockLoginData);

      expect(result).toHaveProperty('token');
      expect(UserModel.updateBlacklistStatus).not.toHaveBeenCalled();
    });

    it('should throw forbidden if user is already blacklisted in DB', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        ...mockUser,
        is_blacklisted: true,
      });

      await expect(AuthService.login(mockLoginData)).rejects.toThrow(
        'Your account has been restricted'
      );
    });

    it('should throw unauthorized if password is incorrect', async () => {
      (UserModel.verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(AuthService.login(mockLoginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw unauthorized if user not found', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.login(mockLoginData)).rejects.toThrow('Invalid credentials');
    });
  });
});