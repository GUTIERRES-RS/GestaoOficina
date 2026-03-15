const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/', inventoryController.getAll);
router.get('/movements', inventoryController.getMovements);
router.get('/:id', inventoryController.getById);
router.post('/', inventoryController.create);
router.put('/:id', inventoryController.update);
router.post('/:id/adjust', inventoryController.adjust);
router.delete('/:id', inventoryController.remove);

module.exports = router;
