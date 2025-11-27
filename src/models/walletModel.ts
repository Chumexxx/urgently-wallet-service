// src/models/wallet.model.ts
import db from '../config/database';
import { IWallet, CreateWalletDto } from '../types';
import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

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

  async updateBalance(walletId: string, newBalance: number, trx?: Knex.Transaction): Promise<void> {
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

  async getBalanceForUpdate(
    walletId: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const connection: any = trx || db;

    // Support two shapes:
    // - callable connection: connection(tableName).where(...)
    // - query-like object (used in tests/mocks): connection.where(...)
    let wallet: any;
    if (typeof connection === 'function') {
      wallet = await connection(this.tableName)
        .where({ id: walletId })
        .forUpdate()
        .first();
    } else {
      wallet = await connection
        .where({ id: walletId })
        .forUpdate()
        .first();
    }

    return wallet ? parseFloat(wallet.balance) : 0;
  }
}

export default new WalletModel();