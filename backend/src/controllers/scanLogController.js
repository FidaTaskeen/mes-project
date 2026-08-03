const ScanLog = require('../models/ScanLog');
const JobOrder = require('../models/JobOrder');
const User = require('../models/User');

// @route  GET /api/scanlogs/job-order-status/:jobOrderId
// Returns header info + Total/Pending/Completed/Balance counts, like the reference screen
exports.getJobOrderStatus = async (req, res) => {
  try {
    const jobOrder = await JobOrder.findById(req.params.jobOrderId)
      .populate('item', 'itemCode name description unitOfMeasure')
      .populate({
        path: 'routing',
        populate: { path: 'steps.operation', select: 'operationCode operationName workCenter' },
      });

    if (!jobOrder) return res.status(404).json({ message: 'Job order not found' });

    const currentStep = jobOrder.routing.steps[jobOrder.currentOperationIndex];

    if (req.user.role === 'operator') {
      const user = await User.findById(req.user.id).select('assignedOperations');
      const allowedIds = (user.assignedOperations || []).map((id) => String(id));
      if (!currentStep || !allowedIds.includes(String(currentStep.operation._id))) {
        return res.status(403).json({ message: 'This job order is not at an operation assigned to you.' });
      }
    }

    const completed = jobOrder.completedQuantity;
    const rejected = jobOrder.rejectQuantity;
    const total = jobOrder.quantity;
    const pending = total - completed - rejected;

    res.status(200).json({
      jobOrder: {
        _id: jobOrder._id,
        jobOrderNo: jobOrder.jobOrderNo,
        item: jobOrder.item,
        quantity: total,
        status: jobOrder.status,
      },
      currentOperation: currentStep ? currentStep.operation : null,
      counts: {
        total,
        pending: pending < 0 ? 0 : pending,
        completed,
        balance: pending < 0 ? 0 : pending,
      },
    });
  } catch (err) {
    console.error('Job order status error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  POST /api/scanlogs
// Scans one serial number as Pass or Fail, updates job order progress
exports.addScan = async (req, res) => {
  try {
    const { jobOrder: jobOrderId, serialId, status } = req.body;

    if (!jobOrderId || !serialId || !status) {
      return res.status(400).json({ message: 'Job order, serial ID, and status are required' });
    }
    if (!['Pass', 'Fail'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Pass or Fail' });
    }

    const jobOrder = await JobOrder.findById(jobOrderId).populate({
      path: 'routing',
      populate: { path: 'steps.operation', select: 'operationCode operationName' },
    });
    if (!jobOrder) return res.status(404).json({ message: 'Job order not found' });

    if (jobOrder.status === 'Completed') {
      return res.status(400).json({ message: 'This job order is already completed.' });
    }

    const currentStep = jobOrder.routing.steps[jobOrder.currentOperationIndex];
    if (!currentStep) {
      return res.status(400).json({ message: 'No operation step available for this job order.' });
    }

    if (req.user.role === 'operator') {
      const user = await User.findById(req.user.id).select('assignedOperations');
      const allowedIds = (user.assignedOperations || []).map((id) => String(id));
      if (!allowedIds.includes(String(currentStep.operation._id))) {
        return res.status(403).json({ message: 'This operation is not assigned to you.' });
      }
    }

    const existingSerial = await ScanLog.findOne({ jobOrder: jobOrderId, serialId });
    if (existingSerial) {
      return res.status(409).json({ message: 'This serial number has already been scanned for this job order.' });
    }

    const log = await ScanLog.create({
      jobOrder: jobOrderId,
      operation: currentStep.operation._id,
      serialId,
      status,
      scannedBy: req.user.id,
    });

    if (status === 'Pass') {
      jobOrder.completedQuantity += 1;
    } else {
      jobOrder.rejectQuantity += 1;
    }

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

    res.status(201).json({
      message: 'Scan recorded successfully',
      log,
      jobOrderStatus: jobOrder.status,
      completedQuantity: jobOrder.completedQuantity,
      rejectQuantity: jobOrder.rejectQuantity,
    });
  } catch (err) {
    console.error('Add scan error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  GET /api/scanlogs?jobOrder=:id
exports.getScanLogs = async (req, res) => {
  try {
    const { jobOrder, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (jobOrder) filter.jobOrder = jobOrder;

    const logs = await ScanLog.find(filter)
      .populate('scannedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ScanLog.countDocuments(filter);

    res.status(200).json({ logs, total });
  } catch (err) {
    console.error('Get scan logs error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};