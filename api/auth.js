const jwt = require('jsonwebtoken');

// Must match the secret used by the existing /api/login handler to sign tokens.
const JWT_SECRET = process.env.JWT_SECRET;

// Mirrors ROLE_PERMS in app1.html (lines 1993-1998). Keep these two in sync —
// this is the server-side enforcement that the client-side check alone can't provide
// (a user can edit localStorage/JS state, but can't forge a valid JWT for another role).
const ROLE_PERMS = {
  admin:         { students: true, proto: true,  admin: true },
  director:      { students: true, proto: false, admin: false },
  methodologist: { students: true, proto: false, admin: false },
  expert:        { students: true, proto: true,  admin: false },
  parent:        { students: false, proto: false, admin: false },
};

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET); // expects { email, full_name, role, ... }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requirePerm(permKey) {
  return (req, res, next) => {
    const perms = ROLE_PERMS[req.user?.role];
    if (!perms || !perms[permKey]) {
      return res.status(403).json({ error: `Forbidden for role: ${req.user?.role}` });
    }
    next();
  };
}

module.exports = { authenticate, requirePerm, ROLE_PERMS };
