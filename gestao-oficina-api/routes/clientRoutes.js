const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

const validate = require('../middleware/validate');
const clientValidator = require('../validators/clientValidator');

router.get('/', clientController.getAll);
router.get('/:id', clientController.getById);
router.post('/', validate(clientValidator.create), clientController.create);
router.put('/:id', validate(clientValidator.update), clientController.update);
router.delete('/:id', clientController.delete);

module.exports = router;
