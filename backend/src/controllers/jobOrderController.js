const User = require('../models/User');
const JobOrder = require('../models/JobOrder');
const Item = require('../models/Item');
const Routing = require('../models/Routing');
const ScanLog = require('../models/ScanLog');

const generateJobOrderNo = async () => {
  const count = await JobOrder.countDocuments();
  const year = new Date().getFullYear();
  return `JO-${year}-${String(count + 1).padStart(4, '0')}`;
};

exports.createJobOrder = async (req, res) => {
  try {
    const { jobOrderNo, item, routing, quantity, startDate, dueDate, remarks, status } = req.body;

    if (!item || !routing || !quantity || !startDate || !dueDate) {
      return res.status(400).json({
        message: 'Item, routing, quantity, start date, and due date are required',
      });
    }

    const itemExists = await Item.findById(item);
    if (!itemExists) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const routingExists = await Routing.findById(routing);
    if (!routingExists) {
      return res.status(404).json({ message: 'Routing not found' });
    }

    if (new Date(dueDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'Due date cannot be before start date' });
    }

    let finalJobOrderNo = jobOrderNo;
    if (!finalJobOrderNo) {
      finalJobOrderNo = await generateJobOrderNo();
    } else {
      const existing = await JobOrder.findOne({ jobOrderNo: finalJobOrderNo.toUpperCase() });
      if (existing) {
        return res.status(409).json({ message: 'A job order with this number already exists' });
      }
    }

    const jobOrder = await JobOrder.create({
      jobOrderNo: finalJobOrderNo,
      item,
      routing,
      routingVersion: routingExists.version,
      quantity,
      startDate,
      dueDate,
      remarks,
      status,
      createdBy: req.user.id,
    });

    const populated = await jobOrder.populate(['item', 'routing']);

    res.status(201).json({ message: 'Job order created successfully', jobOrder: populated });
  } catch (err) {
    console.error('Create job order error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.getJobOrders = async (req, res) => {
  try {
    const { search, status, itemQuery, date, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (search) {
      filter.jobOrderNo = { $regex: search, $options: 'i' };
    }
    if (status) filter.status = status;

    if (itemQuery) {
      const matchingItems = await Item.find({
        $or: [
          { itemCode: { $regex: itemQuery, $options: 'i' } },
          { name: { $regex: itemQuery, $options: 'i' } },
        ],
      }).select('_id');
      filter.item = { $in: matchingItems.map((i) => i._id) };
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.dueDate = { $gte: start, $lte: end };
    }

    const jobOrders = await JobOrder.find(filter)
      .populate('item', 'itemCode name description unitOfMeasure')
      .populate('routing', 'routingCode version')
      .sort({ jobOrderNo: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await JobOrder.countDocuments(filter);

    res.status(200).json({
      jobOrders,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Get job orders error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.getJobOrderById = async (req, res) => {
  try {
    const jobOrder = await JobOrder.findById(req.params.id)
      .populate('item', 'itemCode name description unitOfMeasure')
      .populate('createdBy', 'name userId')
      .populate({
        path: 'routing',
        populate: [
          { path: 'steps.operation', select: 'operationCode operationName workCenter routingType' },
          { path: 'firstScanOperation', select: 'operationCode operationName' },
          { path: 'lastScanOperation', select: 'operationCode operationName' },
        ],
      });

    if (!jobOrder) {
      return res.status(404).json({ message: 'Job order not found' });
    }
    res.status(200).json({ jobOrder });
  } catch (err) {
    console.error('Get job order error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.updateJobOrder = async (req, res) => {
  try {
    const { item, routing, quantity, startDate, dueDate, remarks, status } = req.body;

    const jobOrder = await JobOrder.findById(req.params.id);
    if (!jobOrder) {
      return res.status(404).json({ message: 'Job order not found' });
    }

    if (item) {
      const itemExists = await Item.findById(item);
      if (!itemExists) return res.status(404).json({ message: 'Item not found' });
    }

    if (routing) {
      const routingExists = await Routing.findById(routing);
      if (!routingExists) return res.status(404).json({ message: 'Routing not found' });
      jobOrder.routingVersion = routingExists.version;
    }

    if (status === 'Completed' && jobOrder.status !== 'Completed') {
      const processed = jobOrder.completedQuantity + jobOrder.rejectQuantity;
      if (processed < jobOrder.quantity) {
        return res.status(400).json({
          message: `Cannot mark as Completed: only ${processed} of ${jobOrder.quantity} units processed.`,
        });
      }
    }

    jobOrder.item = item ?? jobOrder.item;
    jobOrder.routing = routing ?? jobOrder.routing;
    jobOrder.quantity = quantity ?? jobOrder.quantity;
    jobOrder.startDate = startDate ?? jobOrder.startDate;
    jobOrder.dueDate = dueDate ?? jobOrder.dueDate;
    jobOrder.remarks = remarks ?? jobOrder.remarks;
    jobOrder.status = status ?? jobOrder.status;

    await jobOrder.save();
    const populated = await jobOrder.populate(['item', 'routing']);

    res.status(200).json({ message: 'Job order updated successfully', jobOrder: populated });
  } catch (err) {
    console.error('Update job order error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.deleteJobOrder = async (req, res) => {
  try {
    const jobOrder = await JobOrder.findById(req.params.id);
    if (!jobOrder) {
      return res.status(404).json({ message: 'Job order not found' });
    }
    await ScanLog.deleteMany({ jobOrder: jobOrder._id });
    await jobOrder.deleteOne();
    res.status(200).json({ message: 'Job order and associated scan logs deleted successfully' });
  } catch (err) {
    console.error('Delete job order error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const [total, inProgress, completed, pending] = await Promise.all([
      JobOrder.countDocuments(),
      JobOrder.countDocuments({ status: 'In Progress' }),
      JobOrder.countDocuments({ status: 'Completed' }),
      JobOrder.countDocuments({ status: { $in: ['Planned', 'Released'] } }),
    ]);

    res.status(200).json({
      summary: { totalJobOrders: total, inProgress, completed, pending },
    });
  } catch (err) {
    console.error('Dashboard summary error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.getProductionMonitoring = async (req, res) => {
  try {
    const jobOrders = await JobOrder.find({ status: { $in: ['Released', 'In Progress'] } })
      .populate('item', 'itemCode name')
      .populate({
        path: 'routing',
        populate: { path: 'steps.operation', select: 'operationCode operationName workCenter routingType' },
      })
      .sort({ startDate: 1 });

    const monitoring = jobOrders.map((jo) => {
      const currentStep = jo.routing.steps[jo.currentOperationIndex];
      const progressPercent =
        jo.quantity > 0
          ? (((jo.completedQuantity + jo.rejectQuantity) / jo.quantity) * 100).toFixed(1)
          : '0.0';

      return {
        jobOrderNo: jo.jobOrderNo,
        item: jo.item,
        quantity: jo.quantity,
        completedQuantity: jo.completedQuantity,
        rejectQuantity: jo.rejectQuantity,
        progressPercent: Number(progressPercent),
        status: jo.status,
        currentOperation: currentStep ? currentStep.operation : null,
        workCenter: currentStep ? currentStep.operation.workCenter : null,
        dueDate: jo.dueDate,
      };
    });

    res.status(200).json({ monitoring, total: monitoring.length });
  } catch (err) {
    console.error('Production monitoring error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  GET /api/joborders/by-operation/:operationId
// Every job order whose routing includes this operation, with per-operation counts
exports.getJobOrdersByOperation = async (req, res) => {
  try {
    const { operationId } = req.params;

    if (req.user.role === 'operator') {
      const user = await User.findById(req.user.id).select('assignedOperations');
      const allowedIds = (user.assignedOperations || []).map((id) => String(id));
      if (!allowedIds.includes(operationId)) {
        return res.status(403).json({ message: 'This operation is not assigned to you.' });
      }
    }

    const routings = await Routing.find({ 'steps.operation': operationId }).select('_id');
    const routingIds = routings.map((r) => r._id);

    const jobOrders = await JobOrder.find({ routing: { $in: routingIds } })
      .populate('item', 'itemCode name description unitOfMeasure')
      .populate({
        path: 'routing',
        populate: { path: 'steps.operation', select: 'operationCode operationName' },
      })
      .sort({ jobOrderNo: 1 });

    const results = [];
    for (const jo of jobOrders) {
      const steps = jo.routing.steps.slice().sort((a, b) => a.sequenceNo - b.sequenceNo);
      const idx = steps.findIndex((s) => String(s.operation._id || s.operation) === String(operationId));
      if (idx === -1) continue;

      const completed = await ScanLog.countDocuments({ jobOrder: jo._id, operation: operationId, status: 'Pass' });

      let prevCompleted = jo.quantity;
      if (idx > 0) {
        const prevOpId = steps[idx - 1].operation._id || steps[idx - 1].operation;
        prevCompleted = await ScanLog.countDocuments({ jobOrder: jo._id, operation: prevOpId, status: 'Pass' });
      }

      results.push({
        jobOrderId: jo._id,
        jobOrderNo: jo.jobOrderNo,
        item: jo.item,
        quantity: jo.quantity,
        completed,
        pending: Math.max(prevCompleted - completed, 0),
        balance: Math.max(jo.quantity - completed, 0),
        status: jo.status,
        dueDate: jo.dueDate,
      });
    }

    res.status(200).json({ jobOrders: results });
  } catch (err) {
    console.error('Get job orders by operation error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};