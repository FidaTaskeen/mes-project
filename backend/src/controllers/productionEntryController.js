const ProductionEntry = require('../models/ProductionEntry');
const JobOrder = require('../models/JobOrder');
const User = require('../models/User');
const ScanLog = require('../models/ScanLog');

// Walks backward from idx and returns the nearest step whose type is
// 'Scanning' -- No_Scanning steps (like SPI, AOI-inspection-only, etc.)
// never get ScanLog entries, so they must be skipped when finding what
// "the previous operation" means for sequence validation and Pending counts.
const findPrevScanningStep = (steps, idx) => {
  for (let i = idx - 1; i >= 0; i--) {
    if (steps[i].type === 'Scanning') return steps[i];
  }
  return null;
};

exports.scanJobOrder = async (req, res) => {
  try {
    const jobOrder = await JobOrder.findOne({
      jobOrderNo: req.params.jobOrderNo.toUpperCase(),
    })
      .populate('item', 'itemCode name unitOfMeasure description')
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

    if (jobOrder.status === 'On Hold') {
      return res.status(400).json({ message: 'This job order is currently on hold.' });
    }

    const currentStep = jobOrder.routing.steps[jobOrder.currentOperationIndex];
    if (!currentStep) {
      return res.status(400).json({ message: 'No more operations remaining for this job order.' });
    }

    if (req.user.role === 'operator') {
      const user = await User.findById(req.user.id).select('assignedOperations');
      const allowedIds = (user.assignedOperations || []).map((id) => String(id));
      const currentOpId = String(currentStep.operation._id);
      if (!allowedIds.includes(currentOpId)) {
        return res.status(403).json({
          message: `This job order's current step (${currentStep.operation.operationName}) is not assigned to you.`,
        });
      }
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

exports.createEntry = async (req, res) => {
  try {
    const { jobOrder: jobOrderId, goodQty, rejectQty, remarks } = req.body;

    if (!jobOrderId || goodQty == null) {
      return res.status(400).json({ message: 'Job order and good quantity are required' });
    }

    const jobOrder = await JobOrder.findById(jobOrderId).populate({
      path: 'routing',
      populate: { path: 'steps.operation', select: 'operationCode operationName workCenter' },
    });
    if (!jobOrder) {
      return res.status(404).json({ message: 'Job order not found' });
    }

    if (jobOrder.status === 'Completed') {
      return res.status(400).json({ message: 'This job order is already completed.' });
    }

    if (jobOrder.status === 'On Hold') {
      return res.status(400).json({ message: 'This job order is currently on hold.' });
    }

    const currentStep = jobOrder.routing.steps[jobOrder.currentOperationIndex];
    if (!currentStep) {
      return res.status(400).json({ message: 'No operation step available for this job order.' });
    }

    if (req.user.role === 'operator') {
      const user = await User.findById(req.user.id).select('assignedOperations');
      const allowedIds = (user.assignedOperations || []).map((id) => String(id));
      const currentOpId = String(currentStep.operation._id);
      if (!allowedIds.includes(currentOpId)) {
        return res.status(403).json({
          message: `This job order's current step (${currentStep.operation.operationName}) is not assigned to you.`,
        });
      }
    }

    const good = Number(goodQty) || 0;
    const reject = Number(rejectQty) || 0;

    if (good + reject <= 0) {
      return res.status(400).json({ message: 'Enter a valid good or reject quantity.' });
    }

    const entry = await ProductionEntry.create({
      jobOrder: jobOrder._id,
      operation: currentStep.operation._id,
      sequenceNo: currentStep.sequenceNo,
      goodQty: good,
      rejectQty: reject,
      remarks,
      operator: req.user.id,
    });

    jobOrder.completedQuantity += good;
    jobOrder.rejectQuantity += reject;

    if (jobOrder.status === 'Planned' || jobOrder.status === 'Released') {
      jobOrder.status = 'In Progress';
    }

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

exports.getEntries = async (req, res) => {
  try {
    const { jobOrder, operator, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (jobOrder) filter.jobOrder = jobOrder;
    if (operator) filter.operator = operator;

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

exports.getTodaySummary = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysEntries = await ProductionEntry.find({
      operator: req.user.id,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const completedQty = todaysEntries.reduce((sum, e) => sum + e.goodQty, 0);
    const rejectQty = todaysEntries.reduce((sum, e) => sum + e.rejectQty, 0);

    const user = await User.findById(req.user.id).select('assignedOperations');
    const allowedIds = (user.assignedOperations || []).map((id) => String(id));

    const activeJobOrders = await JobOrder.find({
      status: { $in: ['Planned', 'Released', 'In Progress'] },
    }).populate({
      path: 'routing',
      populate: { path: 'steps.operation', select: '_id' },
    });

    let target = 0;
    activeJobOrders.forEach((jo) => {
      if (!jo.routing || !jo.routing.steps) return;
      const step = jo.routing.steps[jo.currentOperationIndex];
      if (step && step.operation && allowedIds.includes(String(step.operation._id))) {
        target += jo.quantity - jo.completedQuantity - jo.rejectQuantity;
      }
    });

    res.status(200).json({
      summary: {
        todaysTarget: target,
        completedQty,
        rejectQty,
      },
    });
  } catch (err) {
    console.error('Today summary error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// Legacy queue - kept for anything still referencing it (Dashboard's "Active Orders" count etc.)
exports.getMyQueue = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('assignedOperations');
    const allowedIds = (user.assignedOperations || []).map((id) => String(id));

    if (allowedIds.length === 0) {
      return res.status(200).json({ queue: [] });
    }

    const activeJobOrders = await JobOrder.find({
      status: { $in: ['Planned', 'Released', 'In Progress'] },
    })
      .populate('item', 'itemCode name')
      .populate({
        path: 'routing',
        populate: { path: 'steps.operation', select: 'operationCode operationName workCenter' },
      });

    const queue = [];
    activeJobOrders.forEach((jo) => {
      if (!jo.routing || !jo.routing.steps) return;
      const step = jo.routing.steps[jo.currentOperationIndex];
      if (!step || !step.operation) return;

      const stepOpId = String(step.operation._id || step.operation);

      if (allowedIds.includes(stepOpId)) {
        queue.push({
          jobOrderId: jo._id,
          jobOrderNo: jo.jobOrderNo,
          item: jo.item,
          quantity: jo.quantity,
          completedQuantity: jo.completedQuantity,
          rejectQuantity: jo.rejectQuantity,
          remainingQuantity: jo.quantity - jo.completedQuantity - jo.rejectQuantity,
          currentOperation: step.operation,
          dueDate: jo.dueDate,
        });
      }
    });

    res.status(200).json({ queue });
  } catch (err) {
    console.error('My queue error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// Returns EVERY job order whose routing includes the given operation.
// Pending is computed against the nearest PREVIOUS SCANNING step (skipping
// any No_Scanning steps like SPI in between), since those never get scans.
exports.getOperationQueue = async (req, res) => {
  try {
    const { operationId } = req.params;

    if (req.user.role === 'operator') {
      const user = await User.findById(req.user.id).select('assignedOperations');
      const allowedIds = (user.assignedOperations || []).map((id) => String(id));
      if (!allowedIds.includes(String(operationId))) {
        return res.status(403).json({ message: 'This operation is not assigned to you.' });
      }
    }

    const jobOrders = await JobOrder.find({})
      .populate('item', 'itemCode name description')
      .populate({
        path: 'routing',
        populate: { path: 'steps.operation', select: 'operationCode operationName workCenter' },
      })
      .sort({ createdAt: -1 });

    const results = [];

    for (const jo of jobOrders) {
      if (!jo.routing || !jo.routing.steps || jo.routing.steps.length === 0) continue;

      const steps = jo.routing.steps;
      const idx = steps.findIndex(
        (s) => String(s.operation?._id || s.operation) === String(operationId)
      );
      if (idx === -1) continue;

      const thisOp = steps[idx].operation;

      const producedHere = await ScanLog.countDocuments({
        jobOrder: jo._id,
        operation: thisOp._id,
        status: 'Pass',
      });

      let pending;
      const prevScanningStep = findPrevScanningStep(steps, idx);
      if (!prevScanningStep) {
        // no scanning step before this one -> everything ordered is "available"
        pending = jo.quantity - producedHere;
      } else {
        const prevOp = prevScanningStep.operation;
        const producedPrev = await ScanLog.countDocuments({
          jobOrder: jo._id,
          operation: prevOp._id,
          status: 'Pass',
        });
        pending = producedPrev - producedHere;
      }
      if (pending < 0) pending = 0;

      let balance = jo.quantity - producedHere;
      if (balance < 0) balance = 0;

      let stationStatus = 'Open';
      if (producedHere >= jo.quantity) stationStatus = 'Completed';
      else if (producedHere > 0) stationStatus = 'InProgress';

      results.push({
        jobOrderId: jo._id,
        jobOrderNo: jo.jobOrderNo,
        item: jo.item,
        quantity: jo.quantity,
        producedQuantity: producedHere,
        pendingQuantity: pending,
        balanceQuantity: balance,
        stationStatus,
        jobOrderStatus: jo.status,
        operation: thisOp,
        scanType: steps[idx].type,
        dueDate: jo.dueDate,
      });
    }

    res.status(200).json({ queue: results });
  } catch (err) {
    console.error('Operation queue error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};