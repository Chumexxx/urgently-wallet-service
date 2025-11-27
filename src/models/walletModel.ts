// src/models/wallet.model.ts
import db from '../config/database';
import { IWallet } from '../types';
import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

interface CreateWalletDto {
  user_id: string;
  balance?: number;
  currency?: string;
}

interface UpdateBalanceDto {
  amount: number;         
  description?: string;
  reference?: string;
}

class WalletModel {
  private tableName = 'wallets';

  async create(
    data: CreateWalletDto,
    trx?: Knex.Transaction
  ): Promise<IWallet> {
    const connection = trx || db;

    const id = uuidv4();

    await connection(this.tableName).insert({
      id,
      user_id: data.user_id,
      balance: data.balance ?? 0.0,
      currency: data.currency ?? 'NGN',
    });

    const wallet = await this.findById(id, trx);
    if (!wallet) {
      throw new Error('Failed to create wallet');
    }

    return wallet;
  }

  async findById(id: string, trx?: Knex.Transaction): Promise<IWallet | null> {
    const connection = trx || db;
    return await connection(this.tableName).where({ id }).first();
  }

  async findByUserId(userId: string, trx?: Knex.Transaction): Promise<IWallet | null> {
    const connection = trx || db;
    return await connection(this.tableName).where({ user_id: userId }).first();
  }

  // Atomically update balance (credit or debit)
  // Use this inside a Knex transaction for money safety!
  async updateBalance(
    walletId: string,
    newBalance: number,
    trx?: Knex.Transaction
  ): Promise<void> {
    const connection = trx || db;
    
    const result = await connection(this.tableName)
      .where({ id: walletId })
      .update({ 
        balance: newBalance, 
        updated_at: connection.fn.now() 
      });
    
    if (result === 0) {
      throw new Error('Wallet not found or balance update failed');
    }
  }

  async incrementBalance(
    walletId: string,
    amount: number,
    trx?: Knex.Transaction
  ): Promise<void> {
    const connection = trx || db;
    await connection(this.tableName)
      .where({ id: walletId })
      .increment('balance', amount)
      .update({ updated_at: db.fn.now() });
  }

  async decrementBalance(
    walletId: string,
    amount: number,
    trx?: Knex.Transaction
  ): Promise<void> {
    const connection = trx || db;
    await connection(this.tableName)
      .where({ id: walletId })
      .decrement('balance', amount)
      .update({ updated_at: db.fn.now() });
  }

  async getBalanceForUpdate(
    walletId: string,
    trx: Knex.Transaction
  ): Promise<number> {
    const wallet = await trx(this.tableName)
      .where({ id: walletId })
      .forUpdate()
      .first();
    
    return wallet ? parseFloat(wallet.balance) : 0;
  }

  async existsForUser(userId: string, trx?: Knex.Transaction): Promise<boolean> {
    const connection = trx || db;
    const wallet = await connection(this.tableName).where({ user_id: userId }).first();
    return !!wallet;
  }

  async getBalance(walletId: string, trx: Knex.Transaction
    ): Promise<number> {
    const row = await trx(this.tableName)
        .forUpdate()                    // Locks the row until transaction ends
        .select('balance')
        .where({ id: walletId })
        .first();

    if (!row) {
        throw new Error('Wallet not found');
    }

    return Number(row.balance);
    }

    async hasSufficientBalance(
    walletId: string,
    amount: number,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const connection = trx || db;

    const wallet = await connection(this.tableName)
      .where({ id: walletId })
      .first();

    if (!wallet) {
      return false;
    }

    return parseFloat(wallet.balance) >= amount;
  }
}

export default new WalletModel();