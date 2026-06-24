// This folder is deployed as a subdirectory of /var/www/vector-api (i.e.
// /var/www/vector-api/api/). Mount it under /api in index.js, alongside the
// existing app.post("/api/login", ...) etc. — paths don't overlap so order
// doesn't matter:
//
//   app.use('/api', require('./api'));
//
// Uses the same env vars index.js already loads via dotenv — no .env changes
// needed: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET.
// Also uses express/pg/jsonwebtoken, all already dependencies of index.js —
// no npm install needed either.
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
