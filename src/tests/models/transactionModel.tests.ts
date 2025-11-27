import TransactionModel from '../../models/transactionModel';
import db from '../../config/database';

// Proper Knex mock: db('table') returns a query builder
jest.mock('../../config/database', () => {
  const mockQueryBuilder = {
    insert: jest.fn(),
    where: jest.fn(),
    update: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
    first: jest.fn(),
    then: jest.fn(),
    // Chainable
    mockReturnThis: () => mockQueryBuilder,
  };

  // db('transactions') → returns mockQueryBuilder
  const mockKnex = jest.fn((tableName: string) => {
    if (tableName === 'transactions') {
      return mockQueryBuilder;
    }
    return mockQueryBuilder;
  }) as jest.Mock & { fn: { now: jest.Mock } };

  // Add fn.now() support
  mockKnex.fn = {
    now: jest.fn(() => 'NOW()'),
  };

  return mockKnex;
});

const mockDb = db as jest.Mocked<any>;

describe('TransactionModel Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new transaction successfully', async () => {
      const transactionData = {
        wallet_id: 'wallet-123',
        type: 'credit' as const,
        category: 'funding' as const,
        amount: 5000,
        balance_before: 0,
        balance_after: 5000,
        description: 'Wallet funding',
      };

      const mockTransaction = {
        id: 'txn-123',
        reference: 'TXN-ref-123',
        ...transactionData,
        status: 'success',
        created_at: new Date(),
      };

      // Mock insert → returns ID
      mockDb('transactions').insert.mockResolvedValue(['txn-123']);

      // Mock SELECT after insert
      mockDb('transactions').where.mockReturnThis();
      mockDb('transactions').first.mockResolvedValue(mockTransaction);

      const result = await TransactionModel.create(transactionData);

      expect(mockDb('transactions').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          wallet_id: 'wallet-123',
          amount: 5000,
          type: 'credit',
          reference: expect.stringContaining('TXN-'),
        })
      );
      expect(result).toEqual(mockTransaction);
    });

    it('should stringify metadata if provided', async () => {
      const metadata = { note: 'Payment to John' };
      const transactionData = {
        wallet_id: 'wallet-123',
        type: 'debit' as const,
        category: 'transfer' as const,
        amount: 1000,
        balance_before: 5000,
        balance_after: 4000,
        metadata,
      };

      mockDb('transactions').insert.mockResolvedValue(['txn-123']);
      mockDb('transactions').where.mockReturnThis();
      mockDb('transactions').first.mockResolvedValue({
        id: 'txn-123',
        metadata: JSON.stringify(metadata),
      });

      await TransactionModel.create(transactionData);

      expect(mockDb('transactions').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: JSON.stringify(metadata),
        })
      );
    });

    it('should throw error if transaction creation fails', async () => {
      mockDb('transactions').insert.mockResolvedValue(['txn-123']);
      mockDb('transactions').where.mockReturnThis();
      mockDb('transactions').first.mockResolvedValue(null); // Not found

      await expect(
        TransactionModel.create({
          wallet_id: 'wallet-123',
          type: 'credit' as const,
          category: 'funding' as const,
          amount: 5000,
          balance_before: 0,
          balance_after: 5000,
        })
      ).rejects.toThrow('Failed to create transaction');
    });
  });

  describe('findById', () => {
    it('should find transaction by id', async () => {
      const mockTx = { id: 'txn-123', amount: 5000 };
      mockDb('transactions').where.mockReturnThis();
      mockDb('transactions').first.mockResolvedValue(mockTx);

      const result = await TransactionModel.findById('txn-123');
      expect(result).toEqual(mockTx);
    });

    it('should return null if not found', async () => {
      mockDb('transactions').where.mockReturnThis();
      mockDb('transactions').first.mockResolvedValue(null);

      const result = await TransactionModel.findById('bad-id');
      expect(result).toBeNull();
    });
  });

  describe('findByReference', () => {
    it('should find by reference', async () => {
      const mockTx = { reference: 'TXN-ref-123' };
      mockDb('transactions').where.mockReturnThis();
      mockDb('transactions').first.mockResolvedValue(mockTx);

      const result = await TransactionModel.findByReference('TXN-ref-123');
      expect(result).toEqual(mockTx);
    });
  });

  describe('findByWalletId', () => {
    it('should return transactions for wallet', async () => {
      const mockTxs = [{ id: 'txn-1' }, { id: 'txn-2' }];
      mockDb('transactions').where.mockReturnThis();
      mockDb('transactions').orderBy.mockReturnThis();
      mockDb('transactions').limit?.mockReturnThis();
      mockDb('transactions').offset?.mockResolvedValue(mockTxs);

      const result = await TransactionModel.findByWalletId('wallet-123');
      expect(result).toEqual(mockTxs);
    });
  });

  describe('getTransactionHistory', () => {
    it('should get history with filters', async () => {
      mockDb('transactions').where.mockReturnThis();
      mockDb('transactions').orderBy.mockResolvedValue([]);

      await TransactionModel.getTransactionHistory('wallet-123', {
        type: 'credit',
      });

      expect(mockDb('transactions').where).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'credit' })
      );
    });
  });

  describe('updateStatus', () => {
    it('should update transaction status with timestamp', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(1);
      mockDb('transactions').where.mockReturnThis();
      mockDb('transactions').update = mockUpdate;

      await TransactionModel.updateStatus('txn-123', 'failed');

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'failed',
        updated_at: 'NOW()',
      });
    });
  });
});