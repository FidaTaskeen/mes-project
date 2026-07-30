const express = require('express');
const router = express.Router();
const { exportBackup, restoreBackup } = require('../controllers/backupController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin')); // backup/restore is admin-only

router.get('/export', exportBackup);
router.post('/restore', restoreBackup);

module.exports = router;