const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const { AppError } = require('../utils/errors');

const UserService = {
  listUsers(filters) {
    const result = UserModel.findAll(filters);
    return {
      ...result,
      users: result.users.map((u) => UserModel.sanitize(u)),
    };
  },

  getUserById(id) {
    const user = UserModel.findById(id);
    if (!user) throw new AppError('User not found.', 404);
    return UserModel.sanitize(user);
  },

  async updateUser(id, fields, requestingUser) {
    const target = UserModel.findById(id);
    if (!target) throw new AppError('User not found.', 404);

    
    if (fields.role && requestingUser.role !== 'admin') {
      throw new AppError('Only admins can change user roles.', 403);
    }

    
    if (
      requestingUser.id === id &&
      fields.role &&
      fields.role !== 'admin'
    ) {
      throw new AppError('You cannot change your own role.', 403);
    }

    
    if (fields.password) {
      fields.password = await bcrypt.hash(fields.password, 12);
    }

    
    if (fields.email && fields.email !== target.email) {
      const existing = UserModel.findByEmail(fields.email);
      if (existing) throw new AppError('That email is already in use.', 409);
    }

    const updated = UserModel.patch(id, fields);
    return UserModel.sanitize(updated);
  },

  setStatus(id, status, requestingUser) {
    if (requestingUser.id === id) {
      throw new AppError('You cannot change your own account status.', 403);
    }
    const user = UserModel.findById(id);
    if (!user) throw new AppError('User not found.', 404);

    const updated = UserModel.patch(id, { status });
    return UserModel.sanitize(updated);
  },
};

module.exports = UserService;
