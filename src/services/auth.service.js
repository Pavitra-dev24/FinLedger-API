const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { AppError } = require('../utils/errors');

const AuthService = {
  async register({ name, email, password }) {
    
    
    
    const role = 'viewer';

    const existing = UserModel.findByEmail(email);
    if (existing) {
      throw new AppError('An account with that email already exists.', 409);
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = UserModel.create({ name, email, password: hashed, role });

    return {
      user: UserModel.sanitize(user),
      token: this._signToken(user),
    };
  },

  async login({ email, password }) {
    const user = UserModel.findByEmail(email);

    
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (user.status === 'inactive') {
      throw new AppError('Your account has been deactivated. Contact an administrator.', 403);
    }

    return {
      user: UserModel.sanitize(user),
      token: this._signToken(user),
    };
  },

  _signToken(user) {
    return jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  },

  getProfile(userId) {
    const user = UserModel.findById(userId);
    if (!user) throw new AppError('User not found.', 404);
    return UserModel.sanitize(user);
  },
};

module.exports = AuthService;
