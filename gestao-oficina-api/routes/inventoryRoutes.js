const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

const validate = require('../middleware/validate');
const inventoryValidator = require('../validators/inventoryValidator');

router.get('/', inventoryController.getAll);
router.get('/movements', inventoryController.getMovements);
router.get('/:id', inventoryController.getById);

// Rotas com validação Zod
router.post('/', validate(inventoryValidator.create), inventoryController.create);
router.put('/:id', validate(inventoryValidator.update), inventoryController.update);
router.post('/:id/adjust', validate(inventoryValidator.adjust), inventoryController.adjust);
router.delete('/:id', inventoryController.remove);

module.exports = router;
