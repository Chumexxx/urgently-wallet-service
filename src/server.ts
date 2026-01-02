import app from './app';
import db from './config/database';
import 'dotenv/config'; 
import logger from './utils/logger';

const PORT = Number(process.env.PORT) || 2000;

const gracefulShutdown = (signal: string) => {
  console.log(`\nReceived ${signal} — Shutting down gracefully...`);
  db.destroy()
    .then(() => {
      console.log('Database connections closed.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, 'Error during shutdown');
      console.error('Error during shutdown:', err);
      process.exit(1);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT')); 

async function startServer() {
  try {
    await db.raw('SELECT 1 + 1 AS result');
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Server is running on http://localhost:${PORT}`);;
      } else {
        console.log('Running in production mode: https://urgently-wallet-service.onrender.com');
      }
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to connect to database');
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason, promise);
  logger.error({ err: reason, promise}, 'Unhandled promise rejection');
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  logger.fatal({ err: error }, 'Uncaught exception');
  gracefulShutdown('uncaughtException');
});

startServer();