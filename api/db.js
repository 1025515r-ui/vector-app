const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'vector_db',
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

module.exports = pool;
