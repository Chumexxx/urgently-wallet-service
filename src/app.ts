import express, { Application } from 'express';
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

// API Routes
app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;