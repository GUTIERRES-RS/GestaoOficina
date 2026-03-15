const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');

router.get('/', financeController.getAll);
router.get('/summary', financeController.getSummary);
router.get('/reminders', financeController.getReminders);
router.post('/', financeController.create);
router.put('/:id', financeController.update);
router.delete('/:id', financeController.delete);

module.exports = router;
