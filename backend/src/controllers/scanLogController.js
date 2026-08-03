const ScanLog = require('../models/ScanLog');
const JobOrder = require('../models/JobOrder');
const User = require('../models/User');

// @route  POST /api/scan-logs
exports.createScanLog = async (req, res) => {
  try {
    const { jobOrderNo, serialId, status } = req.body;

    if (!jobOrderNo || !serialId || !status) {
      return res.status(400).json({ message: 'Job order number, serial ID, and status are required' });
    }
    if (!['Pass', 'Fail'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Pass or Fail' });
    }

    const jobOrder = await JobOrder.findOne({ jobOrderNo: jobOrderNo.toUpperCase() }).populate({
      path: 'routing',
      populate: { path: 'steps.operation', select: 'operationCode operationName workCenter' },
    });

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

    const remainingQty = jobOrder.quantity - jobOrder.completedQuantity - jobOrder.rejectQuantity;
    if (remainingQty <= 0) {
      return res.status(400).json({ message: 'This operation has no remaining quantity to scan.' });
    }

    let scanLog;
    try {
      scanLog = await ScanLog.create({
        jobOrder: jobOrder._id,
        operation: currentStep.operation._id,
        serialId: serialId.trim(),
        status,
        scannedBy: req.user.id,
      });
    } catch (dupErr) {
      if (dupErr.code === 11000) {
        return res.status(409).json({ message: 'This serial ID has already been scanned at this operation.' });
      }
      throw dupErr;
    }

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
      scanLog,
      jobOrderStatus: jobOrder.status,
      completedQuantity: jobOrder.completedQuantity,
      rejectQuantity: jobOrder.rejectQuantity,
    });
  } catch (err) {
    console.error('Create scan log error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  GET /api/scan-logs?jobOrderNo=&page=&limit=100
exports.getScanLogs = async (req, res) => {
  try {
    const { jobOrderNo, page = 1, limit = 20 } = req.query;

    if (!jobOrderNo) {
      return res.status(400).json({ message: 'jobOrderNo is required' });
    }

    const jobOrder = await JobOrder.findOne({ jobOrderNo: jobOrderNo.toUpperCase() });
    if (!jobOrder) {
      return res.status(404).json({ message: 'Job order not found' });
    }

    const filter = { jobOrder: jobOrder._id };

    const logs = await ScanLog.find(filter)
      .populate('scannedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ScanLog.countDocuments(filter);

    res.status(200).json({
      logs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Get scan logs error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};