const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');

router.get('/test', (req, res) => res.json({ message: 'Vehicle API is reachable' }));
const validate = require('../middleware/validate');
const vehicleValidator = require('../validators/vehicleValidator');

router.get('/', vehicleController.getAll);
router.get('/client/:clientId', vehicleController.getByClient);
router.post('/', validate(vehicleValidator.create), vehicleController.create);
router.put('/:id', validate(vehicleValidator.update), vehicleController.update);
router.delete('/:id', vehicleController.delete);

module.exports = router;
