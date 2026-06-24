const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../auth');

router.use(authenticate);

// GET /api/lesson-progress -> [lessonId, ...] watched by the current user.
// Replaces the per-browser localStorage key 'vector_watched'.
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT lesson_id FROM lesson_progress WHERE user_email = $1',
      [req.user.email]
    );
    res.json(rows.map(r => r.lesson_id));
  } catch (e) { next(e); }
});

// POST /api/lesson-progress  { lessonId }
// Mirrors markWatched(). Idempotent — re-marking an already-watched lesson is a no-op.
router.post('/', async (req, res, next) => {
  try {
    const { lessonId } = req.body;
    if (!lessonId) return res.status(400).json({ error: 'lessonId is required' });
    await pool.query(
      `INSERT INTO lesson_progress (user_email, lesson_id) VALUES ($1, $2)
       ON CONFLICT (user_email, lesson_id) DO NOTHING`,
      [req.user.email, lessonId]
    );
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
