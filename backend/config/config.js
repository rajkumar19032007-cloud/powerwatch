/**
 * CampusOS Backend — Central Configuration (config/config.js)
 * Loads environment variables with safe development defaults.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = {
  // Server port (default: 5000)
  port: parseInt(process.env.PORT, 10) || 5000,

  // Runtime environment ('development' | 'production' | 'test')
  nodeEnv: process.env.NODE_ENV || 'development',

  // Allowed CORS origins
  clientOrigins: process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],

  // MySQL Database Configuration
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campusos_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  },

  // JWT Security Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'campusos_secure_jwt_secret_key_development_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  },
};

module.exports = config;
