import { Router } from 'express';
import WalletController from '../controllers/walletController';
import { authenticate } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import {fundWalletSchema, transferSchema, withdrawSchema} from '../validators/walletValidator';
import {asyncHandler} from '../middlewares/errorMiddleware'

const router = Router();

// All wallet routes require authentication. Figured I'll do it here than in individual routes
router.use(authenticate);

// GET /api/v1/wallet/balance
router.get('/balance', asyncHandler(WalletController.getBalance));

// POST /api/v1/wallet/fund
router.post('/fund', validate(fundWalletSchema), asyncHandler(WalletController.fundWallet));

//POST /api/v1/wallet/transfer
router.post('/transfer', validate(transferSchema), asyncHandler(WalletController.transfer) );

// POST /api/v1/wallet/withdraw
router.post('/withdraw', validate(withdrawSchema), asyncHandler(WalletController.withdraw));

// GET /api/v1/wallet/transactions
router.get('/transactions', asyncHandler(WalletController.getTransactions));

// GET /api/v1/wallet
router.get('/', asyncHandler(WalletController.getWalletInfo));

export default router;