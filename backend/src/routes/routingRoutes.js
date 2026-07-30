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

router.use(protect);

router.get('/', getRoutings);
router.get('/:id', getRoutingById);
router.post('/', authorize('admin'), createRouting);
router.put('/:id', authorize('admin'), updateRouting);
router.delete('/:id', authorize('admin'), deleteRouting);

module.exports = router;