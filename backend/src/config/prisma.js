const { PrismaClient } = require('@prisma/client');
const env = require('./env');
const logger = require('./logger');

// MySQL BIGINT columns come back as JS BigInt, which JSON.stringify() cannot
// serialize by default. IDs in this app never approach Number.MAX_SAFE_INTEGER,
// so it's safe (and matches the original Java Long -> JSON number behavior)
// to serialize them as plain numbers.
// eslint-disable-next-line no-extend-native
BigInt.prototype.toJSON = function toJSON() {
  return Number(this);
};

const prisma = new PrismaClient({
  log: env.isProduction
    ? [{ emit: 'event', level: 'error' }]
    : [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
});

prisma.$on('warn', (e) => logger.warn(e.message));
prisma.$on('error', (e) => logger.error(e.message));

module.exports = prisma;
