const bcrypt = require('bcryptjs');

// Spring's BCryptPasswordEncoder defaults to strength 10 — bcryptjs verifies
// existing $2a$/$2b$ hashes from the Java backend interchangeably, and new
// hashes stay compatible with it too.
const SALT_ROUNDS = 10;

const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);
const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

module.exports = { hashPassword, comparePassword };
