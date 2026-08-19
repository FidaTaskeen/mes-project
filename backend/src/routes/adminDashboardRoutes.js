const express = require('express');
const router = express.Router();
const { getAdminDashboardSummary } = require('../controllers/adminDashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard-summary', getAdminDashboardSummary);

module.exports = router;
