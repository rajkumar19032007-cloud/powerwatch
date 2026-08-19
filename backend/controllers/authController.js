/**
 * CampusOS Backend — Authentication Controller (controllers/authController.js)
 * Phase 10: Authentication & Role-Based Access
 * Handles user login verification, bcrypt comparison, and JWT issuance.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { query } = require('../config/db');

/**
 * User Login Handler
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Input Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // 2. Query user record from MySQL
    const sql = `
      SELECT 
        id, 
        first_name, 
        last_name, 
        email, 
        password_hash, 
        role, 
        department_id 
      FROM users 
      WHERE email = ? 
      LIMIT 1
    `;
    const users = await query(sql, [email.trim().toLowerCase()]);

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = users[0];

    // 3. Compare password with bcrypt hash
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 4. Generate JSON Web Token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: `${user.first_name} ${user.last_name}`,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    // 5. Return safe response (NEVER send password_hash)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          department_id: user.department_id,
        },
      },
    });
  } catch (error) {
    console.error('[CampusOS Login Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};

/**
 * Get Authenticated User Profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const sql = `
      SELECT 
        u.id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.role, 
        u.department_id,
        d.name AS department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
      LIMIT 1
    `;
    const users = await query(sql, [req.user.id]);

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const user = users[0];

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        department: user.department_name || 'Central Administration',
      },
    });
  } catch (error) {
    console.error('[CampusOS GetMe Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve user profile.',
    });
  }
};

module.exports = {
  login,
  getMe,
};
