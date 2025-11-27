import WalletService from '../../services/walletService';
import WalletModel from '../../models/walletModel';
import UserModel from '../../models/userModel';
import TransactionModel from '../../models/transactionModel';
import db from '../../config/database';

jest.mock('../../models/walletModel');
jest.mock('../../models/userModel');
jest.mock('../../models/transactionModel');
jest.mock('../../config/database');

describe('WalletService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWalletBalance', () => {
    it('should return wallet balance', async () => {
      const mockWallet = {
        id: 'wallet-123',
        user_id: 'user-123',
        balance: 5000,
        currency: 'NGN',
      };

      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(mockWallet);

      const result = await WalletService.getWalletBalance('user-123');

      expect(result.balance).toBe(5000);
      expect(result.currency).toBe('NGN');
      expect(result.wallet_id).toBe('wallet-123');
    });

    it('should throw not found error if wallet does not exist', async () => {
      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(null);

      await expect(WalletService.getWalletBalance('user-123')).rejects.toThrow('Wallet not found');
    });
  });

  describe('fundWallet', () => {
    const mockWallet = {
      id: 'wallet-123',
      user_id: 'user-123',
      balance: 1000,
      currency: 'NGN',
    };

    it('should fund wallet successfully', async () => {
      const mockTransaction = {
        id: 'txn-123',
        reference: 'TXN-ref-123',
        wallet_id: 'wallet-123',
        type: 'credit',
        category: 'funding',
        amount: 5000,
        balance_before: 1000,
        balance_after: 6000,
      };

      const mockTrx = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
      };

      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
      (db.transaction as jest.Mock).mockResolvedValue(mockTrx);
      (WalletModel.getBalanceForUpdate as jest.Mock).mockResolvedValue(1000);
      (WalletModel.updateBalance as jest.Mock).mockResolvedValue(undefined);
      (TransactionModel.create as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await WalletService.fundWallet('user-123', { amount: 5000 });

      expect(result.message).toBe('Wallet funded successfully');
      expect(result.transaction.amount).toBe(5000);
      expect(result.transaction.balance).toBe(6000);
      expect(mockTrx.commit).toHaveBeenCalled();
    });

    it('should throw bad request error for zero amount', async () => {
      await expect(WalletService.fundWallet('user-123', { amount: 0 })).rejects.toThrow('Amount must be greater than zero');
    });

    it('should throw bad request error for negative amount', async () => {
      await expect(WalletService.fundWallet('user-123', { amount: -100 })).rejects.toThrow('Amount must be greater than zero');
    });

    it('should rollback transaction on error', async () => {
      const mockTrx = {
        commit: jest.fn(),
        rollback: jest.fn().mockResolvedValue(undefined),
      };

      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
      (db.transaction as jest.Mock).mockResolvedValue(mockTrx);
      (WalletModel.getBalanceForUpdate as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(WalletService.fundWallet('user-123', { amount: 5000 })).rejects.toThrow();
    });
  });

  describe('transferFunds', () => {
    const mockSenderWallet = {
      id: 'wallet-sender',
      user_id: 'user-sender',
      balance: 10000,
      currency: 'NGN',
    };

    const mockRecipientWallet = {
      id: 'wallet-recipient',
      user_id: 'user-recipient',
      balance: 2000,
      currency: 'NGN',
    };

    const mockRecipient = {
      id: 'user-recipient',
      email: 'recipient@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
    };

    it('should transfer funds successfully', async () => {
      const mockTrx = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
      };

      (WalletModel.findByUserId as jest.Mock)
        .mockResolvedValueOnce(mockSenderWallet)
        .mockResolvedValueOnce(mockRecipientWallet);
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockRecipient);
      (db.transaction as jest.Mock).mockResolvedValue(mockTrx);
      (WalletModel.getBalanceForUpdate as jest.Mock)
        .mockResolvedValueOnce(10000)
        .mockResolvedValueOnce(2000);
      (WalletModel.updateBalance as jest.Mock).mockResolvedValue(undefined);
      (TransactionModel.create as jest.Mock).mockResolvedValue({
        reference: 'TXN-ref-123',
        amount: 5000,
      });

      const result = await WalletService.transferFunds('user-sender', {
        recipient_email: 'recipient@example.com',
        amount: 5000,
      });

      expect(result.message).toBe('Transfer successful');
      expect(result.transaction.amount).toBe(5000);
      expect(result.transaction.balance).toBe(5000);
      expect(mockTrx.commit).toHaveBeenCalled();
    });

    it('should throw error for insufficient balance', async () => {
      const mockTrx = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
      };
      (db.transaction as jest.Mock).mockImplementation((callback: any) => callback(mockTrx));

      (WalletModel.findByUserId as jest.Mock)
        .mockResolvedValueOnce(mockSenderWallet)
        .mockResolvedValueOnce(mockRecipientWallet);
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockRecipient);
      (db.transaction as jest.Mock).mockResolvedValue(mockTrx);
      (WalletModel.getBalanceForUpdate as jest.Mock).mockResolvedValueOnce(1000);

      await expect(
        WalletService.transferFunds('user-sender', {
          recipient_email: 'recipient@example.com',
          amount: 5000,
        })
      ).rejects.toThrow('Insufficient balance');
    });

    it('should throw error for non-existent recipient', async () => {
      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(mockSenderWallet);
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        WalletService.transferFunds('user-sender', {
          recipient_email: 'nonexistent@example.com',
          amount: 5000,
        })
      ).rejects.toThrow('Recipient not found');
    });

    it('should throw error for self-transfer', async () => {
      const selfRecipient = { ...mockRecipient, id: 'user-sender' };

      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(mockSenderWallet);
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(selfRecipient);

      await expect(
        WalletService.transferFunds('user-sender', {
          recipient_email: 'self@example.com',
          amount: 5000,
        })
      ).rejects.toThrow('Cannot transfer to yourself');
    });
  });

  describe('withdrawFunds', () => {
    const mockWallet = {
      id: 'wallet-123',
      user_id: 'user-123',
      balance: 10000,
      currency: 'NGN',
    };

    it('should withdraw funds successfully', async () => {
      const mockTrx = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
      };

      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
      (db.transaction as jest.Mock).mockResolvedValue(mockTrx);
      (WalletModel.getBalanceForUpdate as jest.Mock).mockResolvedValue(10000);
      (WalletModel.updateBalance as jest.Mock).mockResolvedValue(undefined);
      (TransactionModel.create as jest.Mock).mockResolvedValue({
        reference: 'TXN-ref-123',
        amount: 3000,
        type: 'debit',
        category: 'withdrawal',
      });

      const result = await WalletService.withdrawFunds('user-123', {
        amount: 3000,
      });

      expect(result.message).toBe('Withdrawal successful');
      expect(result.transaction.amount).toBe(3000);
      expect(result.transaction.balance).toBe(7000);
    });

    it('should throw error for insufficient balance', async () => {
      const mockTrx = {
        commit: jest.fn(),
        rollback: jest.fn().mockResolvedValue(undefined),
      };

      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
      (db.transaction as jest.Mock).mockResolvedValue(mockTrx);
      (WalletModel.getBalanceForUpdate as jest.Mock).mockResolvedValue(1000);

      await expect(
        WalletService.withdrawFunds('user-123', { amount: 5000 })
      ).rejects.toThrow('Insufficient balance');
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history', async () => {
      const mockWallet = {
        id: 'wallet-123',
        user_id: 'user-123',
      };

      const mockTransactions = [
        {
          id: 'txn-1',
          reference: 'TXN-1',
          type: 'credit',
          category: 'funding',
          amount: 5000,
          balance_before: 0,
          balance_after: 5000,
          description: 'Funding',
          status: 'success',
          created_at: new Date(),
        },
        {
          id: 'txn-2',
          reference: 'TXN-2',
          type: 'debit',
          category: 'withdrawal',
          amount: 1000,
          balance_before: 5000,
          balance_after: 4000,
          description: 'Withdrawal',
          status: 'success',
          created_at: new Date(),
        },
      ];

      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
      (TransactionModel.getTransactionHistory as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await WalletService.getTransactionHistory('user-123', {
        limit: 10,
      });

      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(5000);
      expect(result[1].amount).toBe(1000);
    });

    it('should apply filters correctly', async () => {
      const mockWallet = { id: 'wallet-123', user_id: 'user-123' };

      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
      (TransactionModel.getTransactionHistory as jest.Mock).mockResolvedValue([]);

      await WalletService.getTransactionHistory('user-123', {
        limit: 10,
        type: 'credit',
        category: 'funding',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(TransactionModel.getTransactionHistory).toHaveBeenCalledWith(
        'wallet-123',
        expect.objectContaining({
          type: 'credit',
          category: 'funding',
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );
    });
  });
});