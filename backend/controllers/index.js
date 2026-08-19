/**
 * CampusOS Backend — Base Controllers (controllers/index.js)
 * Foundational handlers for API info, health checks, and database tests.
 */

const config = require('../config/config');
const { testDbConnection } = require('../config/db');

/**
 * Root API Information Handler
 * GET /api
 */
const getApiInfo = (req, res) => {
  res.status(200).json({
    name: 'CampusOS API',
    version: '1.0.0',
    status: 'running',
    description: 'Smart College Management & Student Portal REST API',
  });
};

/**
 * Server Health Check Handler
 * GET /api/health
 */
const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CampusOS API is running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Database Connectivity Test Handler
 * GET /api/db-test
 */
const getDbTest = async (req, res) => {
  try {
    const isConnected = await testDbConnection();

    if (isConnected) {
      return res.status(200).json({
        success: true,
        message: 'Database connection successful',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
    });
  }
};

module.exports = {
  getApiInfo,
  getHealth,
  getDbTest,
};
