const { verifyToken } = require('../utils/jwt');
const { ForbiddenError } = require('../utils/AppError');

// Mirrors JwtAuthenticationFilter.java: reads "Authorization: Bearer <token>",
// and on a valid token attaches { email, role } to req.user (equivalent to
// Spring's SecurityContext authentication). Unlike the Java filter, which
// silently lets an anonymous request through the filter chain and relies on
// SecurityConfig's `.anyRequest().authenticated()` to reject it downstream,
// this middleware itself rejects when no route matched the public allowlist
// (see routes/index.js, which only wires this on protected routers).
function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    const payload = verifyToken(token);
    if (payload) {
      req.user = { email: payload.sub, role: payload.role };
      return next();
    }
  }

  return res.status(401).json({
    status: 401,
    message: 'Full authentication is required to access this resource',
    timestamp: new Date().toISOString(),
  });
}

// Mirrors @PreAuthorize("hasAnyRole(...)") on specific controller methods.
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Access denied'));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
