const path = require('path');
require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '8080', 10),

  databaseUrl: required('DATABASE_URL'),

  jwt: {
    secret: process.env.JWT_SECRET || 'my-super-secret-key-my-super-secret-key-12345',
    expiresInMs: parseInt(process.env.JWT_EXPIRES_IN_MS || '3600000', 10),
  },

  upload: {
    dir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads/complaint-images'),
  },

  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    username: process.env.MAIL_USERNAME,
    password: process.env.MAIL_PASSWORD,
  },

  frontendResetUrl: process.env.FRONTEND_RESET_URL || 'http://localhost:5173/reset-password',

  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};

module.exports = env;
