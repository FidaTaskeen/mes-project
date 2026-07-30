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
router.get('/:id', getOperationById);
router.post('/', authorize('admin'), createOperation);
router.put('/:id', authorize('admin'), updateOperation);
router.delete('/:id', authorize('admin'), deleteOperation);

module.exports = router;