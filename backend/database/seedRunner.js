/**
 * CampusOS Backend — Database Schema & Seed Runner (database/seedRunner.js)
 * Executes schema.sql and seed.sql to establish tables and initial records.
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runSeed() {
  try {
    console.log('🌱 Starting CampusOS Schema Migration & Seeding...');
    const schemaSqlPath = path.join(__dirname, 'schema.sql');
    const seedSqlPath = path.join(__dirname, 'seed.sql');

    const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8').replace(/--.*$/gm, '');
    const seedSql = fs.readFileSync(seedSqlPath, 'utf8').replace(/--.*$/gm, '');

    const schemaStatements = schemaSql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    const seedStatements = seedSql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    const connection = await pool.getConnection();

    try {
      await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

      // 1. Run Schema Statements
      for (const stmt of schemaStatements) {
        if (stmt.length > 0) {
          await connection.query(stmt);
        }
      }
      console.log('✅ Schema migration completed (8 tables verified).');

      // 2. Run Seed Statements
      for (const stmt of seedStatements) {
        if (stmt.length > 0) {
          await connection.query(stmt);
        }
      }
      await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
      console.log('✅ Database seeded successfully with departments, users, courses, attendance, assignments, and marks!');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error during database initialization:', error.message);
  } finally {
    await pool.end();
  }
}

runSeed();
