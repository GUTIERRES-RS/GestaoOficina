const express = require('express');
const router = express.Router();
const osController = require('../controllers/osController');

router.get('/', osController.getAll);
router.get('/vehicle/:vehicleId', osController.getByVehicle);  // must be before /:id
router.get('/:id', osController.getById);
router.post('/', osController.create);
router.put('/:id', osController.update);
router.get('/:id/parts', osController.getParts);
router.post('/:id/parts', osController.addPart);
router.patch('/:id/parts/:partId', osController.updatePartQuantity);
router.delete('/:id/parts/:partId', osController.removePart);

module.exports = router;

