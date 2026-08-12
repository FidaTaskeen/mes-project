const Item = require('../models/Item');
const logAction = require('../utils/logAction');

exports.createItem = async (req, res) => {
  try {
    const { itemCode, name, description, unitOfMeasure, itemType, serialNoLength, status } = req.body;

    if (!itemCode || !name || !unitOfMeasure || !itemType) {
      return res.status(400).json({
        message: 'Item code, name, unit of measure, and item type are required',
      });
    }

    const existing = await Item.findOne({ itemCode: itemCode.toUpperCase() });
    if (existing) {
      return res.status(409).json({ message: 'An item with this code already exists' });
    }

    const item = await Item.create({
      itemCode,
      name,
      description,
      unitOfMeasure,
      itemType,
      serialNoLength: serialNoLength || null,
      status,
      createdBy: req.user.id,
    });

    await logAction(req.user.id, 'CREATE', 'Item', `Created item ${item.itemCode}`, item._id);

    res.status(201).json({ message: 'Item created successfully', item });
  } catch (err) {
    console.error('Create item error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.getItems = async (req, res) => {
  try {
    const { search, itemType, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { itemCode: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }
    if (itemType) filter.itemType = itemType;
    if (status) filter.status = status;

    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Item.countDocuments(filter);

    res.status(200).json({
      items,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Get items error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json({ item });
  } catch (err) {
    console.error('Get item error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { itemCode, name, description, unitOfMeasure, itemType, serialNoLength, status } = req.body;

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (itemCode && itemCode.toUpperCase() !== item.itemCode) {
      const existing = await Item.findOne({ itemCode: itemCode.toUpperCase() });
      if (existing) {
        return res.status(409).json({ message: 'Another item already uses this code' });
      }
    }

    item.itemCode = itemCode ?? item.itemCode;
    item.name = name ?? item.name;
    item.description = description ?? item.description;
    item.unitOfMeasure = unitOfMeasure ?? item.unitOfMeasure;
    item.itemType = itemType ?? item.itemType;
    item.serialNoLength = serialNoLength ?? item.serialNoLength;
    item.status = status ?? item.status;

    await item.save();

    await logAction(req.user.id, 'UPDATE', 'Item', `Updated item ${item.itemCode}`, item._id);

    res.status(200).json({ message: 'Item updated successfully', item });
  } catch (err) {
    console.error('Update item error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await item.deleteOne();

    await logAction(req.user.id, 'DELETE', 'Item', `Deleted item ${item.itemCode}`, item._id);

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Delete item error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};