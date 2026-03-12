const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');

router.get('/test', (req, res) => res.json({ message: 'Vehicle API is reachable' }));
router.get('/', vehicleController.getAll);
router.get('/client/:clientId', vehicleController.getByClient);
router.post('/', vehicleController.create);
router.put('/:id', vehicleController.update);
router.delete('/:id', vehicleController.delete);

module.exports = router;
