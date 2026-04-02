const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const validate = require('../middleware/validate');
const authValidator = require('../validators/authValidator');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', validate(authValidator.login), authController.login);
router.post('/refresh', validate(authValidator.refresh), authController.refresh);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
