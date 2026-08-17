exports.addScan = async (req, res) => {
  try {
    const { jobOrder: jobOrderId, serialId, status } = req.body;

    if (!jobOrderId || !serialId || !status) {
      return res.status(400).json({ message: 'Job order, serial ID, and status are required' });
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
          { path: 'steps.previousOperation', select: 'operationCode operationName' },
        ],
      });
    if (!jobOrder) return res.status(404).json({ message: 'Job order not found' });

    if (jobOrder.item?.serialNoLength && serialId.length !== jobOrder.item.serialNoLength) {
      return res.status(400).json({
        message: `Serial number must be exactly ${jobOrder.item.serialNoLength} digits for ${jobOrder.item.itemCode} (you entered ${serialId.length}).`,
      });
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
      if (!allowedIds.includes(String(currentStep.operation._id))) {
        return res.status(403).json({ message: 'This operation is not assigned to you.' });
      }
    }

    const existingSerial = await ScanLog.findOne({
      jobOrder: jobOrderId,
      serialId,
      operation: currentStep.operation._id,
    });
    if (existingSerial) {
      return res.status(409).json({ message: 'This serial number has already been scanned at this operation.' });
    }

    // Enforce per-serial routing sequence: if this step has a required "previous operation"
    // configured, this exact serial must already have a Pass scan logged there.
    if (currentStep.previousOperation) {
      const priorPass = await ScanLog.findOne({
        jobOrder: jobOrderId,
        serialId,
        operation: currentStep.previousOperation._id,
        status: 'Pass',
      });
      if (!priorPass) {
        return res.status(400).json({
          message: `Serial ID not scanned in the previous operation - ${currentStep.previousOperation.operationName}`,
        });
      }
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
    console.error('Add scan error FULL:', err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};