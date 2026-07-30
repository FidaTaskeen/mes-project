const BOM = require('../models/BOM');
const Item = require('../models/Item');

// @route  POST /api/boms
exports.createBOM = async (req, res) => {
  try {
    const { bomCode, parentItem, version, components, status } = req.body;

    if (!bomCode || !parentItem || !components || components.length === 0) {
      return res.status(400).json({
        message: 'BOM code, parent item, and at least one component are required',
      });
    }

    const existing = await BOM.findOne({ bomCode: bomCode.toUpperCase() });
    if (existing) {
      return res.status(409).json({ message: 'A BOM with this code already exists' });
    }

    const parentExists = await Item.findById(parentItem);
    if (!parentExists) {
      return res.status(404).json({ message: 'Parent item not found' });
    }

    for (const comp of components) {
      const itemExists = await Item.findById(comp.item);
      if (!itemExists) {
        return res.status(404).json({ message: `Component item not found: ${comp.item}` });
      }
    }

    const bom = await BOM.create({
      bomCode,
      parentItem,
      version,
      components,
      status,
      createdBy: req.user.id,
    });

    const populated = await bom.populate(['parentItem', 'components.item']);

    res.status(201).json({ message: 'BOM created successfully', bom: populated });
  } catch (err) {
    console.error('Create BOM error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  GET /api/boms
exports.getBOMs = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (search) {
      filter.bomCode = { $regex: search, $options: 'i' };
    }
    if (status) filter.status = status;

    const boms = await BOM.find(filter)
      .populate('parentItem', 'itemCode name')
      .populate('components.item', 'itemCode name unitOfMeasure')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await BOM.countDocuments(filter);

    res.status(200).json({
      boms,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Get BOMs error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  GET /api/boms/:id
exports.getBOMById = async (req, res) => {
  try {
    const bom = await BOM.findById(req.params.id)
      .populate('parentItem', 'itemCode name')
      .populate('components.item', 'itemCode name unitOfMeasure');

    if (!bom) {
      return res.status(404).json({ message: 'BOM not found' });
    }
    res.status(200).json({ bom });
  } catch (err) {
    console.error('Get BOM error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  PUT /api/boms/:id
exports.updateBOM = async (req, res) => {
  try {
    const { bomCode, parentItem, version, components, status } = req.body;

    const bom = await BOM.findById(req.params.id);
    if (!bom) {
      return res.status(404).json({ message: 'BOM not found' });
    }

    if (bomCode && bomCode.toUpperCase() !== bom.bomCode) {
      const existing = await BOM.findOne({ bomCode: bomCode.toUpperCase() });
      if (existing) {
        return res.status(409).json({ message: 'Another BOM already uses this code' });
      }
    }

    if (components) {
      for (const comp of components) {
        const itemExists = await Item.findById(comp.item);
        if (!itemExists) {
          return res.status(404).json({ message: `Component item not found: ${comp.item}` });
        }
      }
    }

    bom.bomCode = bomCode ?? bom.bomCode;
    bom.parentItem = parentItem ?? bom.parentItem;
    bom.version = version ?? bom.version;
    bom.components = components ?? bom.components;
    bom.status = status ?? bom.status;

    await bom.save();
    const populated = await bom.populate(['parentItem', 'components.item']);

    res.status(200).json({ message: 'BOM updated successfully', bom: populated });
  } catch (err) {
    console.error('Update BOM error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  DELETE /api/boms/:id
exports.deleteBOM = async (req, res) => {
  try {
    const bom = await BOM.findById(req.params.id);
    if (!bom) {
      return res.status(404).json({ message: 'BOM not found' });
    }

    await bom.deleteOne();

    res.status(200).json({ message: 'BOM deleted successfully' });
  } catch (err) {
    console.error('Delete BOM error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};