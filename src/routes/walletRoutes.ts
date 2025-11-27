import { Router } from 'express';
import WalletController from '../controllers/walletController';
import { authenticate } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import {fundWalletSchema, transferSchema, withdrawSchema} from '../validators/walletValidator';
import {asyncHandler} from '../middlewares/errorMiddleware'

const router = Router();

// All wallet routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/wallet/balance
 * @desc    Get user's wallet balance
 * @access  Private
 */
router.get('/balance', asyncHandler(WalletController.getBalance));

/**
 * @route   POST /api/v1/wallet/fund
 * @desc    Fund user's wallet
 * @access  Private
 */
router.post('/fund', validate(fundWalletSchema), asyncHandler(WalletController.fundWallet));

/**
 * @route   POST /api/v1/wallet/transfer
 * @desc    Transfer funds to another user
 * @access  Private
 */
router.post('/transfer', validate(transferSchema), asyncHandler(WalletController.transfer) );

/**
 * @route   POST /api/v1/wallet/withdraw
 * @desc    Withdraw funds from wallet
 * @access  Private
 */
router.post('/withdraw', validate(withdrawSchema), asyncHandler(WalletController.withdraw));

/**
 * @route   GET /api/v1/wallet/transactions
 * @desc    Get user's transaction history
 * @access  Private
 */
router.get('/transactions', asyncHandler(WalletController.getTransactions));

/**
 * @route   GET /api/v1/wallet
 * @desc    Get complete wallet information
 * @access  Private
 */
router.get('/', asyncHandler(WalletController.getWalletInfo));

export default router;