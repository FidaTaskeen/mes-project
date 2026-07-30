const ProductionEntry = require('../models/ProductionEntry');
const JobOrder = require('../models/JobOrder');
const Routing = require('../models/Routing');

// @route  GET /api/joborders/scan/:jobOrderNo
// Operator scans/looks up a job order by its number
exports.scanJobOrder = async (req, res) => {
  try {
    const jobOrder = await JobOrder.findOne({
      jobOrderNo: req.params.jobOrderNo.toUpperCase(),
    })
      .populate('item', 'itemCode name unitOfMeasure')
      .populate({
        path: 'routing',
        populate: { path: 'steps.operation', select: 'operationCode operationName workCenter' },
      });

    if (!jobOrder) {
      return res.status(404).json({ message: 'Job order not found. Check the number and try again.' });
    }

    if (jobOrder.status === 'Completed') {
      return res.status(400).json({ message: 'This job order is already completed.' });
    }

    const currentStep = jobOrder.routing.steps[jobOrder.currentOperationIndex];
    if (!currentStep) {
      return res.status(400).json({ message: 'No more operations remaining for this job order.' });
    }

    res.status(200).json({
      jobOrder,
      currentStep,
    });
  } catch (err) {
    console.error('Scan job order error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  POST /api/production-entries
// Operator submits good/reject quantity for the job order's current step
exports.createEntry = async (req, res) => {
  try {
    const { jobOrder: jobOrderId, goodQty, rejectQty, remarks } = req.body;

    if (!jobOrderId || goodQty == null) {
      return res.status(400).json({ message: 'Job order and good quantity are required' });
    }

    const jobOrder = await JobOrder.findById(jobOrderId).populate('routing');
    if (!jobOrder) {
      return res.status(404).json({ message: 'Job order not found' });
    }

    if (jobOrder.status === 'Completed') {
      return res.status(400).json({ message: 'This job order is already completed.' });
    }

    const currentStep = jobOrder.routing.steps[jobOrder.currentOperationIndex];
    if (!currentStep) {
      return res.status(400).json({ message: 'No operation step available for this job order.' });
    }

    const good = Number(goodQty) || 0;
    const reject = Number(rejectQty) || 0;

    if (good + reject <= 0) {
      return res.status(400).json({ message: 'Enter a valid good or reject quantity.' });
    }

    // Create the entry
    const entry = await ProductionEntry.create({
      jobOrder: jobOrder._id,
      operation: currentStep.operation,
      sequenceNo: currentStep.sequenceNo,
      goodQty: good,
      rejectQty: reject,
      remarks,
      operator: req.user.id,
    });

    // Update job order totals
    jobOrder.completedQuantity += good;
    jobOrder.rejectQuantity += reject;

    // Set status to In Progress if it was Planned/Released
    if (jobOrder.status === 'Planned' || jobOrder.status === 'Released') {
      jobOrder.status = 'In Progress';
    }

    // If good quantity for this step reaches the job order's target quantity,
    // move to the next operation step
    const totalProcessed = jobOrder.completedQuantity + jobOrder.rejectQuantity;
    if (totalProcessed >= jobOrder.quantity) {
      const isLastStep = jobOrder.currentOperationIndex >= jobOrder.routing.steps.length - 1;
      if (isLastStep) {
        jobOrder.status = 'Completed';
      } else {
        jobOrder.currentOperationIndex += 1;
      }
    }

    await jobOrder.save();

    const populatedEntry = await entry.populate(['operation', 'jobOrder']);

    res.status(201).json({
      message: 'Production entry recorded successfully',
      entry: populatedEntry,
      jobOrderStatus: jobOrder.status,
      currentOperationIndex: jobOrder.currentOperationIndex,
    });
  } catch (err) {
    console.error('Create production entry error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  GET /api/production-entries  (history, supports ?jobOrder=&operator=&page=&limit=)
exports.getEntries = async (req, res) => {
  try {
    const { jobOrder, operator, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (jobOrder) filter.jobOrder = jobOrder;
    if (operator) filter.operator = operator;

    // Operators can only see their own entries; admin/supervisor see all
    if (req.user.role === 'operator') {
      filter.operator = req.user.id;
    }

    const entries = await ProductionEntry.find(filter)
      .populate('jobOrder', 'jobOrderNo')
      .populate('operation', 'operationCode operationName')
      .populate('operator', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ProductionEntry.countDocuments(filter);

    res.status(200).json({
      entries,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Get entries error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  GET /api/production-entries/my-performance
exports.getMyPerformance = async (req, res) => {
  try {
    const entries = await ProductionEntry.find({ operator: req.user.id });

    const totalGood = entries.reduce((sum, e) => sum + e.goodQty, 0);
    const totalReject = entries.reduce((sum, e) => sum + e.rejectQty, 0);
    const totalEntries = entries.length;
    const efficiency =
      totalGood + totalReject > 0
        ? ((totalGood / (totalGood + totalReject)) * 100).toFixed(2)
        : '0.00';

    res.status(200).json({
      performance: {
        totalEntries,
        totalGoodQty: totalGood,
        totalRejectQty: totalReject,
        efficiencyPercent: Number(efficiency),
      },
    });
  } catch (err) {
    console.error('Get performance error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};