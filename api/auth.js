const jwt = require('jsonwebtoken');

// Matches the existing auth(roles) middleware in /var/www/vector-api/index.js:
// same header parsing (Authorization: Bearer <token>), same JWT_SECRET env var,
// same error message style. Token payload: { id, email, role, full_name }.
//
// Mirrors ROLE_PERMS in app1.html (lines 1993-1998) — keep these two in sync.
// This is the server-side enforcement the client-side check alone can't provide
// (a user can edit localStorage/JS state, but can't forge a valid JWT for another role).
const ROLE_PERMS = {
  students: ['admin', 'director', 'methodologist', 'expert'],
  proto:    ['admin', 'expert'],
  admin:    ['admin'],
};

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Немає токену' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Невірний токен' });
  }
}

function requirePerm(permKey) {
  const allowedRoles = ROLE_PERMS[permKey] || [];
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Немає доступу' });
    }
    next();
  };
}

module.exports = { authenticate, requirePerm, ROLE_PERMS };
