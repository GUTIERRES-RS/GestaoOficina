const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const validate = require('../middleware/validate');
const financeValidator = require('../validators/financeValidator');

/**
 * Rotas de Gestão Financeira
 * Gerenciam o fluxo de caixa, resumo de faturamento e lembretes de pagamento.
 */
router.get('/', financeController.getAll);
router.get('/summary', financeController.getSummary);
router.get('/reminders', financeController.getReminders);

// Criação e atualização com validação de esquema Zod
router.post('/', validate(financeValidator.create), financeController.create);
router.put('/:id', validate(financeValidator.update), financeController.update);
router.delete('/:id', financeController.delete);

module.exports = router;
