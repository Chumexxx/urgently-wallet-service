import { FundWalletDto, TransferDto, WithdrawDto } from '../types';
import WalletModel from '../models/walletModel';
import UserModel from '../models/userModel';
import TransactionModel from '../models/transactionModel';
import { ApiError } from '../utils/apiError';
import db from '../config/database';
import logger from '../utils/logger';

class WalletService {
  async getWalletBalance(userId: string) {
    const wallet = await WalletModel.findByUserId(userId);

    if (!wallet) {
      throw ApiError.notFound('Wallet not found');
    }

    return {
      balance: parseFloat(wallet.balance.toString()),
      currency: wallet.currency,
      wallet_id: wallet.id,
    };
  }

  async fundWallet(userId: string, data: FundWalletDto) {

    if (data.amount <= 0) {
      throw ApiError.badRequest('Amount must be greater than zero');
    }

    const wallet = await WalletModel.findByUserId(userId);
    if (!wallet) {
      throw ApiError.notFound('Wallet not found');
    }

    const trx = await db.transaction();

    try {
      // Lock wallet row and get current balance
      const currentBalance = await WalletModel.getBalanceForUpdate(wallet.id, trx);
      const newBalance = currentBalance + data.amount;

      await WalletModel.updateBalance(wallet.id, newBalance, trx);

      const transaction = await TransactionModel.create(
        {
          wallet_id: wallet.id,
          type: 'credit',
          category: 'funding',
          amount: data.amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: 'Wallet funding',
        },
        trx
      );

      await trx.commit();

      logger.info({ userId, amount: data.amount }, 'Wallet funded successfully');

      return {
        message: 'Wallet funded successfully',
        transaction: {
          reference: transaction.reference,
          amount: parseFloat(transaction.amount.toString()),
          balance: newBalance,
          type: transaction.type,
          category: transaction.category,
        },
      };
    } catch (error) {
      await trx.rollback();

      logger.error({ err: error, userId, amount: data.amount }, 'Fund wallet error');
      console.error('Fund wallet error:', error);
      throw error;
    }
  }

  // Function to allow users transfer funds to another user's wallet. Since email is unique, we use it to identify recipient
  async transferFunds(userId: string, data: TransferDto) {
    if (data.amount <= 0) {
      throw ApiError.badRequest('Amount must be greater than zero');
    }

    const senderWallet = await WalletModel.findByUserId(userId);
    if (!senderWallet) {
      throw ApiError.notFound('Sender wallet not found');
    }

    const recipient = await UserModel.findByEmail(data.recipient_email);
    if (!recipient) {
      throw ApiError.notFound('Recipient not found');
    }

    // Prevent self-transfer
    if (recipient.id === userId) {
      throw ApiError.badRequest('Cannot transfer to yourself');
    }

    const recipientWallet = await WalletModel.findByUserId(recipient.id);
    if (!recipientWallet) {
      throw ApiError.notFound('Recipient wallet not found');
    }

    const trx = await db.transaction();

    try {
      const senderBalance = await WalletModel.getBalanceForUpdate(senderWallet.id, trx);
      const recipientBalance = await WalletModel.getBalanceForUpdate(recipientWallet.id, trx);

      if (senderBalance < data.amount) {
        throw ApiError.badRequest('Insufficient balance');
      }

      const newSenderBalance = senderBalance - data.amount;
      const newRecipientBalance = recipientBalance + data.amount;

      await WalletModel.updateBalance(senderWallet.id, newSenderBalance, trx);

      await WalletModel.updateBalance(recipientWallet.id, newRecipientBalance, trx);

      const debitTransaction = await TransactionModel.create(
        {
          wallet_id: senderWallet.id,
          type: 'debit',
          category: 'transfer',
          amount: data.amount,
          balance_before: senderBalance,
          balance_after: newSenderBalance,
          description: data.description || `Transfer to ${recipient.email}`,
          recipient_wallet_id: recipientWallet.id,
          metadata: { recipient_email: recipient.email },
        },
        trx
      );

      await TransactionModel.create(
        {
          wallet_id: recipientWallet.id,
          type: 'credit',
          category: 'transfer',
          amount: data.amount,
          balance_before: recipientBalance,
          balance_after: newRecipientBalance,
          description: data.description || `Transfer from ${userId}`,
          recipient_wallet_id: senderWallet.id,
        },
        trx
      );
      await trx.commit();
            logger.info({ from: userId, to: recipient.id, amount: data.amount },'Transfer successful');

      return {
        message: 'Transfer successful',
        transaction: {
          reference: debitTransaction.reference,
          amount: parseFloat(data.amount.toString()),
          recipient: {
            email: recipient.email,
            name: `${recipient.first_name} ${recipient.last_name}`,
          },
          balance: newSenderBalance,
        },
      };
    } catch (error) {
      await trx.rollback();
      console.error('Transfer error:', error);
      logger.error({ err: error, from: userId, to: data.recipient_email, amount: data.amount }, 'Transfer error');
      throw error;
    }
  }
  // Withdraw funds from wallet
  async withdrawFunds(userId: string, data: WithdrawDto) {
    if (data.amount <= 0) {
      throw ApiError.badRequest('Amount must be greater than zero');
    }

    const wallet = await WalletModel.findByUserId(userId);
    if (!wallet) {
      throw ApiError.notFound('Wallet not found');
    }

    const trx = await db.transaction();

    try {
      const currentBalance = await WalletModel.getBalanceForUpdate(wallet.id, trx);

      if (currentBalance < data.amount) {
        throw ApiError.badRequest('Insufficient balance');
      }

      const newBalance = currentBalance - data.amount;


      await WalletModel.updateBalance(wallet.id, newBalance, trx);

      const transaction = await TransactionModel.create(
        {
          wallet_id: wallet.id,
          type: 'debit',
          category: 'withdrawal',
          amount: data.amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: data.description || 'Withdrawal',
        },
        trx
      );

      // Commit transaction
      await trx.commit();
      logger.info({ userId, amount: data.amount }, 'Withdrawal successful');

      return {
        message: 'Withdrawal successful',
        transaction: {
          reference: transaction.reference,
          amount: parseFloat(transaction.amount.toString()),
          balance: newBalance,
          type: transaction.type,
          category: transaction.category,
        },
      };
    } catch (error) {
      // Rollback on error
      await trx.rollback();
      console.error('Withdrawal error:', error);
      logger.error({ err: error, userId, amount: data.amount }, 'Withdrawal error');
      throw error;
    }
  }

  async getTransactionHistory(
  userId: string,
  queryParams: {
    limit?: number;
    type?: 'credit' | 'debit';
    category?: 'funding' | 'transfer' | 'withdrawal';
    startDate?: string;  
    endDate?: string;    
  } = {}
) {
  const wallet = await WalletModel.findByUserId(userId);
  if (!wallet) {
    throw ApiError.notFound('Wallet not found');
  }

  const { limit = 50, type, category, startDate, endDate } = queryParams;

  const filters: any = {};
  if (type) filters.type = type;
  if (category) filters.category = category;
  if (startDate) filters.startDate = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filters.endDate = end;
  }

  const transactions = await TransactionModel.getTransactionHistory(wallet.id, filters);

  return transactions
    .slice(0, limit)
    .map((txn) => ({
      id: txn.id,
      reference: txn.reference,
      type: txn.type,
      category: txn.category,
      amount: parseFloat(txn.amount.toString()),
      balance_before: parseFloat(txn.balance_before.toString()),
      balance_after: parseFloat(txn.balance_after.toString()),
      description: txn.description || null,
      status: txn.status,
      created_at: txn.created_at,
    }));
  }
}

export default new WalletService();