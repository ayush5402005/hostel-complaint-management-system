// Mirrors security/RateLimitFilter.java exactly: a per-(IP, path) sliding
// window over an in-memory deque of request timestamps. Same trust caveat as
// the original — it reads X-Forwarded-For as-is with no trusted-proxy check.

const RULES = {
  '/api/auth/login': { max: 5, windowSeconds: 15 * 60 },
  '/api/auth/verify-otp': { max: 5, windowSeconds: 15 * 60 },
  '/api/auth/resend-otp': { max: 3, windowSeconds: 60 * 60 },
  '/api/auth/forgot-password': { max: 3, windowSeconds: 60 * 60 },
};

const requestLog = new Map(); // key -> number[] (epoch seconds, ascending)

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || req.ip;
}

function isRateLimited(key, max, windowSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  const timestamps = requestLog.get(key) || [];
  let i = 0;
  while (i < timestamps.length && timestamps[i] < windowStart) i++;
  const pruned = timestamps.slice(i);

  if (pruned.length >= max) {
    requestLog.set(key, pruned);
    return true;
  }

  pruned.push(now);
  requestLog.set(key, pruned);
  return false;
}

function rateLimiter(req, res, next) {
  const rule = RULES[req.path];
  if (req.method !== 'POST' || !rule) return next();

  const key = `${getClientIp(req)}:${req.path}`;
  if (isRateLimited(key, rule.max, rule.windowSeconds)) {
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }
  return next();
}

module.exports = rateLimiter;
