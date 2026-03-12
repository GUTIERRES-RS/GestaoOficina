const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/', settingsController.get);
router.put('/', settingsController.update);

module.exports = router;
