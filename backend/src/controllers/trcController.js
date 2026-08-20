const TrcRecord = require('../models/TrcRecord');

const POPULATE_LIST = [
  { path: 'jobOrder', select: 'jobOrderNo' },
  { path: 'item', select: 'itemCode name description' },
  { path: 'operation', select: 'operationCode operationName' },
  { path: 'failedBy', select: 'name userId' },
  { path: 'checkIn.by', select: 'name userId' },
  { path: 'checkOut.by', select: 'name userId' },
];

// @route GET /api/trc?status=Pending&date=&line=&jobOrder=&serialId=&operation=
exports.getTrcQueue = async (req, res) => {
  try {
    const { status, date, jobOrder, serialId, operation } = req.query;
    const filter = {};
    if (status) filter.status = status;
    else filter.status = { $in: ['Pending', 'CheckedIn'] }; // "In & Out" default view
    if (jobOrder) filter.jobOrder = jobOrder;
    if (serialId) filter.serialId = { $regex: serialId, $options: 'i' };
    if (operation) filter.operation = operation;
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      filter.failedAt = { $gte: start, $lte: end };
    }

    const records = await TrcRecord.find(filter).populate(POPULATE_LIST).sort({ failedAt: -1 });
    res.status(200).json({ records });
  } catch (err) {
    console.error('Get TRC queue error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route GET /api/trc/:id
exports.getTrcById = async (req, res) => {
  try {
    const record = await TrcRecord.findById(req.params.id).populate(POPULATE_LIST);
    if (!record) return res.status(404).json({ message: 'TRC record not found' });
    res.status(200).json({ record });
  } catch (err) {
    console.error('Get TRC record error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route PUT /api/trc/:id/check-in
exports.checkIn = async (req, res) => {
  try {
    const record = await TrcRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'TRC record not found' });
    if (record.status !== 'Pending') {
      return res.status(400).json({ message: 'This serial is not pending TRC check-in' });
    }
    record.status = 'CheckedIn';
    record.checkIn = { by: req.user.id, at: new Date() };
    await record.save();
    const populated = await record.populate(POPULATE_LIST);
    res.status(200).json({ message: 'Checked in successfully', record: populated });
  } catch (err) {
    console.error('TRC check-in error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route PUT /api/trc/:id/check-out
exports.checkOut = async (req, res) => {
  try {
    const { result, trcDefect, trcDefectLocation, repairRemarks, rootCause } = req.body;

    if (!['Pass', 'Fail'].includes(result)) {
      return res.status(400).json({ message: 'Result must be Pass or Fail' });
    }

    const record = await TrcRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'TRC record not found' });
    if (record.status !== 'CheckedIn') {
      return res.status(400).json({ message: 'This serial has not been checked in yet' });
    }

    record.status = 'CheckedOut';
    record.checkOut = {
      by: req.user.id,
      at: new Date(),
      result,
      trcDefect,
      trcDefectLocation,
      repairRemarks,
      rootCause,
    };
    record.reworked = result === 'Pass';
    await record.save();

    const populated = await record.populate(POPULATE_LIST);
    res.status(200).json({ message: 'Checked out successfully', record: populated });
  } catch (err) {
    console.error('TRC check-out error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route PUT /api/trc/:id  (Rework Details form — Defect/Location required, Remarks/RootCause optional)
exports.updateReworkDetails = async (req, res) => {
  try {
    const { trcDefect, trcDefectLocation, repairRemarks, rootCause } = req.body;
    if (!trcDefect || !trcDefectLocation) {
      return res.status(400).json({ message: 'Defect and Defect Location are required' });
    }
    const record = await TrcRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'TRC record not found' });

    record.checkOut = {
      ...record.checkOut,
      trcDefect,
      trcDefectLocation,
      repairRemarks,
      rootCause,
    };
    await record.save();
    const populated = await record.populate(POPULATE_LIST);
    res.status(200).json({ message: 'Saved', record: populated });
  } catch (err) {
    console.error('Update rework details error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};