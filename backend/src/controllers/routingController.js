const Routing = require('../models/Routing');
const BOM = require('../models/BOM');
const Item = require('../models/Item');
const logAction = require('../utils/logAction');

// Generate Routing Number
const generateRoutingNo = async () => {
  const count = await Routing.countDocuments();
  return `R${String(count + 1).padStart(5, '0')}`;
};

// Create Routing
exports.createRouting = async (req, res) => {
  try {
    const { item, bom, version, status, routingLines } = req.body;

    if (!item || !bom) {
      return res.status(400).json({
        message: 'Item and BOM are required',
      });
    }

    if (!routingLines || routingLines.length === 0) {
      return res.status(400).json({
        message: 'At least one routing operation is required',
      });
    }

    const itemExists = await Item.findById(item);
    if (!itemExists) {
      return res.status(404).json({
        message: 'Item not found',
      });
    }

    const bomExists = await BOM.findById(bom);
    if (!bomExists) {
      return res.status(404).json({
        message: 'BOM not found',
      });
    }

    const routingNo = await generateRoutingNo();

    const routing = await Routing.create({
      routingNo,
      item,
      bom,
      version: version || 'Version 1',
      status: status || 'Active',
      routingLines,
      createdBy: req.user.id,
    });

    await logAction(
      req.user.id,
      'CREATE',
      'Routing',
      `Created Routing ${routing.routingNo}`,
      routing._id
    );

    const populated = await Routing.findById(routing._id)
      .populate('item')
      .populate('bom');

    res.status(201).json({
      message: 'Routing created successfully',
      routing: populated,
    });
  } catch (err) {
    console.error('Create routing error:', err.message);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
};

// Get All Routings
exports.getRoutings = async (req, res) => {
  try {
    const { search, status, itemNo } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    let query = Routing.find(filter)
      .populate('item')
      .populate('bom')
      .sort({ createdAt: -1 });

    const routings = await query;

    let filtered = routings;

    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.routingNo.toLowerCase().includes(search.toLowerCase()) ||
          r.item?.itemNo.toLowerCase().includes(search.toLowerCase()) ||
          r.item?.itemName.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (itemNo) {
      filtered = filtered.filter(
        (r) => r.item?.itemNo === itemNo
      );
    }

    res.status(200).json({
      routings: filtered,
    });
  } catch (err) {
    console.error('Get routings error:', err.message);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
};

// Get Single Routing
exports.getRoutingById = async (req, res) => {
  try {
    const routing = await Routing.findById(req.params.id)
      .populate('item')
      .populate('bom');

    if (!routing) {
      return res.status(404).json({
        message: 'Routing not found',
      });
    }

    res.status(200).json({
      routing,
    });
  } catch (err) {
    console.error('Get routing error:', err.message);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
};

// Update Routing
exports.updateRouting = async (req, res) => {
  try {
    const { item, bom, version, status, routingLines } = req.body;

    const routing = await Routing.findById(req.params.id);

    if (!routing) {
      return res.status(404).json({
        message: 'Routing not found',
      });
    }

    routing.item = item || routing.item;
    routing.bom = bom || routing.bom;
    routing.version = version || routing.version;
    routing.status = status || routing.status;
    routing.routingLines = routingLines || routing.routingLines;

    await routing.save();

    await logAction(
      req.user.id,
      'UPDATE',
      'Routing',
      `Updated Routing ${routing.routingNo}`,
      routing._id
    );

    const populated = await Routing.findById(routing._id)
      .populate('item')
      .populate('bom');

    res.status(200).json({
      message: 'Routing updated successfully',
      routing: populated,
    });
  } catch (err) {
    console.error('Update routing error:', err.message);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
};

// Delete Routing
exports.deleteRouting = async (req, res) => {
  try {
    const routing = await Routing.findById(req.params.id);

    if (!routing) {
      return res.status(404).json({
        message: 'Routing not found',
      });
    }

    await routing.deleteOne();

    await logAction(
      req.user.id,
      'DELETE',
      'Routing',
      `Deleted Routing ${routing.routingNo}`,
      routing._id
    );

    res.status(200).json({
      message: 'Routing deleted successfully',
    });
  } catch (err) {
    console.error('Delete routing error:', err.message);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
};