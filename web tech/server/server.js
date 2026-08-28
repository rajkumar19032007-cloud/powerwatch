require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const buildingRoutes = require('./routes/buildingRoutes');
const roomRoutes = require('./routes/roomRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const navigationRoutes = require('./routes/navigationRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const eventRoutes = require('./routes/eventRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const prisma = require('./utils/prisma');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Trust reverse proxy in production (for accurate rate limiting & HTTPS headers)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false, // Allows WebGL Three.js canvas shaders & WebXR without inline script restrictions
  })
);

// Robust Production-Ready CORS Handler
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman, same-origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes('*')) {
        // Reflect origin so credentials: true works without browser CORS header conflict
        return callback(null, origin);
      }

      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        return callback(new Error(`CORS origin policy blocked request from ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (!isProduction) {
  app.use(morgan('dev'));
}

// Global API Rate Limiter
app.use('/api', apiLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'CampusLens AR Navigation API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);

// Optional Static Serving for Full-Stack Production Deployments
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback for all non-API GET requests
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 Route Handler for unmatched API endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} — Endpoint not found on CampusLens API.`,
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🚀 CampusLens Server active on port ${PORT}`);
  console.log(`🌐 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: /api/health`);
  console.log(`=============================================`);
});

// Graceful Shutdown on SIGINT and SIGTERM
const shutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down server gracefully...`);
  await prisma.$disconnect();
  server.close(() => {
    console.log('CampusLens Server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app;
