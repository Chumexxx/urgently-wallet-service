import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import WalletService from '../services/walletService';
import { ApiResponse } from '../utils/apiResponse';
import { FundWalletDto, TransferDto, WithdrawDto } from '../types';

class WalletController {
  /**
   * @desc    Get wallet balance
   * @route   GET /api/v1/wallet/balance
   * @access  Private
   */
  async getBalance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await WalletService.getWalletBalance(userId);

      res.status(200).json(
        ApiResponse.success(result, 'Wallet balance retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Get complete wallet information
   * @route   GET /api/v1/wallet
   * @access  Private
   */
  async getWalletInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId;

        // Run both queries in parallel for speed
        const [balanceData, recentTransactions] = await Promise.all([
        WalletService.getWalletBalance(userId),
        WalletService.getTransactionHistory(userId, {
            limit: 5,
            // Optional: you can make this configurable via query param later
            // e.g., ?recent=10 or ?include=pending
        }),
        ]);

        return res.status(200).json(
        ApiResponse.success(
            {
            // Spread whatever your getWalletBalance returns
            // Usually: { balance, wallet_id, currency, etc. }
            ...balanceData,

            // Clean name + always include count
            recent_transactions: recentTransactions,
            recent_transactions_count: recentTransactions.length,
            },
            'Wallet information retrieved successfully'
        )
        );
    } catch (error) {
        next(error);
    }
    }

  /**
   * @desc    Fund wallet
   * @route   POST /api/v1/wallet/fund
   * @access  Private
   */
  async fundWallet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const data: FundWalletDto = req.body;
      const result = await WalletService.fundWallet(userId, data);

      res.status(200).json(
        ApiResponse.success(result, 'Wallet funded successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Transfer funds to another user
   * @route   POST /api/v1/wallet/transfer
   * @access  Private
   */
  async transfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const data: TransferDto = req.body;
      const result = await WalletService.transferFunds(userId, data);

      res.status(200).json(
        ApiResponse.success(result, 'Transfer successful')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Withdraw funds
   * @route   POST /api/v1/wallet/withdraw
   * @access  Private
   */
  async withdraw(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const data: WithdrawDto = req.body;
      const result = await WalletService.withdrawFunds(userId, data);

      res.status(200).json(
        ApiResponse.success(result, 'Withdrawal successful')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Get transaction history
   * @route   GET /api/v1/wallet/transactions
   * @access  Private
   */
  async getTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId;

        // Parse and sanitize query parameters
        const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string, 10), 100) : 50;
        // ↑ Cap at 100 to prevent abuse

        const type = req.query.type as 'credit' | 'debit' | undefined;
        const category = req.query.category as 'funding' | 'transfer' | 'withdrawal' | undefined;
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;

        // Optional: Add pagination later
        // const page = parseInt(req.query.page as string) || 1;
        // const offset = (page - 1) * limit;

        const transactions = await WalletService.getTransactionHistory(userId, {
        limit,
        type,
        category,
        startDate,
        endDate,
        });

        return res.status(200).json(
        ApiResponse.success(
            {
            transactions,
            count: transactions.length,
            filters: { type, category, startDate, endDate, limit },
            },
            'Transaction history retrieved successfully'
        )
        );
    } catch (error) {
        next(error);
    }
    }

}

export default new WalletController();