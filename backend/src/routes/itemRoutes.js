const express = require('express');
const router = express.Router();
const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} = require('../controllers/itemController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // all item routes require login

router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', authorize('admin'), createItem);
router.put('/:id', authorize('admin'), updateItem);
router.delete('/:id', authorize('admin'), deleteItem);

module.exports = router;