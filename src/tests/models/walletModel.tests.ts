import WalletModel from '../../models/walletModel';
import db from '../../config/database';

// Correct Knex mock: db('wallets') returns a query builder
jest.mock('../../config/database', () => {
  const mockQueryBuilder = {
    insert: jest.fn(),
    where: jest.fn(),
    update: jest.fn(),
    forUpdate: jest.fn(),
    first: jest.fn(),
    mockReturnThis: () => mockQueryBuilder,
  };

  const mockKnex = jest.fn((tableName: string) => {
    return mockQueryBuilder;
  }) as any;

  // Support db.fn.now()
  mockKnex.fn = {
    now: jest.fn(() => 'NOW()'),
  };

  return mockKnex;
});

const mockDb = db as jest.Mocked<any>;

describe('WalletModel Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new wallet successfully', async () => {
      const walletData = { user_id: 'user-123' };
      const mockWallet = {
        id: 'wallet-123',
        user_id: 'user-123',
        balance: 0,
        currency: 'NGN',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb('wallets').insert.mockResolvedValue(['wallet-123']);
      mockDb('wallets').where.mockReturnThis();
      mockDb('wallets').first.mockResolvedValue(mockWallet);

      const result = await WalletModel.create(walletData);

      expect(mockDb('wallets').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          balance: 0,
          currency: 'NGN',
        })
      );
      expect(result).toEqual(mockWallet);
    });

    it('should use default values for balance and currency', async () => {
      mockDb('wallets').insert.mockResolvedValue(['wallet-123']);
      mockDb('wallets').where.mockReturnThis();
      mockDb('wallets').first.mockResolvedValue({
        id: 'wallet-123',
        user_id: 'user-123',
        balance: 0,
        currency: 'NGN',
      });

      await WalletModel.create({ user_id: 'user-123' });

      expect(mockDb('wallets').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 0,
          currency: 'NGN',
        })
      );
    });

    it('should throw error if wallet creation fails', async () => {
      mockDb('wallets').insert.mockResolvedValue(['wallet-123']);
      mockDb('wallets').where.mockReturnThis();
      mockDb('wallets').first.mockResolvedValue(null);

      await expect(
        WalletModel.create({ user_id: 'user-123' })
      ).rejects.toThrow('Failed to create wallet');
    });
  });

  describe('findById', () => {
    it('should find wallet by id', async () => {
      const mockWallet = { id: 'wallet-123', balance: 5000 };
      mockDb('wallets').where.mockReturnThis();
      mockDb('wallets').first.mockResolvedValue(mockWallet);

      const result = await WalletModel.findById('wallet-123');
      expect(result).toEqual(mockWallet);
    });

    it('should return null if not found', async () => {
      mockDb('wallets').where.mockReturnThis();
      mockDb('wallets').first.mockResolvedValue(null);

      const result = await WalletModel.findById('bad');
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find wallet by user id', async () => {
      const mockWallet = { id: 'wallet-123' };
      mockDb('wallets').where.mockReturnThis();
      mockDb('wallets').first.mockResolvedValue(mockWallet);

      const result = await WalletModel.findByUserId('user-123');
      expect(result).toEqual(mockWallet);
    });
  });

  describe('updateBalance', () => {
    it('should update wallet balance successfully', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(1);
      mockDb('wallets').where.mockReturnThis();
      mockDb('wallets').update = mockUpdate;

      await WalletModel.updateBalance('wallet-123', 10000);

      expect(mockUpdate).toHaveBeenCalledWith({
        balance: 10000,
        updated_at: 'NOW()',
      });
    });

    it('should throw error if wallet not found', async () => {
      mockDb('wallets').where.mockReturnThis();
      mockDb('wallets').update = jest.fn().mockResolvedValue(0);

      await expect(
        WalletModel.updateBalance('bad-wallet', 100)
      ).rejects.toThrow('Wallet not found or balance update failed');
    });
  });

  describe('getBalanceForUpdate', () => {
    it('should get balance with row lock', async () => {
      const mockWallet = { balance: '5000.00' };

      const mockTrx = {
        where: jest.fn().mockReturnThis(),
        forUpdate: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockWallet),
      };

      const result = await WalletModel.getBalanceForUpdate('wallet-123', mockTrx as any);

      expect(result).toBe(5000);
      expect(mockTrx.where).toHaveBeenCalledWith({ id: 'wallet-123' });
      expect(mockTrx.forUpdate).toHaveBeenCalled();
    });

    it('should return 0 if wallet not found', async () => {
      const mockTrx = {
        where: jest.fn().mockReturnThis(),
        forUpdate: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      };

      const result = await WalletModel.getBalanceForUpdate('bad', mockTrx as any);
      expect(result).toBe(0);
    });
  });
});