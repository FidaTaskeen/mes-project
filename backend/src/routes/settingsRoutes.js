const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getSettings); // anyone logged in can view settings
router.put('/', authorize('admin'), updateSettings); // only admin can change settings

module.exports = router;