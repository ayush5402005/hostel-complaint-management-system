const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Mirrors security/JwtUtil.java exactly: HS256, subject = email, a `role`
// claim, and a fixed expiry — so tokens are interchangeable with the
// original Spring Boot backend during a rolling migration.
const generateToken = (email, role) =>
  jwt.sign({ role }, env.jwt.secret, {
    subject: email,
    algorithm: 'HS256',
    expiresIn: Math.floor(env.jwt.expiresInMs / 1000),
  });

const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.secret, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
