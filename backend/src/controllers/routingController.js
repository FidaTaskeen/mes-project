const Routing = require('../models/Routing');
const Item = require('../models/Item');
const Operation = require('../models/Operation');
const BOM = require('../models/BOM');

exports.createRouting = async (req, res) => {
  try {
    const {
      routingCode, bom, steps, status, version,
      plant, shopfloor, description, inputItemDescription, validFrom, validTo,
    } = req.body;

    if (!routingCode || !bom || !steps || steps.length === 0) {
      return res.status(400).json({ message: 'Routing code, BOM, and at least one step are required' });
    }

    const existing = await Routing.findOne({ routingCode: routingCode.toUpperCase() });
    if (existing) return res.status(409).json({ message: 'A routing with this code already exists' });

    const bomExists = await BOM.findById(bom);
    if (!bomExists) return res.status(404).json({ message: 'BOM not found' });

    const item = bomExists.parentItem;

    for (const step of steps) {
      const opExists = await Operation.findById(step.operation);
      if (!opExists) return res.status(404).json({ message: `Operation not found: ${step.operation}` });
    }

    const routing = await Routing.create({
      routingCode, item, bom, steps, status, version,
      plant, shopfloor, description, inputItemDescription, validFrom, validTo,
      createdBy: req.user.id,
    });

    const populated = await routing.populate(['item', 'bom', 'steps.operation']);
    res.status(201).json({ message: 'Routing created successfully', routing: populated });
  } catch (err) {
    console.error('Create routing error:', err.message);
    res.status(500).json({ message: err.message || 'Something went wrong. Please try again.' });
  }
};

exports.getRoutings = async (req, res) => {
  try {
    const { search, status, plant, shopfloor, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (search) filter.routingCode = { $regex: search, $options: 'i' };
    if (status) filter.status = status;
    if (plant) filter.plant = plant;
    if (shopfloor) filter.shopfloor = shopfloor;

    const routings = await Routing.find(filter)
      .populate('item', 'itemCode name')
      .populate('bom', 'bomCode')
      .populate('steps.operation', 'operationCode operationName workCenter')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Routing.countDocuments(filter);
    res.status(200).json({ routings, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Get routings error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.getRoutingById = async (req, res) => {
  try {
    const routing = await Routing.findById(req.params.id)
      .populate('item', 'itemCode name description')
      .populate('bom', 'bomCode')
      .populate('steps.operation', 'operationCode operationName workCenter');
    if (!routing) return res.status(404).json({ message: 'Routing not found' });
    res.status(200).json({ routing });
  } catch (err) {
    console.error('Get routing error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.updateRouting = async (req, res) => {
  try {
    const {
      routingCode, bom, steps, status, version,
      plant, shopfloor, description, inputItemDescription, validFrom, validTo,
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
        const opExists = await Operation.findById(step.operation);
        if (!opExists) return res.status(404).json({ message: `Operation not found: ${step.operation}` });
      }
    }

    routing.routingCode = routingCode ?? routing.routingCode;
    routing.steps = steps ?? routing.steps;
    routing.status = status ?? routing.status;
    routing.version = version ?? routing.version;
    routing.plant = plant ?? routing.plant;
    routing.shopfloor = shopfloor ?? routing.shopfloor;
    routing.description = description ?? routing.description;
    routing.inputItemDescription = inputItemDescription ?? routing.inputItemDescription;
    routing.validFrom = validFrom ?? routing.validFrom;
    routing.validTo = validTo ?? routing.validTo;

    await routing.save();
    const populated = await routing.populate(['item', 'bom', 'steps.operation']);
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
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};