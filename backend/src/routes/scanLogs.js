const express = require('express');
const router = express.Router();
const { createScanLog, getScanLogs } = require('../controllers/scanLogController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getScanLogs);
router.post('/', createScanLog);

module.exports = router;