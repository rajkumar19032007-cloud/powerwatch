/**
 * CampusOS Backend — Database Connection Pool (config/db.js)
 * Creates a reusable MySQL connection pool using mysql2/promise.
 */

const mysql = require('mysql2/promise');
const config = require('./config');

// Create MySQL Connection Pool
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: config.db.waitForConnections,
  connectionLimit: config.db.connectionLimit,
  queueLimit: config.db.queueLimit,
  charset: config.db.charset,
});

/**
 * Tests whether MySQL is reachable without throwing unhandled exceptions
 * @returns {Promise<boolean>}
 */
const testDbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    // Log friendly error during development without breaking the server
    console.warn(`[CampusOS DB Warning]: Could not reach MySQL at ${config.db.host}:${config.db.port}/${config.db.database}`);
    console.warn(`[CampusOS DB Reason]: ${error.message}`);
    return false;
  }
};

/**
 * Executes a parameterized SQL query safely
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Array>}
 */
const query = async (sql, params = []) => {
  const [results] = await pool.execute(sql, params);
  return results;
};

module.exports = {
  pool,
  query,
  testDbConnection,
};
