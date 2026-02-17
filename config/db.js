// config/db.js
const { Pool } = require("pg");
const { DATABASE_URL, DB_SSL } = require("./config");

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL Connected");
    client.release();
    return pool;
  } catch (error) {
    console.error(`❌ Database connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = {
  connectDB,
  pool,
};
