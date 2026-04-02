const express = require('express');
const router = express.Router();
const mechanicController = require('../controllers/mechanicController');

// CRUD
const validate = require('../middleware/validate');
const mechanicValidator = require('../validators/mechanicValidator');

router.get('/', mechanicController.getAll);
router.get('/commission-report', mechanicController.getCommissionReport);
router.get('/:id', mechanicController.getById);
router.get('/:id/os', mechanicController.getMechanicOsList);
router.post('/', validate(mechanicValidator.create), mechanicController.create);
router.put('/:id', validate(mechanicValidator.update), mechanicController.update);
router.delete('/:id', mechanicController.delete);

module.exports = router;
