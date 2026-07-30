const Item = require('../models/Item');
const Operation = require('../models/Operation');
const BOM = require('../models/BOM');
const Routing = require('../models/Routing');
const JobOrder = require('../models/JobOrder');
const ProductionEntry = require('../models/ProductionEntry');
const User = require('../models/User');
const Settings = require('../models/Settings');
const logAction = require('../utils/logAction');

// @route  GET /api/backup/export
// Exports all collections as one JSON snapshot
exports.exportBackup = async (req, res) => {
  try {
    const [items, operations, boms, routings, jobOrders, productionEntries, users, settings] =
      await Promise.all([
        Item.find(),
        Operation.find(),
        BOM.find(),
        Routing.find(),
        JobOrder.find(),
        ProductionEntry.find(),
        User.find().select('-password'), // never export password hashes
        Settings.find(),
      ]);

    const backup = {
      exportedAt: new Date(),
      data: {
        items,
        operations,
        boms,
        routings,
        jobOrders,
        productionEntries,
        users,
        settings,
      },
    };

    await logAction(req.user.id, 'EXPORT', 'Backup', 'Exported full system backup');

    res.status(200).json(backup);
  } catch (err) {
    console.error('Export backup error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  POST /api/backup/restore
// Restores data from a previously exported JSON backup
// WARNING: this clears existing data in the given collections before restoring
exports.restoreBackup = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Backup data is required' });
    }

    if (data.items) {
      await Item.deleteMany();
      await Item.insertMany(data.items);
    }
    if (data.operations) {
      await Operation.deleteMany();
      await Operation.insertMany(data.operations);
    }
    if (data.boms) {
      await BOM.deleteMany();
      await BOM.insertMany(data.boms);
    }
    if (data.routings) {
      await Routing.deleteMany();
      await Routing.insertMany(data.routings);
    }
    if (data.jobOrders) {
      await JobOrder.deleteMany();
      await JobOrder.insertMany(data.jobOrders);
    }
    if (data.productionEntries) {
      await ProductionEntry.deleteMany();
      await ProductionEntry.insertMany(data.productionEntries);
    }
    if (data.settings) {
      await Settings.deleteMany();
      await Settings.insertMany(data.settings);
    }
    // Note: users are intentionally NOT restored here to avoid overwriting
    // passwords/accounts accidentally. Manage users separately via /api/users.

    await logAction(req.user.id, 'RESTORE', 'Backup', 'Restored system data from backup');

    res.status(200).json({ message: 'Backup restored successfully' });
  } catch (err) {
    console.error('Restore backup error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};