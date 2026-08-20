const express = require('express');
const router = express.Router();
const {
  getTrcQueue, getTrcById, checkIn, checkOut, updateReworkDetails,
} = require('../controllers/trcController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('rework', 'admin')); // admin can view too, only rework role normally uses it

router.get('/', getTrcQueue);
router.get('/:id', getTrcById);
router.put('/:id', updateReworkDetails);
router.put('/:id/check-in', checkIn);
router.put('/:id/check-out', checkOut);

module.exports = router;