const express = require('express');
const router = express.Router();
const {
  createJobOrder,
  getJobOrders,
  getJobOrderById,
  updateJobOrder,
  deleteJobOrder,
  getDashboardSummary,
  getProductionMonitoring,
} = require('../controllers/jobOrderController');
const { scanJobOrder, getMyQueue } = require('../controllers/productionEntryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard/summary', getDashboardSummary);
router.get('/monitoring/overview', getProductionMonitoring);
router.get('/my-queue', getMyQueue);
router.get('/scan/:jobOrderNo', scanJobOrder);
router.get('/', getJobOrders);
router.get('/:id', getJobOrderById);
router.post('/', authorize('admin', 'supervisor'), createJobOrder);
router.put('/:id', authorize('admin', 'supervisor'), updateJobOrder);
router.delete('/:id', authorize('admin', 'supervisor'), deleteJobOrder);

module.exports = router;