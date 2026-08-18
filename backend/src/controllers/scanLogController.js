const ScanLog = require('../models/ScanLog');
const JobOrder = require('../models/JobOrder');
const User = require('../models/User');

// Walks backward from idx and returns the nearest step whose type is
// 'Scanning' -- skips No_Scanning steps (like SPI) which never get scans,
// so "the previous operation" for validation/Pending purposes means the
// last actual scanning station before this one, not just steps[idx-1].
const findPrevScanningStep = (steps, idx) => {
  for (let i = idx - 1; i >= 0; i--) {
    if (steps[i].type === 'Scanning') return steps[i];
  }
  return null;
};

exports.getJobOrderStatus = async (req, res) => {
  try {
    const { operation: operationId } = req.query;

    const jobOrder = await JobOrder.findById(req.params.jobOrderId)
      .populate('item', 'itemCode name description unitOfMeasure serialNoLength')
      .populate({
        path: 'routing',
        populate: { path: 'steps.operation', select: 'operationCode operationName workCenter' },
      });

    if (!jobOrder) return res.status(404).json({ message: 'Job order not found' });

    const steps = jobOrder.routing.steps.slice().sort((a, b) => a.sequenceNo - b.sequenceNo);
    const opId = operationId || steps[jobOrder.currentOperationIndex]?.operation?._id;
    const stepIndex = steps.findIndex((s) => String(s.operation._id || s.operation) === String(opId));
    const currentStep = stepIndex !== -1 ? steps[stepIndex] : null;

    if (!currentStep) {
      return res.status(400).json({ message: 'This operation is not part of the job order routing.' });
    }

    if (req.user.role === 'operator') {
      const user = await User.findById(req.user.id).select('assignedOperations');
      const allowedIds = (user.assignedOperations || []).map((id) => String(id));
      if (!allowedIds.includes(String(currentStep.operation._id))) {
        return res.status(403).json({ message: 'This operation is not assigned to you.' });
      }
    }

    const completed = await ScanLog.countDocuments({
      jobOrder: jobOrder._id,
      operation: currentStep.operation._id,
      status: 'Pass',
    });

    let prevCompleted = jobOrder.quantity;
    const prevScanningStep = findPrevScanningStep(steps, stepIndex);
    if (prevScanningStep) {
      const prevOpId = prevScanningStep.operation._id || prevScanningStep.operation;
      prevCompleted = await ScanLog.countDocuments({ jobOrder: jobOrder._id, operation: prevOpId, status: 'Pass' });
    }

    const pending = Math.max(prevCompleted - completed, 0);
    const balance = Math.max(jobOrder.quantity - completed, 0);

    res.status(200).json({
      jobOrder: {
        _id: jobOrder._id,
        jobOrderNo: jobOrder.jobOrderNo,
        item: jobOrder.item,
        quantity: jobOrder.quantity,
        status: jobOrder.status,
      },
      currentOperation: currentStep.operation,
      counts: { total: jobOrder.quantity, pending, completed, balance },
    });
  } catch (err) {
    console.error('Job order status error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.addScan = async (req, res) => {
  try {
    const { jobOrder: jobOrderId, operation: operationId, serialId, status } = req.body;

    if (!jobOrderId || !operationId || !serialId || !status) {
      return res.status(400).json({ message: 'Job order, operation, serial ID, and status are required' });
    }
    if (!['Pass', 'Fail'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Pass or Fail' });
    }

    const jobOrder = await JobOrder.findById(jobOrderId)
      .populate('item', 'serialNoLength itemCode')
      .populate({
        path: 'routing',
        populate: [
          { path: 'steps.operation', select: 'operationCode operationName' },
          { path: 'lastScanOperation', select: 'operationCode operationName' },
        ],
      });
    if (!jobOrder) return res.status(404).json({ message: 'Job order not found' });

    if (jobOrder.status === 'Completed') {
      return res.status(400).json({ message: 'This job order is already completed.' });
    }
    if (jobOrder.status === 'On Hold') {
      return res.status(400).json({ message: 'This job order is currently on hold.' });
    }

    const steps = jobOrder.routing.steps.slice().sort((a, b) => a.sequenceNo - b.sequenceNo);
    const stepIndex = steps.findIndex((s) => String(s.operation._id || s.operation) === String(operationId));
    if (stepIndex === -1) {
      return res.status(400).json({ message: 'This operation is not part of the job order routing.' });
    }
    const currentStep = steps[stepIndex];

    if (currentStep.type !== 'Scanning') {
      return res.status(400).json({ message: 'This operation does not require scanning.' });
    }

    if (req.user.role === 'operator') {
      const user = await User.findById(req.user.id).select('assignedOperations');
      const allowedIds = (user.assignedOperations || []).map((id) => String(id));
      if (!allowedIds.includes(String(operationId))) {
        return res.status(403).json({ message: 'This operation is not assigned to you.' });
      }
    }

    if (jobOrder.item?.serialNoLength && serialId.length !== jobOrder.item.serialNoLength) {
      return res.status(400).json({
        message: `Serial number must be exactly ${jobOrder.item.serialNoLength} digits for ${jobOrder.item.itemCode} (you entered ${serialId.length}).`,
      });
    }

    // Sequence enforcement: serial must have Passed the nearest PREVIOUS
    // SCANNING step (No_Scanning steps like SPI are skipped, since they
    // never produce a ScanLog to check against).
    const prevScanningStep = findPrevScanningStep(steps, stepIndex);
    if (prevScanningStep) {
      const prevOpId = prevScanningStep.operation._id || prevScanningStep.operation;
      const priorPass = await ScanLog.findOne({
        jobOrder: jobOrderId,
        serialId,
        operation: prevOpId,
        status: 'Pass',
      });
      if (!priorPass) {
        return res.status(400).json({
          message: `Serial ID not scanned in the previous operation - ${prevScanningStep.operation.operationName}`,
        });
      }
    }

    const existingSerial = await ScanLog.findOne({ jobOrder: jobOrderId, operation: operationId, serialId });
    if (existingSerial) {
      return res.status(409).json({ message: 'This serial number has already been scanned at this operation.' });
    }

    const log = await ScanLog.create({
      jobOrder: jobOrderId,
      operation: operationId,
      serialId,
      status,
      scannedBy: req.user.id,
    });

    if (jobOrder.status === 'Planned' || jobOrder.status === 'Released') {
      jobOrder.status = 'In Progress';
    }

    if (status === 'Fail') {
      jobOrder.rejectQuantity += 1;
    }

    const lastOpId = jobOrder.routing.lastScanOperation?._id || jobOrder.routing.lastScanOperation;
    if (status === 'Pass' && String(lastOpId) === String(operationId)) {
      jobOrder.completedQuantity += 1;
      if (jobOrder.completedQuantity + jobOrder.rejectQuantity >= jobOrder.quantity) {
        jobOrder.status = 'Completed';
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

exports.getScanLogs = async (req, res) => {
  try {
    const { jobOrder, operation, status, serialId, sort, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (jobOrder) filter.jobOrder = jobOrder;
    if (operation) filter.operation = operation;
    if (status) filter.status = status;
    if (serialId) filter.serialId = { $regex: serialId, $options: 'i' };

    const sortOrder = sort === 'asc' ? 1 : -1;

    const logs = await ScanLog.find(filter)
      .populate({
        path: 'jobOrder',
        select: 'jobOrderNo item',
        populate: { path: 'item', select: 'itemCode name' },
      })
      .populate('operation', 'operationCode operationName')
      .populate('scannedBy', 'name')
      .sort({ createdAt: sortOrder })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ScanLog.countDocuments(filter);

    res.status(200).json({ logs, total });
  } catch (err) {
    console.error('Get scan logs error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.getMyStats = async (req, res) => {
  try {
    const logs = await ScanLog.find({ scannedBy: req.user.id });
    const pass = logs.filter((l) => l.status === 'Pass').length;
    const fail = logs.filter((l) => l.status === 'Fail').length;
    const total = logs.length;
    const passRate = total > 0 ? ((pass / total) * 100).toFixed(2) : '0.00';

    res.status(200).json({
      stats: { totalScans: total, passCount: pass, failCount: fail, passRate: Number(passRate) },
    });
  } catch (err) {
    console.error('My stats error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};