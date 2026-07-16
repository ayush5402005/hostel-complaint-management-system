const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const prisma = require('./config/prisma');
const { runSeed } = require('./config/seed');
const { startSlaScheduler } = require('./jobs/slaScheduler');

async function start() {
  await prisma.$connect();
  logger.info('Connected to MySQL via Prisma');

  await runSeed();

  startSlaScheduler();

  const server = app.listen(env.port, () => {
    logger.info(`Hostel backend listening on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
