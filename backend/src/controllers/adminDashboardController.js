const Item = require('../models/Item');
const Operation = require('../models/Operation');
const User = require('../models/User');
const Routing = require('../models/Routing');
const JobOrder = require('../models/JobOrder');

// @route GET /api/admin/dashboard-summary
exports.getAdminDashboardSummary = async (req, res) => {
  try {
    const [totalItems, totalOperations, activeUsers, routingsDefined] = await Promise.all([
      Item.countDocuments(),
      Operation.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Routing.countDocuments(),
    ]);

    const [recentItems, recentOps, recentRoutings, recentJobOrders] = await Promise.all([
      Item.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name'),
      Operation.find().sort({ createdAt: -1 }).limit(5),
      Routing.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name'),
      JobOrder.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name'),
    ]);

    const activity = [
      ...recentItems.map((i) => ({
        user: i.createdBy?.name || 'Unknown',
        action: 'created',
        entity: `Item ${i.itemCode}`,
        time: i.createdAt,
      })),
      ...recentOps.map((o) => ({
        user: 'System',
        action: 'created',
        entity: `Operation ${o.operationCode}`,
        time: o.createdAt,
      })),
      ...recentRoutings.map((r) => ({
        user: r.createdBy?.name || 'Unknown',
        action: 'created',
        entity: `Routing ${r.routingCode}`,
        time: r.createdAt,
      })),
      ...recentJobOrders.map((j) => ({
        user: j.createdBy?.name || 'Unknown',
        action: 'created',
        entity: `Job Order ${j.jobOrderNo}`,
        time: j.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5);

    res.status(200).json({
      stats: { totalItems, totalOperations, activeUsers, routingsDefined },
      recentActivity: activity,
    });
  } catch (err) {
    console.error('Admin dashboard summary error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};
