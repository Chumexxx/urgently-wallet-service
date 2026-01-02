import express, { Application, Request, Response } from 'express';
import { httpLogger } from './utils/logger';
import dotenv from 'dotenv';
import apiRoutes from './routes/index';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware';

dotenv.config();

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger);

// CORS (if needed)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Urgently Wallet Service API',
    version: '1.0.0',
    documentation: 'https://docs.google.com/document/d/1jM7TcqnV0pIM3AgqC3tQbJ-vhfEVqS7Kr9GNxQUN-HA/edit?usp=sharing',
    github: 'https://github.com/Chumexxx/urgently-wallet-service',
    endpoints: {
      health: '/api/v1/health',
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login'
      },
      wallet: {
        balance: 'GET /api/v1/wallet/balance',
        fund: 'POST /api/v1/wallet/fund',
        transfer: 'POST /api/v1/wallet/transfer',
        withdraw: 'POST /api/v1/wallet/withdraw',
        transactions: 'GET /api/v1/wallet/transactions',
        details: 'GET /api/v1/wallet/'
      }
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Service is healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;