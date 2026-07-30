const express = require('express');
const router = express.Router();
const {
  createBOM,
  getBOMs,
  getBOMById,
  updateBOM,
  deleteBOM,
} = require('../controllers/bomController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getBOMs);
router.get('/:id', getBOMById);
router.post('/', authorize('admin'), createBOM);
router.put('/:id', authorize('admin'), updateBOM);
router.delete('/:id', authorize('admin'), deleteBOM);

module.exports = router;