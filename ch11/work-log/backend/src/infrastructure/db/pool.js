const { Pool } = require('pg');
require('pg').types.setTypeParser(1082, (val) => val);
const env = require('../config/env');

const pool = new Pool({
  connectionString: env.DB_CONN_STRING,
  ssl: { rejectUnauthorized: false },
});

async function testConnection() {
  await pool.query('SELECT 1');
}

module.exports = pool;
module.exports.testConnection = testConnection;
