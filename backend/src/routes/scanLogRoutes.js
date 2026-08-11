const express = require('express');
const router = express.Router();
const { getJobOrderStatus, addScan, getScanLogs, getMyStats, deleteScanLog } = require('../controllers/scanLogController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/my-stats', getMyStats);
router.get('/job-order-status/:jobOrderId', getJobOrderStatus);
router.get('/', getScanLogs);
router.post('/', addScan);
router.delete('/:id', authorize('admin'), deleteScanLog);

module.exports = router;