const { Pool } = require('pg');

// Same env var names as the existing pool in /var/www/vector-api/index.js
// (DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD), so no .env changes are needed.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
