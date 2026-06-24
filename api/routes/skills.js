const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requirePerm } = require('../auth');

router.use(authenticate);

// GET /api/skills -> { M: [{id, code, name}, ...], T: [...] }
// Shape matches DB.mSkills / DB.tSkills in app1.html.
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, type, code, name, sort_order FROM skills ORDER BY type, sort_order'
    );
    const out = { M: [], T: [] };
    rows.forEach(r => out[r.type].push({ id: r.id, code: r.code, name: r.name }));
    res.json(out);
  } catch (e) { next(e); }
});

// PUT /api/skills  { skills: [{id, name}, ...] }
// Bulk update — mirrors saveParams(), which saves all 24 names in one click.
router.put('/', requirePerm('admin'), async (req, res, next) => {
  const { skills } = req.body;
  if (!Array.isArray(skills) || !skills.length) {
    return res.status(400).json({ error: 'skills array is required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const s of skills) {
      if (!s.id || !s.name) continue;
      await client.query('UPDATE skills SET name = $1 WHERE id = $2', [s.name, s.id]);
    }
    await client.query('COMMIT');
    res.json({ updated: skills.length });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
});

// PUT /api/skills/:id  { name }  — single-skill variant, admin only.
router.put('/:id', requirePerm('admin'), async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const { rowCount } = await pool.query(
      'UPDATE skills SET name = $1 WHERE id = $2',
      [name, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'skill not found' });
    res.json({ id: Number(req.params.id), name });
  } catch (e) { next(e); }
});

module.exports = router;
