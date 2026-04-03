require('dotenv').config();
const app = require('./app');

if (!process.env.JWT_SECRET) {
  console.error(`
╔══════════════════════════════════════════════════════════╗
║                  STARTUP ERROR                           ║
╠══════════════════════════════════════════════════════════╣
║  JWT_SECRET is not set.                                  ║
║                                                          ║
║  Fix: copy .env.example to .env and set JWT_SECRET       ║
║    cp .env.example .env                                  ║
║    Then edit .env and fill in JWT_SECRET                 ║
╚══════════════════════════════════════════════════════════╝
  `);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║         FinLedger API — Server Started        ║
╠══════════════════════════════════════════════╣
║  Port        : ${PORT}                           ║
║  Environment : ${(process.env.NODE_ENV || 'development').padEnd(28)}║
║  Health      : http://localhost:${PORT}/health   ║
╚══════════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
  server.close(() => process.exit(1));
});

module.exports = server;
