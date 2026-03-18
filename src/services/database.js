const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    await pool.query("SELECT 1");
    console.log("ZEUS PostgreSQL connected");
  } catch (error) {
    console.error("ZEUS PostgreSQL connection error:", error.message);
  }
}

module.exports = {
  pool,
  testConnection
};