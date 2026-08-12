const Operation = require('../models/Operation');

exports.createOperation = async (req, res) => {
  try {
    const {
      operationCode, operationName, workCenter, standardTime, status,
      plant, shopfloor, machineGroup, routingType, operationRank, scanningType,
    } = req.body;

    if (!operationCode || !operationName || !workCenter) {
      return res.status(400).json({
        message: 'Operation code, name, and work center are required',
      });
    }

    const existing = await Operation.findOne({ operationCode: operationCode.toUpperCase() });
    if (existing) {
      return res.status(409).json({ message: 'An operation with this code already exists' });
    }

    const operation = await Operation.create({
      operationCode, operationName, workCenter, standardTime, status,
      plant, shopfloor, machineGroup, routingType, operationRank, scanningType,
      createdBy: req.user.id,
    });

    res.status(201).json({ message: 'Operation created successfully', operation });
  } catch (err) {
    console.error('Create operation error:', err.message);
    res.status(500).json({ message: err.message || 'Something went wrong. Please try again.' });
  }
};

exports.getOperations = async (req, res) => {
  try {
    const { search, workCenter, status, plant, shopfloor, routingType, operationRank, scanningType, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { operationCode: { $regex: search, $options: 'i' } },
        { operationName: { $regex: search, $options: 'i' } },
      ];
    }
    if (workCenter) filter.workCenter = workCenter;
    if (status) filter.status = status;
    if (plant) filter.plant = plant;
    if (shopfloor) filter.shopfloor = shopfloor;
    if (routingType) filter.routingType = routingType;
    if (operationRank) filter.operationRank = operationRank;
    if (scanningType) filter.scanningType = scanningType;

    const operations = await Operation.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Operation.countDocuments(filter);

    res.status(200).json({ operations, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Get operations error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.getOperationById = async (req, res) => {
  try {
    const operation = await Operation.findById(req.params.id);
    if (!operation) return res.status(404).json({ message: 'Operation not found' });
    res.status(200).json({ operation });
  } catch (err) {
    console.error('Get operation error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.updateOperation = async (req, res) => {
  try {
    const {
      operationCode, operationName, workCenter, standardTime, status,
      plant, shopfloor, machineGroup, routingType, operationRank, scanningType,
    } = req.body;

    const operation = await Operation.findById(req.params.id);
    if (!operation) return res.status(404).json({ message: 'Operation not found' });

    if (operationCode && operationCode.toUpperCase() !== operation.operationCode) {
      const existing = await Operation.findOne({ operationCode: operationCode.toUpperCase() });
      if (existing) return res.status(409).json({ message: 'Another operation already uses this code' });
    }

    operation.operationCode = operationCode ?? operation.operationCode;
    operation.operationName = operationName ?? operation.operationName;
    operation.workCenter = workCenter ?? operation.workCenter;
    operation.standardTime = standardTime ?? operation.standardTime;
    operation.status = status ?? operation.status;
    operation.plant = plant ?? operation.plant;
    operation.shopfloor = shopfloor ?? operation.shopfloor;
    operation.machineGroup = machineGroup ?? operation.machineGroup;
    operation.routingType = routingType ?? operation.routingType;
    operation.operationRank = operationRank ?? operation.operationRank;
    operation.scanningType = scanningType ?? operation.scanningType;

    await operation.save();
    res.status(200).json({ message: 'Operation updated successfully', operation });
  } catch (err) {
    console.error('Update operation error:', err.message);
    res.status(500).json({ message: err.message || 'Something went wrong. Please try again.' });
  }
};

exports.deleteOperation = async (req, res) => {
  try {
    const operation = await Operation.findById(req.params.id);
    if (!operation) return res.status(404).json({ message: 'Operation not found' });
    await operation.deleteOne();
    res.status(200).json({ message: 'Operation deleted successfully' });
  } catch (err) {
    console.error('Delete operation error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};