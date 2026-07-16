const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const env = require('./config/env');
const logger = require('./config/logger');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// Security headers — OWASP baseline. `crossOriginResourcePolicy` relaxed so
// /uploads/** images can be embedded by the frontend origin.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Mirrors CorsConfig.java: only /api/** gets CORS headers, same origin
// allowlist, same methods, credentials enabled.
const corsOptions = {
  origin: env.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
  credentials: true,
};
app.use('/api', cors(corsOptions));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!env.isProduction && env.nodeEnv !== 'test') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Mirrors RateLimitFilter.java — runs before JWT auth, only on /api routes.
app.use('/api', rateLimiter);

app.use('/api', routes);

app.get('/', (req, res) => res.json({ status: 'ok', service: 'hostel-backend' }));

app.use((req, res) => {
  res.status(404).json({ status: 404, message: 'Not found', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

module.exports = app;
