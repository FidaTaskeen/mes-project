const express = require('express');
const router = express.Router();
const {
  createEntry,
  getEntries,
  getMyPerformance,
} = require('../controllers/productionEntryController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/my-performance', getMyPerformance);
router.get('/', getEntries);
router.post('/', createEntry);

module.exports = router;