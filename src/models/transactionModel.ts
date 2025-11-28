import db from '../config/database';
import { ITransaction, CreateTransactionDto } from '../types';
import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

class TransactionModel {
  private tableName = 'transactions';

  async create(
    data: CreateTransactionDto,
    trx?: Knex.Transaction
  ): Promise<ITransaction> {
    const connection = trx || db;
  
    const id = uuidv4();
    
    const reference = `TXN-${uuidv4()}`;
    
    await connection(this.tableName).insert({
        id,
      ...data,
      reference,
      status: 'success',
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    });

    const transaction = await this.findById(id, trx);
    if (!transaction) {
      throw new Error('Failed to create transaction');
    }
    
    return transaction;
  }

  async findById(id: string, trx?: Knex.Transaction): Promise<ITransaction | null> {
    const connection = trx || db;
    const transaction = await connection(this.tableName).where({ id }).first();
    return transaction || null;
  }

  async findByReference(reference: string): Promise<ITransaction | null> {
    const transaction = await db(this.tableName).where({ reference }).first();
    return transaction || null;
  }

  async findByWalletId(walletId: string, limit = 50, offset = 0): Promise<ITransaction[]> {
    return db(this.tableName)
      .where({ wallet_id: walletId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  async updateStatus(transactionId: string, status: 'pending' | 'success' | 'failed', trx?: Knex.Transaction ): Promise<void> {
    const connection = trx || db;
    await connection(this.tableName)
      .where({ id: transactionId })
      .update({ status, updated_at: db.fn.now() });
  }

  async getTransactionHistory(walletId: string, filters?: {
      type?: 'credit' | 'debit';
      category?: 'funding' | 'transfer' | 'withdrawal';
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ITransaction[]> {
    let query = db(this.tableName).where({ wallet_id: walletId });

    if (filters?.type) {
      query = query.where({ type: filters.type });
    }

    if (filters?.category) {
      query = query.where({ category: filters.category });
    }

    if (filters?.startDate) {
      query = query.where('created_at', '>=', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.where('created_at', '<=', filters.endDate);
    }

    return query.orderBy('created_at', 'desc');
  }
}

export default new TransactionModel();