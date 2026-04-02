const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const userValidator = require('../validators/userValidator');

// GET /api/users - List all users
router.get('/', userController.getAllUsers);

// POST /api/users - Create a new user
router.post('/', validate(userValidator.create), userController.createUser);

// PUT /api/users/:id - Update an existing user
router.put('/:id', validate(userValidator.update), userController.updateUser);

// PUT /api/users/profile/:id - Update own profile (no role change)
router.put('/profile/:id', validate(userValidator.update), userController.updateProfile);

// DELETE /api/users/:id - Delete a user
router.delete('/:id', userController.deleteUser);

module.exports = router;
