const AuthService = require('../services/auth.service');
const { asyncHandler } = require('../utils/errors');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await AuthService.register({ name, email, password });
  res.status(201).json({ success: true, data: result });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await AuthService.login({ email, password });
  res.status(200).json({ success: true, data: result });
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = AuthService.getProfile(req.user.id);
  res.status(200).json({ success: true, data: profile });
});

module.exports = { register, login, getProfile };
