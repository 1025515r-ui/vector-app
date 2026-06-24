// Mount this under /api in the existing Express app, alongside the existing
// POST /api/login route:
//
//   app.use('/api', require('./api'));
//
// Required env vars (must match what the existing /api/login uses for JWT_SECRET):
//   JWT_SECRET, PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
//
// Requires: npm install express pg jsonwebtoken
//
// Centralized error handler is intentionally NOT included here — wire each
// route's `next(e)` into the existing app's error-handling middleware so
// errors are logged/formatted consistently with the rest of the API.

const express = require('express');
const router = express.Router();

router.use('/students', require('./routes/students'));
router.use('/skills', require('./routes/skills'));
router.use('/protocols', require('./routes/protocols'));
router.use('/recommendations', require('./routes/recommendations'));
router.use('/lesson-progress', require('./routes/lessonProgress'));

module.exports = router;
