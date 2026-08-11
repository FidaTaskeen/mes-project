const express = require('express');
const router = express.Router();
const { getJobOrderStatus, addScan, getScanLogs, getMyStats } = require('../controllers/scanLogController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/my-stats', getMyStats);
router.get('/job-order-status/:jobOrderId', getJobOrderStatus);
router.get('/', getScanLogs);
router.post('/', addScan);

module.exports = router;