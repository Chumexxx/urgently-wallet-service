import { Router } from 'express';
import AuthController from '../controllers/authController';
import { validate } from '../middlewares/validationMiddleware';
import { registerSchema, loginSchema } from '../validators/authValidator';
import {asyncHandler} from '../middlewares/errorMiddleware'

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerSchema), asyncHandler(AuthController.register));

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and get token
 * @access  Public
 */
router.post('/login', validate(loginSchema), asyncHandler(AuthController.login));

export default router;