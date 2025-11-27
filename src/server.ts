import app from './app';
import db from './config/database';
import 'dotenv/config'; 

const PORT = Number(process.env.PORT) || 2000;

const gracefulShutdown = (signal: string) => {
  console.log(`\nReceived ${signal} — Shutting down gracefully...`);
  db.destroy()
    .then(() => {
      console.log('Database connections closed.');
      process.exit(0);
    })
    .catch((err) => {
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
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

startServer();