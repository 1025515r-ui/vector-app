const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requirePerm } = require('../auth');

router.use(authenticate);

// GET /api/protocols?studentId=ST-001&day=1
// Returns [{ studentId, day, absent, date, mScores:[12], tScores:[12] }, ...] —
// same shape as DB.protocols in app1.html, to minimize client-side rewrite.
// Available to all authenticated roles: analytics/dashboard/below-average pages
// read this regardless of role, only the entry FORM (proto perm) is role-gated.
router.get('/', async (req, res, next) => {
  try {
    const { studentId, day } = req.query;
    const conditions = [];
    const params = [];
    if (studentId) { params.push(studentId); conditions.push(`p.student_id = $${params.length}`); }
    if (day) { params.push(day); conditions.push(`p.day = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows: protoRows } = await pool.query(
      `SELECT p.id, p.student_id, p.day, p.absent, p.recorded_at
       FROM protocols p ${where} ORDER BY p.student_id, p.day`,
      params
    );
    if (!protoRows.length) return res.json([]);

    const ids = protoRows.map(p => p.id);
    const { rows: scoreRows } = await pool.query(
      `SELECT ps.protocol_id, sk.type, sk.sort_order, ps.score
       FROM protocol_scores ps JOIN skills sk ON sk.id = ps.skill_id
       WHERE ps.protocol_id = ANY($1::int[])
       ORDER BY ps.protocol_id, sk.type, sk.sort_order`,
      [ids]
    );

    const byProto = {};
    scoreRows.forEach(r => {
      if (!byProto[r.protocol_id]) byProto[r.protocol_id] = { M: [], T: [] };
      byProto[r.protocol_id][r.type].push(r.score);
    });

    res.json(protoRows.map(p => ({
      studentId: p.student_id,
      day: p.day,
      absent: p.absent,
      date: p.recorded_at,
      mScores: byProto[p.id] ? byProto[p.id].M : Array(12).fill(0),
      tScores: byProto[p.id] ? byProto[p.id].T : Array(12).fill(0),
    })));
  } catch (e) { next(e); }
});

// PUT /api/protocols  { studentId, day, absent, mScores:[12], tScores:[12] }
// Upsert on (studentId, day) — mirrors saveProto(). Requires proto perm
// (admin/expert only — director/methodologist have read-only access via GET).
router.put('/', requirePerm('proto'), async (req, res, next) => {
  const { studentId, day, absent, mScores, tScores } = req.body;
  if (!studentId || !day) {
    return res.status(400).json({ error: 'studentId and day are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO protocols (student_id, day, absent, recorded_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (student_id, day) DO UPDATE SET absent = $3, recorded_at = now()
       RETURNING id`,
      [studentId, day, !!absent]
    );
    const protocolId = rows[0].id;

    await client.query('DELETE FROM protocol_scores WHERE protocol_id = $1', [protocolId]);

    if (!absent) {
      const { rows: skillRows } = await client.query(
        'SELECT id, type, sort_order FROM skills ORDER BY type, sort_order'
      );
      const mSkills = skillRows.filter(s => s.type === 'M');
      const tSkills = skillRows.filter(s => s.type === 'T');

      const valueClauses = [];
      const params = [];
      const pushScore = (skillId, score) => {
        params.push(protocolId, skillId, score);
        valueClauses.push(`($${params.length - 2}, $${params.length - 1}, $${params.length})`);
      };
      mSkills.forEach((sk, i) => pushScore(sk.id, (mScores && mScores[i]) || 0));
      tSkills.forEach((sk, i) => pushScore(sk.id, (tScores && tScores[i]) || 0));

      if (valueClauses.length) {
        await client.query(
          `INSERT INTO protocol_scores (protocol_id, skill_id, score) VALUES ${valueClauses.join(',')}`,
          params
        );
      }
    }

    await client.query('COMMIT');
    res.json({ studentId, day, absent: !!absent, mScores, tScores });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
});

module.exports = router;
