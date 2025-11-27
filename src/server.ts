import app from './app';
import db from './config/database';
import 'dotenv/config'; 

const PORT = Number(process.env.PORT) || 3000;

// Graceful shutdown handlers
const gracefulShutdown = (signal: string) => {
  console.log(`\nReceived ${signal} — Shutting down gracefully...`);
  db.destroy() // ← Properly close DB connections
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
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C

// Test database connection
async function startServer() {
  try {
    await db.raw('SELECT 1 + 1 AS result');
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Press Ctrl+C to stop`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

// Handle unhandled rejections & exceptions
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Start the server
startServer();