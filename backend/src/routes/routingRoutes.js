const express = require('express');
const router = express.Router();

const {
  createRouting,
  getRoutings,
  getRoutingById,
  updateRouting,
  deleteRouting,
} = require('../controllers/routingController');

const { protect, authorize } = require('../middleware/auth');

// All routing routes require login
router.use(protect);

// Get all routings (Admin, Supervisor, Operator)
router.get('/', getRoutings);

// Get routing by ID
router.get('/:id', getRoutingById);

// Create routing (Admin only)
router.post('/', authorize('admin'), createRouting);

// Update routing (Admin only)
router.put('/:id', authorize('admin'), updateRouting);

// Delete routing (Admin only)
router.delete('/:id', authorize('admin'), deleteRouting);

module.exports = router;