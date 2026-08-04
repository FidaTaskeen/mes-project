const Item = require('../models/Item');
const logAction = require('../utils/logAction');

// Create Item
exports.createItem = async (req, res) => {
  try {
    const { itemNo, itemName, category, uom, description, status } = req.body;

    if (!itemNo || !itemName || !category || !uom) {
      return res.status(400).json({
        message: 'Item No, Item Name, Category, and UOM are required',
      });
    }

    const existing = await Item.findOne({
      itemNo: itemNo.toUpperCase(),
    });

    if (existing) {
      return res.status(409).json({
        message: 'Item No already exists',
      });
    }

    const item = await Item.create({
      itemNo: itemNo.toUpperCase(),
      itemName,
      category,
      uom,
      description,
      status: status || 'Active',
      createdBy: req.user.id,
    });

    await logAction(
      req.user.id,
      'CREATE',
      'Item',
      `Created Item ${item.itemNo}`,
      item._id
    );

    res.status(201).json({
      message: 'Item created successfully',
      item,
    });
  } catch (err) {
    console.error('Create item error:', err.message);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
};

// Get Items
exports.getItems = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { itemNo: { $regex: search, $options: 'i' } },
        { itemName: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    const items = await Item.find(filter).sort({
      itemNo: 1,
    });

    res.status(200).json({
      items,
    });
  } catch (err) {
    console.error('Get items error:', err.message);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
};

// Get Single Item
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: 'Item not found',
      });
    }

    res.status(200).json({
      item,
    });
  } catch (err) {
    console.error('Get item error:', err.message);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
};

// Update Item
exports.updateItem = async (req, res) => {
  try {
    const { itemNo, itemName, category, uom, description, status } = req.body;

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: 'Item not found',
      });
    }

    if (itemNo && itemNo.toUpperCase() !== item.itemNo) {
      const existing = await Item.findOne({
        itemNo: itemNo.toUpperCase(),
      });

      if (existing) {
        return res.status(409).json({
          message: 'Another item already uses this Item No',
        });
      }
    }

    item.itemNo = itemNo ? itemNo.toUpperCase() : item.itemNo;
    item.itemName = itemName || item.itemName;
    item.category = category || item.category;
    item.uom = uom || item.uom;
    item.description = description || item.description;
    item.status = status || item.status;

    await item.save();

    await logAction(
      req.user.id,
      'UPDATE',
      'Item',
      `Updated Item ${item.itemNo}`,
      item._id
    );

    res.status(200).json({
      message: 'Item updated successfully',
      item,
    });
  } catch (err) {
    console.error('Update item error:', err.message);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
};

// Delete Item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: 'Item not found',
      });
    }

    await item.deleteOne();

    await logAction(
      req.user.id,
      'DELETE',
      'Item',
      `Deleted Item ${item.itemNo}`,
      item._id
    );

    res.status(200).json({
      message: 'Item deleted successfully',
    });
  } catch (err) {
    console.error('Delete item error:', err.message);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
};