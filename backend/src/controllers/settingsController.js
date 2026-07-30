const Settings = require('../models/Settings');
const logAction = require('../utils/logAction');

// @route  GET /api/settings
// Returns the single settings document, creating a default one if it doesn't exist yet
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.status(200).json({ settings });
  } catch (err) {
    console.error('Get settings error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  PUT /api/settings
exports.updateSettings = async (req, res) => {
  try {
    const { companyName, address, timezone, currency, dateFormat } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    settings.companyName = companyName ?? settings.companyName;
    settings.address = address ?? settings.address;
    settings.timezone = timezone ?? settings.timezone;
    settings.currency = currency ?? settings.currency;
    settings.dateFormat = dateFormat ?? settings.dateFormat;

    await settings.save();

    await logAction(req.user.id, 'UPDATE', 'Settings', 'Updated system settings', settings._id);

    res.status(200).json({ message: 'Settings updated successfully', settings });
  } catch (err) {
    console.error('Update settings error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};