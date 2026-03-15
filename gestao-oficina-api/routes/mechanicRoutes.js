const express = require('express');
const router = express.Router();
const mechanicController = require('../controllers/mechanicController');

// CRUD
router.get('/', mechanicController.getAll);
router.get('/commission-report', mechanicController.getCommissionReport);
router.get('/:id', mechanicController.getById);
router.get('/:id/os', mechanicController.getMechanicOsList);
router.post('/', mechanicController.create);
router.put('/:id', mechanicController.update);
router.delete('/:id', mechanicController.delete);

module.exports = router;
