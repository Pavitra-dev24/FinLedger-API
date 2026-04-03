const express = require('express');
const router  = express.Router();

const { register, login, getProfile } = require('../controllers/auth.controller');
const { authenticate }                = require('../middleware/auth');
const { validate }                    = require('../middleware/validate');
const { registerRules, loginRules }   = require('../validators/auth.validator');

router.post('/register', registerRules, validate, register);

router.post('/login', loginRules, validate, login);

router.get('/me', authenticate, getProfile);

module.exports = router;
