const Transaction = require('../models/Transaction');
const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');

const handleValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
};

const generateTransactionId = () => {
  return `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// @desc    Create a transaction (record payment)
// @route   POST /api/transactions/create
// @access  Private (admin/manager/receptionist)
const createTransaction = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { appointmentId, amountPaid, paymentMode, paymentDate, remarks } = req.body;
    const uid = req.user.uid;

    // Verify appointment exists and user has access to its organization
    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (req.dbUser?.organizationId !== appointment.organizationId ||
        !['admin', 'manager', 'receptionist'].includes(req.dbUser?.role)) {
      throw new AppError('Access denied', 403);
    }

    const transactionId = generateTransactionId();

    const transaction = new Transaction({
      transactionId,
      appointmentId,
      amountPaid,
      paymentMode,
      paymentDate: paymentDate || new Date(),
      remarks,
      createdBy: uid,
    });

    await transaction.save();

    // Optionally, if appointment was pending due to payment, change status to accepted
    if (appointment.status === 'pending') {
      appointment.status = 'accepted';
      appointment.updatedBy = uid;
      await appointment.save();
    }

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transactions for an appointment
// @route   GET /api/transactions/appointment/:appointmentId
// @access  Private (org staff or patient? Probably staff only)
const getAppointmentTransactions = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Check access: org staff only
    if (req.dbUser?.organizationId !== appointment.organizationId ||
        !['admin', 'manager', 'receptionist'].includes(req.dbUser?.role)) {
      throw new AppError('Access denied', 403);
    }

    const transactions = await Transaction.find({ appointmentId }).sort({ paymentDate: -1 });

    res.json({ success: true, transactions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transactions for an organization
// @route   GET /api/transactions/organization/:organizationId
// @access  Private (admin/manager)
const getOrganizationTransactions = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const { startDate, endDate, limit = 50, skip = 0 } = req.query;

    if (req.dbUser?.organizationId !== organizationId ||
        !['admin', 'manager'].includes(req.dbUser?.role)) {
      throw new AppError('Access denied', 403);
    }

    // Since transactions don't store organizationId directly, we need to join with appointments
    // Approach: find appointments for the org, then get transactions for those appointments
    const appointments = await Appointment.find({ organizationId }).select('appointmentId');
    const appointmentIds = appointments.map(a => a.appointmentId);

    const filter = { appointmentId: { $in: appointmentIds } };
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ paymentDate: -1 });

    const total = await Transaction.countDocuments(filter);

    res.json({ success: true, transactions, pagination: { total, limit, skip } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getAppointmentTransactions,
  getOrganizationTransactions,
};