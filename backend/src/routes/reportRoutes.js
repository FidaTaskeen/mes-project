const express = require('express');
const router = express.Router();
const {
  getProductionReport,
  getJobOrderSummaryReport,
  getOperatorPerformanceReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'supervisor')); // reports are for admin/supervisor only

router.get('/production', getProductionReport);
router.get('/job-order-summary', getJobOrderSummaryReport);
router.get('/operator-performance', getOperatorPerformanceReport);

module.exports = router;