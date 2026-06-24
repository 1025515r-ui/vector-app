const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requirePerm } = require('../auth');

router.use(authenticate);

// GET /api/students
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, dob, gender FROM students ORDER BY id'
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/students  { name, dob, gender }
// Mirrors addStu() in app1.html — available to any role with students access,
// not just admin (it's reachable from the Учні page, not only the Admin page).
router.post('/', requirePerm('students'), async (req, res, next) => {
  try {
    const { name, dob, gender } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const { rows } = await pool.query(
      `SELECT 'ST-' || lpad(nextval('student_id_seq')::text, 3, '0') AS id`
    );
    const id = rows[0].id;

    await pool.query(
      'INSERT INTO students (id, name, dob, gender) VALUES ($1, $2, $3, $4)',
      [id, name, dob || null, gender || null]
    );
    res.status(201).json({ id, name, dob: dob || null, gender: gender || null });
  } catch (e) { next(e); }
});

// DELETE /api/students/:id
// Admin only — mirrors delStu() which is only reachable from the Admin page.
// protocols/protocol_scores for this student cascade-delete via FK.
router.delete('/:id', requirePerm('admin'), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
