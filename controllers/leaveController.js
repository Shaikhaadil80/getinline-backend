const Leave = require('../models/Leave');
const Professional = require('../models/Professional');
const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');

const handleValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
};

const generateLeaveId = () => {
  return `LEAVE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// @desc    Create a leave
// @route   POST /api/leaves/create
// @access  Private (admin/manager of org)
const createLeave = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { professionalId, startDate, endDate, reason } = req.body;
    const uid = req.user.uid;

    // Verify professional exists and user has access to its organization
    const professional = await Professional.findOne({ professionalId });
    if (!professional) {
      throw new AppError('Professional not found', 404);
    }

    if (req.dbUser?.organizationId !== professional.organizationId ||
        !['admin', 'manager'].includes(req.dbUser?.role)) {
      throw new AppError('Access denied', 403);
    }

    const leaveId = generateLeaveId();

    const leave = new Leave({
      leaveId,
      professionalId,
      startDate,
      endDate,
      reason,
    });

    await leave.save();

    // TODO: Optionally cancel appointments for this period? Notify customers.

    res.status(201).json({ success: true, leave });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leaves for a professional
// @route   GET /api/leaves/professional/:professionalId
// @access  Public (any authenticated user)
const getLeavesByProfessional = async (req, res, next) => {
  try {
    const { professionalId } = req.params;
    const { start, end } = req.query; // optional date range

    const filter = { professionalId };
    if (start || end) {
      filter.$or = [];
      if (start) {
        const startDate = new Date(start);
        filter.$or.push({ endDate: { $gte: startDate } });
      }
      if (end) {
        const endDate = new Date(end);
        filter.$or.push({ startDate: { $lte: endDate } });
      }
    }

    const leaves = await Leave.find(filter).sort({ startDate: -1 });
    res.json({ success: true, leaves });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a leave
// @route   PATCH /api/leaves/:leaveId
// @access  Private (admin/manager)
const updateLeave = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { leaveId } = req.params;
    const updates = req.body;

    const leave = await Leave.findOne({ leaveId });
    if (!leave) {
      throw new AppError('Leave not found', 404);
    }

    // Verify access to professional's organization
    const professional = await Professional.findOne({ professionalId: leave.professionalId });
    if (req.dbUser?.organizationId !== professional.organizationId ||
        !['admin', 'manager'].includes(req.dbUser?.role)) {
      throw new AppError('Access denied', 403);
    }

    // Allow updating dates, reason
    const allowedUpdates = ['startDate', 'endDate', 'reason'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) leave[field] = updates[field];
    });

    await leave.save();

    res.json({ success: true, leave });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a leave
// @route   DELETE /api/leaves/:leaveId
// @access  Private (admin/manager)
const deleteLeave = async (req, res, next) => {
  try {
    const { leaveId } = req.params;

    const leave = await Leave.findOne({ leaveId });
    if (!leave) {
      throw new AppError('Leave not found', 404);
    }

    // Verify access
    const professional = await Professional.findOne({ professionalId: leave.professionalId });
    if (req.dbUser?.organizationId !== professional.organizationId ||
        !['admin', 'manager'].includes(req.dbUser?.role)) {
      throw new AppError('Access denied', 403);
    }

    await leave.deleteOne();
    res.json({ success: true, message: 'Leave deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if a professional is available on a given date/time
// @route   GET /api/leaves/check-availability
// @access  Public
const checkAvailability = async (req, res, next) => {
  try {
    const { professionalId, date } = req.query;
    if (!professionalId || !date) {
      throw new AppError('professionalId and date required', 400);
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Check if professional exists and is active
    const professional = await Professional.findOne({ professionalId, active: true });
    if (!professional) {
      return res.json({ available: false, reason: 'Professional not active' });
    }

    // Check for leaves covering this date
    const leave = await Leave.findOne({
      professionalId,
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
    });

    if (leave) {
      return res.json({ available: false, reason: 'On leave', leave });
    }

    // Check if it's a common leave day (if day name in commonLeaves)
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    if (professional.commonLeaves && professional.commonLeaves.includes(dayName)) {
      return res.json({ available: false, reason: 'Weekly off' });
    }

    res.json({ available: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLeave,
  getLeavesByProfessional,
  updateLeave,
  deleteLeave,
  checkAvailability,
};