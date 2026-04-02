const express = require('express');
const router = express.Router();
const osController = require('../controllers/osController');

const validate = require('../middleware/validate');
const osValidator = require('../validators/osValidator');

router.get('/', osController.getAll);
router.get('/vehicle/:vehicleId', osController.getByVehicle);
router.get('/:id', osController.getById);
router.post('/', validate(osValidator.create), osController.create);
router.put('/:id', validate(osValidator.update), osController.update);
router.get('/:id/parts', osController.getParts);
/**
 * Gerenciamento de Itens/Peças da OS
 * Cada operação agora passa por validação rigorosa de esquema Zod para prevenir corrupção de dados.
 */
router.post('/:id/parts', validate(osValidator.addPart), osController.addPart);
router.patch('/:id/parts/:partId', validate(osValidator.updatePart), osController.updatePartQuantity);
router.delete('/:id/parts/:partId', osController.removePart);

module.exports = router;

