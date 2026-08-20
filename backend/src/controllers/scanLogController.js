const ScanLog = require('../models/ScanLog');
const JobOrder = require('../models/JobOrder');
const User = require('../models/User');
const TrcRecord = require('../models/TrcRecord');

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
    const {
      jobOrder: jobOrderId, operation: operationId, serialId, status,
      defect, defectLocation, reworkMode,
    } = req.body;

    if (!jobOrderId || !operationId || !serialId || !status) {
      return res.status(400).json({ message: 'Job order, operation, serial ID, and status are required' });
    }
    if (!['Pass', 'Fail'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Pass or Fail' });
    }
    if (status === 'Fail' && (!defect || !defectLocation)) {
      return res.status(400).json({ message: 'Defect and Defect Location are required for a Fail scan' });
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

    const actuallyDone = jobOrder.completedQuantity + jobOrder.rejectQuantity >= jobOrder.quantity;
    if (jobOrder.status === 'Completed' && actuallyDone) {
      return res.status(400).json({ message: 'This job order is already completed.' });
    }
    if (jobOrder.status === 'Completed' && !actuallyDone) {
      jobOrder.status = 'In Progress';
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

    // Rework gate: check whether this serial has a TRC record at this
    // operation, and whether it's been successfully reworked (Pass).
    const trcRecord = await TrcRecord.findOne({ jobOrder: jobOrderId, operation: operationId, serialId })
      .sort({ createdAt: -1 });

    if (trcRecord && trcRecord.reworked && !reworkMode) {
      return res.status(400).json({
        message: 'This is a reworked serial number. Please scan it in the Rework area.',
      });
    }
    if (reworkMode && (!trcRecord || !trcRecord.reworked)) {
      return res.status(400).json({
        message: 'This serial has not completed rework at this operation yet.',
      });
    }

    const scannedAtThisOp = await ScanLog.countDocuments({ jobOrder: jobOrderId, operation: operationId, status: 'Pass' });
    if (scannedAtThisOp >= jobOrder.quantity) {
      return res.status(400).json({
        message: `All ${jobOrder.quantity} units have already been scanned at this operation.`,
      });
    }

    if (jobOrder.item?.serialNoLength && serialId.length !== jobOrder.item.serialNoLength) {
      return res.status(400).json({
        message: `Serial number must be exactly ${jobOrder.item.serialNoLength} digits for ${jobOrder.item.itemCode} (you entered ${serialId.length}).`,
      });
    }

    const prevScanningStep = findPrevScanningStep(steps, stepIndex);
    if (prevScanningStep && !reworkMode) {
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

    // Only block a duplicate PASS at this exact operation -- a Fail followed
    // later by a rework Pass at the same operation is a valid sequence.
    const existingPass = await ScanLog.findOne({ jobOrder: jobOrderId, operation: operationId, serialId, status: 'Pass' });
    if (existingPass) {
      return res.status(409).json({ message: 'This serial number has already passed this operation.' });
    }

    const log = await ScanLog.create({
      jobOrder: jobOrderId,
      operation: operationId,
      serialId,
      status,
      scannedBy: req.user.id,
    });

    if (status === 'Fail') {
      await TrcRecord.create({
        jobOrder: jobOrderId,
        item: jobOrder.item._id || jobOrder.item,
        operation: operationId,
        serialId,
        defect,
        defectLocation,
        failedBy: req.user.id,
      });
    }

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

exports.deleteScan = async (req, res) => {
  try {
    const log = await ScanLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Scan log not found' });

    const jobOrder = await JobOrder.findById(log.jobOrder).populate({
      path: 'routing',
      populate: { path: 'lastScanOperation', select: '_id' },
    });
    if (!jobOrder) return res.status(404).json({ message: 'Associated job order not found' });

    if (log.status === 'Fail') {
      jobOrder.rejectQuantity = Math.max(jobOrder.rejectQuantity - 1, 0);
    } else if (log.status === 'Pass') {
      const lastOpId = jobOrder.routing.lastScanOperation?._id || jobOrder.routing.lastScanOperation;
      if (lastOpId && String(lastOpId) === String(log.operation)) {
        jobOrder.completedQuantity = Math.max(jobOrder.completedQuantity - 1, 0);
      }
    }

    if (
      jobOrder.status === 'Completed' &&
      jobOrder.completedQuantity + jobOrder.rejectQuantity < jobOrder.quantity
    ) {
      jobOrder.status = 'In Progress';
    }

    await jobOrder.save();
    await log.deleteOne();

    res.status(200).json({ message: 'Scan deleted successfully', jobOrderStatus: jobOrder.status });
  } catch (err) {
    console.error('Delete scan error:', err.message);
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

exports.getSerialTrace = async (req, res) => {
  try {
    const { serialId } = req.params;
    if (!serialId) return res.status(400).json({ message: 'Serial ID is required' });

    const anyLog = await ScanLog.findOne({ serialId }).sort({ createdAt: 1 });
    if (!anyLog) {
      return res.status(404).json({ message: 'No scans found for this serial number.' });
    }

    const jobOrder = await JobOrder.findById(anyLog.jobOrder)
      .populate('item', 'itemCode name')
      .populate({
        path: 'routing',
        populate: { path: 'steps.operation', select: 'operationCode operationName' },
      });
    if (!jobOrder) return res.status(404).json({ message: 'Job order not found for this serial.' });

    const steps = jobOrder.routing.steps.slice().sort((a, b) => a.sequenceNo - b.sequenceNo);

    const logsForSerial = await ScanLog.find({ jobOrder: jobOrder._id, serialId })
      .populate('scannedBy', 'name')
      .populate('operation', '_id');

    const trace = steps.map((step) => {
      const opId = String(step.operation._id || step.operation);
      const matchingLog = logsForSerial.find((l) => String(l.operation._id || l.operation) === opId);

      return {
        sequenceNo: step.sequenceNo,
        operationCode: step.operation.operationCode,
        operationName: step.operation.operationName,
        scanType: step.type,
        status: matchingLog ? matchingLog.status : '-',
        dateTime: matchingLog ? matchingLog.createdAt : null,
        user: matchingLog?.scannedBy?.name || null,
      };
    });

    res.status(200).json({
      jobOrder: {
        _id: jobOrder._id,
        jobOrderNo: jobOrder.jobOrderNo,
        item: jobOrder.item,
      },
      serialId,
      trace,
    });
  } catch (err) {
    console.error('Serial trace error:', err.message);
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