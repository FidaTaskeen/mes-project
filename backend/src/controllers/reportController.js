const ProductionEntry = require('../models/ProductionEntry');
const JobOrder = require('../models/JobOrder');

// Helper to get date range boundaries
const getDateRange = (period, dateStr) => {
  const baseDate = dateStr ? new Date(dateStr) : new Date();
  let start, end;

  if (period === 'daily') {
    start = new Date(baseDate.setHours(0, 0, 0, 0));
    end = new Date(baseDate.setHours(23, 59, 59, 999));
  } else if (period === 'weekly') {
    const day = baseDate.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start = new Date(baseDate);
    start.setDate(baseDate.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'monthly') {
    start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { start, end };
};

// @route  GET /api/reports/production?period=daily|weekly|monthly&date=YYYY-MM-DD
exports.getProductionReport = async (req, res) => {
  try {
    const { period = 'daily', date } = req.query;

    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ message: 'Period must be daily, weekly, or monthly' });
    }

    const { start, end } = getDateRange(period, date);

    const entries = await ProductionEntry.find({
      createdAt: { $gte: start, $lte: end },
    })
      .populate('jobOrder', 'jobOrderNo')
      .populate('operation', 'operationCode operationName workCenter')
      .populate('operator', 'name');

    const totalGood = entries.reduce((sum, e) => sum + e.goodQty, 0);
    const totalReject = entries.reduce((sum, e) => sum + e.rejectQty, 0);
    const totalEntries = entries.length;
    const efficiency =
      totalGood + totalReject > 0
        ? ((totalGood / (totalGood + totalReject)) * 100).toFixed(2)
        : '0.00';

    res.status(200).json({
      period,
      range: { start, end },
      summary: {
        totalEntries,
        totalGoodQty: totalGood,
        totalRejectQty: totalReject,
        efficiencyPercent: Number(efficiency),
      },
      entries,
    });
  } catch (err) {
    console.error('Production report error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  GET /api/reports/job-order-summary
// Overall summary across all job orders (for Admin/Supervisor overview)
exports.getJobOrderSummaryReport = async (req, res) => {
  try {
    const jobOrders = await JobOrder.find()
      .populate('item', 'itemCode name')
      .sort({ createdAt: -1 });

    const report = jobOrders.map((jo) => ({
      jobOrderNo: jo.jobOrderNo,
      item: jo.item,
      quantity: jo.quantity,
      completedQuantity: jo.completedQuantity,
      rejectQuantity: jo.rejectQuantity,
      status: jo.status,
      startDate: jo.startDate,
      dueDate: jo.dueDate,
      isOverdue: jo.status !== 'Completed' && new Date(jo.dueDate) < new Date(),
    }));

    res.status(200).json({ report, total: report.length });
  } catch (err) {
    console.error('Job order summary report error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  GET /api/reports/operator-performance
// Performance across all operators (Admin/Supervisor view)
exports.getOperatorPerformanceReport = async (req, res) => {
  try {
    const entries = await ProductionEntry.find().populate('operator', 'name email');

    const grouped = {};
    entries.forEach((e) => {
      const opId = String(e.operator._id);
      if (!grouped[opId]) {
        grouped[opId] = {
          operator: { id: opId, name: e.operator.name, email: e.operator.email },
          totalEntries: 0,
          totalGoodQty: 0,
          totalRejectQty: 0,
        };
      }
      grouped[opId].totalEntries += 1;
      grouped[opId].totalGoodQty += e.goodQty;
      grouped[opId].totalRejectQty += e.rejectQty;
    });

    const report = Object.values(grouped).map((r) => ({
      ...r,
      efficiencyPercent:
        r.totalGoodQty + r.totalRejectQty > 0
          ? Number(((r.totalGoodQty / (r.totalGoodQty + r.totalRejectQty)) * 100).toFixed(2))
          : 0,
    }));

    res.status(200).json({ report, total: report.length });
  } catch (err) {
    console.error('Operator performance report error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};