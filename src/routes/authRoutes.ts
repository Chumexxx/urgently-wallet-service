import { Router } from 'express';
import AuthController from '../controllers/authController';
import { validate } from '../middlewares/validationMiddleware';
import { registerSchema, loginSchema } from '../validators/authValidator';
import {asyncHandler} from '../middlewares/errorMiddleware'

const router = Router();


// POST /api/v1/auth/register
router.post('/register', validate(registerSchema), asyncHandler(AuthController.register));

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), asyncHandler(AuthController.login));

export default router;