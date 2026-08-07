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

// All item routes require login
router.use(protect);

// Get all items (used by Admin, BOM, Routing, Supervisor)
router.get('/', getItems);

// Get only active items (for dropdowns)
router.get('/active/list', async (req, res) => {
  try {
    const Item = require('../models/Item');

    const items = await Item.find({
      status: 'Active',
    }).sort({ itemCode: 1 });

    res.status(200).json({
      items,
    });
  } catch (err) {
    console.error('Get active items error:', err.message);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
});

// Get single item
router.get('/:id', getItemById);

// Create item (Admin only)
router.post('/', authorize('admin'), createItem);

// Update item (Admin only)
router.put('/:id', authorize('admin'), updateItem);

// Delete item (Admin only)
router.delete('/:id', authorize('admin'), deleteItem);

module.exports = router;