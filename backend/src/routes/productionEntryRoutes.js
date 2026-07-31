const express = require('express');
const router = express.Router();
const {
  createEntry,
  getEntries,
  getMyPerformance,
  getTodaySummary,
} = require('../controllers/productionEntryController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/my-performance', getMyPerformance);
router.get('/today-summary', getTodaySummary);
router.get('/', getEntries);
router.post('/', createEntry);

module.exports = router;