import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import WalletService from '../services/walletService';
import { ApiResponse } from '../utils/apiResponse';
import { FundWalletDto, TransferDto, WithdrawDto } from '../types';

/*The core functionality of this web service is the wallet. This controller communicates with the services which communicates with the model and the database to create transaction and perform other functions in the user's wallet*/
class WalletController {
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

  async getWalletInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId;

        // We're returning both balance and recent transactions in one call for the user. This is common with most wallets
        const [balanceData, recentTransactions] = await Promise.all([
        WalletService.getWalletBalance(userId),
        WalletService.getTransactionHistory(userId, {
            limit: 5, // Deliberately limiting to 5 recent transactions
          }),
        ]);

        return res.status(200).json(
        ApiResponse.success(
            {
            // we're spreading what the get wallet returns to keep the structure consistent
            ...balanceData,
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

  async getTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId;

        const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string, 10), 100) : 50;

        const type = req.query.type as 'credit' | 'debit' | undefined;
        const category = req.query.category as 'funding' | 'transfer' | 'withdrawal' | undefined;
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;

        const transactions = await WalletService.getTransactionHistory(userId, {limit, type, category, startDate, endDate,}); //query parameters for filtering

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