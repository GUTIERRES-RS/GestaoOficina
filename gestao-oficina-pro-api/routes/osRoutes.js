const express = require('express');
const router = express.Router();
const osController = require('../controllers/osController');

router.get('/', osController.getAll);
router.get('/vehicle/:vehicleId', osController.getByVehicle);  // must be before /:id
router.get('/:id', osController.getById);
router.post('/', osController.create);
router.put('/:id', osController.update);

module.exports = router;

