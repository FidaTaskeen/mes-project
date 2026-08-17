const Routing = require('../models/Routing');
const Item = require('../models/Item');
const Operation = require('../models/Operation');
const BOM = require('../models/BOM');

const POPULATE_LIST = [
  { path: 'item', select: 'itemCode name description' },
  { path: 'bom', select: 'bomCode' },
  { path: 'steps.operation', select: 'operationCode operationName workCenter routingType' },
  { path: 'firstScanOperation', select: 'operationCode operationName' },
  { path: 'lastScanOperation', select: 'operationCode operationName' },
  { path: 'createdBy', select: 'name userId' },
  { path: 'versionHistory.steps.operation', select: 'operationCode operationName workCenter routingType' },
  { path: 'versionHistory.firstScanOperation', select: 'operationCode operationName' },
  { path: 'versionHistory.lastScanOperation', select: 'operationCode operationName' },
];

const normalizeSteps = (arr) =>
  (arr || []).map((s) => ({
    operation: String(s.operation?._id || s.operation || ''),
    sequenceNo: s.sequenceNo,
    stage: s.stage,
    previousOperation: String(s.previousOperation?._id || s.previousOperation || ''),
    type: s.type,
    scan: s.scan,
  }));

exports.createRouting = async (req, res) => {
  try {
    const {
      routingCode, bom, steps, status, version, description,
      firstScanOperation, lastScanOperation,
    } = req.body;

    if (!routingCode || !bom || !steps || steps.length === 0) {
      return res.status(400).json({ message: 'Routing code, BOM, and at least one step are required' });
    }
    if (!firstScanOperation || !lastScanOperation) {
      return res.status(400).json({ message: 'First Scan Operation and Last Scan Operation are required' });
    }

    const existing = await Routing.findOne({ routingCode: routingCode.toUpperCase() });
    if (existing) return res.status(409).json({ message: 'A routing with this code already exists' });

    const bomExists = await BOM.findById(bom);
    if (!bomExists) return res.status(404).json({ message: 'BOM not found' });

    const item = bomExists.parentItem;

    for (const step of steps) {
      if (!step.operation) {
        return res.status(400).json({ message: 'Every routing line must have an Operation selected' });
      }
      const opExists = await Operation.findById(step.operation);
      if (!opExists) return res.status(404).json({ message: `Operation not found: ${step.operation}` });
    }

    const routing = await Routing.create({
      routingCode, item, bom, steps, status, version, description,
      firstScanOperation, lastScanOperation,
      createdBy: req.user.id,
    });

    const populated = await routing.populate(POPULATE_LIST);
    res.status(201).json({ message: 'Routing created successfully', routing: populated });
  } catch (err) {
    console.error('Create routing error:', err.message);
    res.status(500).json({ message: err.message || 'Something went wrong. Please try again.' });
  }
};

exports.getRoutings = async (req, res) => {
  try {
    const { search, status, item, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (search) filter.routingCode = { $regex: search, $options: 'i' };
    if (status) filter.status = status;
    if (item) filter.item = item;

    const routings = await Routing.find(filter)
      .populate(POPULATE_LIST)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Routing.countDocuments(filter);
    res.status(200).json({ routings, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Get routings error:', err.message);
    res.status(500).json({ message: err.message || 'Something went wrong. Please try again.' });
  }
};

exports.getRoutingById = async (req, res) => {
  try {
    const routing = await Routing.findById(req.params.id).populate(POPULATE_LIST);
    if (!routing) return res.status(404).json({ message: 'Routing not found' });
    res.status(200).json({ routing });
  } catch (err) {
    console.error('Get routing error:', err.message);
    res.status(500).json({ message: err.message || 'Something went wrong. Please try again.' });
  }
};

exports.updateRouting = async (req, res) => {
  try {
    const {
      routingCode, bom, steps, status, version, description,
      firstScanOperation, lastScanOperation,
    } = req.body;

    const routing = await Routing.findById(req.params.id);
    if (!routing) return res.status(404).json({ message: 'Routing not found' });

    if (routingCode && routingCode.toUpperCase() !== routing.routingCode) {
      const existing = await Routing.findOne({ routingCode: routingCode.toUpperCase() });
      if (existing) return res.status(409).json({ message: 'Another routing already uses this code' });
    }

    if (bom) {
      const bomExists = await BOM.findById(bom);
      if (!bomExists) return res.status(404).json({ message: 'BOM not found' });
      routing.bom = bom;
      routing.item = bomExists.parentItem;
    }

    if (steps) {
      for (const step of steps) {
        if (!step.operation) {
          return res.status(400).json({ message: 'Every routing line must have an Operation selected' });
        }
        const opExists = await Operation.findById(step.operation);
        if (!opExists) return res.status(404).json({ message: `Operation not found: ${step.operation}` });
      }
    }

    const stepsChanged =
      steps && JSON.stringify(normalizeSteps(steps)) !== JSON.stringify(normalizeSteps(routing.steps.toObject()));

    // Before overwriting, snapshot the current (about-to-be-previous) state into
    // versionHistory - but only when the routing lines actually changed, so trivial
    // edits (e.g. just Status) don't spam the history.
    if (stepsChanged) {
      routing.versionHistory.push({
        version: routing.version,
        steps: routing.steps,
        firstScanOperation: routing.firstScanOperation,
        lastScanOperation: routing.lastScanOperation,
        description: routing.description,
        status: routing.status,
        savedAt: new Date(),
      });
    }

    routing.routingCode = routingCode ?? routing.routingCode;
    routing.steps = steps ?? routing.steps;
    routing.status = status ?? routing.status;
    routing.description = description ?? routing.description;
    routing.firstScanOperation = firstScanOperation ?? routing.firstScanOperation;
    routing.lastScanOperation = lastScanOperation ?? routing.lastScanOperation;

    if (version) {
      // Explicit version override from the client always wins
      routing.version = version;
    } else if (stepsChanged) {
      // Auto-increment "Version N" -> "Version N+1" whenever routing lines actually change
      const match = routing.version.match(/(\d+)/);
      const currentNum = match ? parseInt(match[1], 10) : 1;
      routing.version = `Version ${currentNum + 1}`;
    }

    await routing.save();
    const populated = await routing.populate(POPULATE_LIST);
    res.status(200).json({ message: 'Routing updated successfully', routing: populated });
  } catch (err) {
    console.error('Update routing error:', err.message);
    res.status(500).json({ message: err.message || 'Something went wrong. Please try again.' });
  }
};

exports.deleteRouting = async (req, res) => {
  try {
    const routing = await Routing.findById(req.params.id);
    if (!routing) return res.status(404).json({ message: 'Routing not found' });
    await routing.deleteOne();
    res.status(200).json({ message: 'Routing deleted successfully' });
  } catch (err) {
    console.error('Delete routing error:', err.message);
    res.status(500).json({ message: err.message || 'Something went wrong. Please try again.' });
  }
};