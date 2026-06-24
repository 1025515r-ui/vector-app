const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requirePerm } = require('../auth');

router.use(authenticate);

// GET /api/recommendations -> { M: [{id, text}, ...], T: [...] }
// Read broadly by all roles (shown on dashboard/analytics/parent views), not just admin.
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, type, text FROM recommendations ORDER BY type, sort_order'
    );
    const out = { M: [], T: [] };
    rows.forEach(r => out[r.type].push({ id: r.id, text: r.text }));
    res.json(out);
  } catch (e) { next(e); }
});

// POST /api/recommendations  { type: 'M'|'T', text }  (admin only)
router.post('/', requirePerm('admin'), async (req, res, next) => {
  try {
    const { type, text } = req.body;
    if (!['M', 'T'].includes(type) || !text) {
      return res.status(400).json({ error: "type ('M'|'T') and text are required" });
    }
    const { rows } = await pool.query(
      `INSERT INTO recommendations (type, text, sort_order)
       VALUES ($1, $2, COALESCE((SELECT MAX(sort_order) + 1 FROM recommendations WHERE type = $1), 1))
       RETURNING id`,
      [type, text]
    );
    res.status(201).json({ id: rows[0].id, type, text });
  } catch (e) { next(e); }
});

// DELETE /api/recommendations/:id  (admin only)
router.delete('/:id', requirePerm('admin'), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM recommendations WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
