const express = require('express');
const router = express.Router();
const {
  createOperation,
  getOperations,
  getOperationById,
  updateOperation,
  deleteOperation,
} = require('../controllers/operationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getOperations);

// Get only active operations (for Routing's operation picker)
router.get('/active/list', async (req, res) => {
  try {
    const Operation = require('../models/Operation');
    const operations = await Operation.find({ status: 'Active' }).sort({ operationCode: 1 });
    res.status(200).json({ operations });
  } catch (err) {
    console.error('Get active operations error:', err.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/:id', getOperationById);
router.post('/', authorize('admin'), createOperation);
router.put('/:id', authorize('admin'), updateOperation);
router.delete('/:id', authorize('admin'), deleteOperation);

module.exports = router;