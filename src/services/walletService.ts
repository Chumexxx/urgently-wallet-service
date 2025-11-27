import { FundWalletDto, TransferDto, WithdrawDto } from '../types';
import WalletModel from '../models/walletModel';
import UserModel from '../models/userModel';
import TransactionModel from '../models/transactionModel';
import { ApiError } from '../utils/apiError';
import db from '../config/database';

class WalletService {
  /**
   * Get wallet balance
   */
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

  /**
   * Fund wallet
   */
  async fundWallet(userId: string, data: FundWalletDto) {
    // Validate amount
    if (data.amount <= 0) {
      throw ApiError.badRequest('Amount must be greater than zero');
    }

    // Find wallet
    const wallet = await WalletModel.findByUserId(userId);
    if (!wallet) {
      throw ApiError.notFound('Wallet not found');
    }

    // Start transaction
    const trx = await db.transaction();

    try {
      // Lock wallet row and get current balance
      const currentBalance = await WalletModel.getBalanceForUpdate(wallet.id, trx);
      const newBalance = currentBalance + data.amount;

      // Update wallet balance
      await WalletModel.updateBalance(wallet.id, newBalance, trx);

      // Create transaction record
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

      // Commit transaction
      await trx.commit();

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
      // Rollback on error
      await trx.rollback();
      console.error('Fund wallet error:', error);
      throw error;
    }
  }

  /**
   * Transfer funds to another user
   */
  async transferFunds(userId: string, data: TransferDto) {
    // Validate amount
    if (data.amount <= 0) {
      throw ApiError.badRequest('Amount must be greater than zero');
    }

    // Get sender's wallet
    const senderWallet = await WalletModel.findByUserId(userId);
    if (!senderWallet) {
      throw ApiError.notFound('Sender wallet not found');
    }

    // Get recipient by email
    const recipient = await UserModel.findByEmail(data.recipient_email);
    if (!recipient) {
      throw ApiError.notFound('Recipient not found');
    }

    // Prevent self-transfer
    if (recipient.id === userId) {
      throw ApiError.badRequest('Cannot transfer to yourself');
    }

    // Get recipient's wallet
    const recipientWallet = await WalletModel.findByUserId(recipient.id);
    if (!recipientWallet) {
      throw ApiError.notFound('Recipient wallet not found');
    }

    // Start transaction
    const trx = await db.transaction();

    try {
      // Lock both wallets for update
      const senderBalance = await WalletModel.getBalanceForUpdate(senderWallet.id, trx);
      const recipientBalance = await WalletModel.getBalanceForUpdate(recipientWallet.id, trx);

      // Check sufficient balance
      if (senderBalance < data.amount) {
        throw ApiError.badRequest('Insufficient balance');
      }

      const newSenderBalance = senderBalance - data.amount;
      const newRecipientBalance = recipientBalance + data.amount;

      // Update sender's wallet
      await WalletModel.updateBalance(senderWallet.id, newSenderBalance, trx);

      // Update recipient's wallet
      await WalletModel.updateBalance(recipientWallet.id, newRecipientBalance, trx);

      // Create debit transaction for sender
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

      // Create credit transaction for recipient
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

      // Commit transaction
      await trx.commit();

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
      // Rollback on error
      await trx.rollback();
      console.error('Transfer error:', error);
      throw error;
    }
  }

  /**
   * Withdraw funds
   */
  async withdrawFunds(userId: string, data: WithdrawDto) {
    // Validate amount
    if (data.amount <= 0) {
      throw ApiError.badRequest('Amount must be greater than zero');
    }

    // Find wallet
    const wallet = await WalletModel.findByUserId(userId);
    if (!wallet) {
      throw ApiError.notFound('Wallet not found');
    }

    // Start transaction
    const trx = await db.transaction();

    try {
      // Lock wallet for update
      const currentBalance = await WalletModel.getBalanceForUpdate(wallet.id, trx);

      // Check sufficient balance
      if (currentBalance < data.amount) {
        throw ApiError.badRequest('Insufficient balance');
      }

      const newBalance = currentBalance - data.amount;

      // Update wallet balance
      await WalletModel.updateBalance(wallet.id, newBalance, trx);

      // Create transaction record
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
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
  userId: string,
  queryParams: {
    limit?: number;
    type?: 'credit' | 'debit';
    category?: 'funding' | 'transfer' | 'withdrawal';
    startDate?: string;  // ISO string
    endDate?: string;    // ISO string
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
    end.setHours(23, 59, 59, 999); // Include full day
    filters.endDate = end;
  }

  const transactions = await TransactionModel.getTransactionHistory(wallet.id, filters);

  // Apply limit after filtering (or better: add pagination later)
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