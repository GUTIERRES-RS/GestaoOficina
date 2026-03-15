const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET /api/users - List all users
router.get('/', userController.getAllUsers);

// POST /api/users - Create a new user
router.post('/', userController.createUser);

// PUT /api/users/:id - Update an existing user
router.put('/:id', userController.updateUser);

// PUT /api/users/profile/:id - Update own profile (no role change)
router.put('/profile/:id', userController.updateProfile);

// DELETE /api/users/:id - Delete a user
router.delete('/:id', userController.deleteUser);

module.exports = router;
