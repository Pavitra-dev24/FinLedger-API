const UserService = require('../services/user.service');
const { asyncHandler } = require('../utils/errors');

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, role, status } = req.query;
  const result = UserService.listUsers({
    page:   parseInt(page, 10)  || 1,
    limit:  parseInt(limit, 10) || 20,
    role,
    status,
  });
  res.status(200).json({ success: true, data: result });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = UserService.getUserById(req.params.id);
  res.status(200).json({ success: true, data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const updated = await UserService.updateUser(
    req.params.id,
    req.body,
    req.user
  );
  res.status(200).json({ success: true, data: updated });
});

const setUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updated = UserService.setStatus(req.params.id, status, req.user);
  res.status(200).json({ success: true, data: updated });
});

module.exports = { listUsers, getUserById, updateUser, setUserStatus };
