const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { sendSuccess, sendError } = require('../utils/response');
const { generateToken } = require('../utils/jwt');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'STUDENT', department } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Please provide name, email, and password.', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long.', 400);
    }

    // Role security: Regular users CANNOT self-register as ADMIN
    let assignedRole = 'STUDENT';
    if (role === 'STAFF') {
      assignedRole = 'STAFF';
    }

    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return sendError(res, 'An account with this email address already exists.', 409);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: assignedRole,
        department: department || 'General Studies',
        avatar: 'avatar-cyan',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        avatar: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id, user.role);

    return sendSuccess(
      res,
      { user, token },
      'Account created successfully.',
      201
    );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Please provide email and password.', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return sendError(res, 'Invalid credentials.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials.', 401);
    }

    const token = generateToken(user.id, user.role);

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };

    return sendSuccess(res, { user: userPayload, token }, 'Logged in successfully.');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  return sendSuccess(res, { user: req.user }, 'User profile retrieved.');
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, department, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(department && { department: department.trim() }),
        ...(avatar && { avatar }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        avatar: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, { user: updatedUser }, 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  // Stateless JWT logout confirmation
  return sendSuccess(res, null, 'Logged out successfully.');
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  logout,
};
