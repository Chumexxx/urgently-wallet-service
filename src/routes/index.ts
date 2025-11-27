import { Router } from 'express'; 
import authRoute from './authRoutes';
import walletRoute from './walletRoutes';

const router = Router();

router.use('/auth', authRoute);
router.use('/wallet', walletRoute);

export default router;