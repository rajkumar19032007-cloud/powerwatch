/**
 * ==============================================================================
 * CampusOS — Smart College Management & Student Portal
 * Backend Server Entrypoint (server.js)
 * Phase 8: Node.js + Express + MySQL Database Foundation
 * ==============================================================================
 */

const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const { testDbConnection } = require('./config/db');
const apiRoutes = require('./routes/index');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();

// ------------------------------------------------------------------------------
// 1. Security & Parsing Middlewares
// ------------------------------------------------------------------------------

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      // or if origin is in configured allowed list
      if (!origin || config.clientOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow local development flexibility
      }
    },
    credentials: true,
  })
);

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------------------------
// 2. API Routes
// ------------------------------------------------------------------------------

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to CampusOS API Server',
    documentation: '/api',
    health: '/api/health',
    dbTest: '/api/db-test',
  });
});

// Mount Central API Router
app.use('/api', apiRoutes);

// ------------------------------------------------------------------------------
// 3. Error Handling Middleware
// ------------------------------------------------------------------------------

// 404 Route Not Found
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

// ------------------------------------------------------------------------------
// 4. Start HTTP Server & Verify Database
// ------------------------------------------------------------------------------

const PORT = config.port;

app.listen(PORT, async () => {
  console.log('\n==================================================');
  console.log('🚀 CampusOS Backend API Server Running');
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
  console.log(`ℹ️  API Info: http://localhost:${PORT}/api`);
  console.log(`🔌 DB Test: http://localhost:${PORT}/api/db-test`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);

  // Test Database Connection Non-blockingly
  const isDbConnected = await testDbConnection();
  if (isDbConnected) {
    console.log('📦 CampusOS Database: Connected successfully');
  } else {
    console.log('⚠️  CampusOS Database: Connection failed (Server running in standalone mode)');
  }

  console.log('==================================================\n');
});

module.exports = app;
