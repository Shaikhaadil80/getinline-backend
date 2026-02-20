const Professional = require('../models/Professional');
const ProfessionalStatusHistory = require('../models/ProfessionalStatusHistory');
const Organization = require('../models/Organization');
const { sendNotificationToTopic } = require('../services/notificationService');
const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');

const handleValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
};

// Generate unique IDs
const generateProfessionalId = () => {
  return `PROF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};
const generateQrId = () => {
  return uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
};

// @desc    Create a professional
// @route   POST /api/professionals/create
// @access  Private (admin/manager of organization)
const createProfessional = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const {
      name, profession, degree, mobile, slots, commonLeaves,
      isPaidAppointment, appointmentFees, minBookAppointmentFees,
      commonMeetingTimeFrame, inOutNote, organizationId,
    } = req.body;

    const uid = req.user.uid;

    // // Verify user has access to this organization (admin/manager)
    // if (req.dbUser?.organizationId !== organizationId || !['admin', 'manager'].includes(req.dbUser?.role)) {
    //   throw new AppError('You do not have permission to create professionals in this organization', 403);
    // }

    // Check organization exists
    const org = await Organization.findOne({ organizationId });
    if (!org) {
      throw new AppError('Organization not found', 404);
    }

    // Generate unique IDs
    const professionalId = generateProfessionalId();
    const qrId = generateQrId();

    // Ensure QR uniqueness
    const existing = await Professional.findOne({ qrId });
    if (existing) {
      // Very unlikely, but try again
      qrId = generateQrId();
    }

    const professional = new Professional({
      professionalId,
      name,
      profession,
      degree,
      mobile,
      slots: slots || [],
      commonLeaves: commonLeaves || [],
      createdBy: uid,
      updatedBy: uid,
      organizationId,
      isPaidAppointment: isPaidAppointment || false,
      appointmentFees: appointmentFees || 0,
      minBookAppointmentFees: minBookAppointmentFees || 0,
      commonMeetingTimeFrame: commonMeetingTimeFrame || 15,
      qrId,
      inOutNote,
    });

    await professional.save();

    res.status(201).json({
      success: true,
      professional,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all professionals for an organization
// @route   GET /api/professionals/organization/:organizationId
// @access  Public (or any authenticated user)
const getProfessionalsByOrg = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { organizationId } = req.params;
    const { active, status, limit = 50, skip = 0 } = req.query;

    const filter = { organizationId };
    if (active !== undefined) filter.active = active === 'true';
    if (status) filter.status = status;

    const professionals = await Professional.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ name: 1 });

    const total = await Professional.countDocuments(filter);

    res.status(200).json({
      success: true,
      professionals,
      pagination: { total, limit, skip },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single professional by ID
// @route   GET /api/professionals/:professionalId
// @access  Public (any authenticated user)
const getProfessionalById = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { professionalId } = req.params;

    const professional = await Professional.findOne({ professionalId });
    if (!professional) {
      throw new AppError('Professional not found', 404);
    }

    res.status(200).json({
      success: true,
      professional,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a professional
// @route   PATCH /api/professionals/:professionalId
// @access  Private (admin/manager of organization)
const updateProfessional = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { professionalId } = req.params;
    const uid = req.user.uid;

    const professional = await Professional.findOne({ professionalId });
    if (!professional) {
      throw new AppError('Professional not found', 404);
    }

    // Check permission
    if (req.dbUser?.organizationId !== professional.organizationId || !['admin', 'manager'].includes(req.dbUser?.role)) {
      throw new AppError('Access denied', 403);
    }

    const updates = {};
    const allowedFields = [
      'name', 'profession', 'degree', 'mobile', 'slots', 'commonLeaves',
      'active', 'remark', 'isPaidAppointment', 'appointmentFees',
      'minBookAppointmentFees', 'commonMeetingTimeFrame', 'inOutNote',
    ];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    updates.updatedBy = uid;

    const updated = await Professional.findOneAndUpdate(
      { professionalId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      professional: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update professional status (IN/OUT) and record history
// @route   PATCH /api/professionals/:professionalId/status
// @access  Private (admin/manager or the professional themselves? Let's allow admin/manager)
const updateProfessionalStatus = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { professionalId } = req.params;
    const { status, note } = req.body;
    const uid = req.user.uid;

    const professional = await Professional.findOne({ professionalId });
    if (!professional) {
      throw new AppError('Professional not found', 404);
    }

    // Check permission: admin/manager of the organization
    if (req.dbUser?.organizationId !== professional.organizationId || !['admin', 'manager'].includes(req.dbUser?.role)) {
      throw new AppError('Access denied', 403);
    }

    // Update status
    professional.status = status;
    professional.inOutNote = note || professional.inOutNote;
    professional.updatedBy = uid;
    await professional.save();

    // Record history
    const history = new ProfessionalStatusHistory({
      professionalId,
      status,
      note,
      changedBy: uid,
    });
    await history.save();
// firebase notification
// Notify users who have subscribed to this professional's availability
// (assuming they subscribe to a topic named "prof_<professionalId>")
await sendNotificationToTopic(
  `prof_${professionalId}`,
  {
    title: `Dr. ${professional.name} is now ${status}`,
    body: status === 'IN' 
      ? 'The professional is now available for appointments.'
      : 'The professional is currently unavailable.',
  },
  {
    type: 'professional_status',
    professionalId: professionalId,
    status: status,
  }
);
// firebase notification
    res.status(200).json({
      success: true,
      professional,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get professional by QR ID
// @route   GET /api/professionals/qr/:qrId
// @access  Public
const getProfessionalByQr = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { qrId } = req.params;

    const professional = await Professional.findOne({ qrId, active: true });
    if (!professional) {
      throw new AppError('Professional not found or inactive', 404);
    }

    res.status(200).json({
      success: true,
      professional,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get status history for a professional
// @route   GET /api/professionals/:professionalId/history
// @access  Private (admin/manager or maybe professional themselves)
const getProfessionalHistory = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { professionalId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const professional = await Professional.findOne({ professionalId });
    if (!professional) {
      throw new AppError('Professional not found', 404);
    }

    // Check permission: allow if user belongs to same organization
    if (req.dbUser?.organizationId !== professional.organizationId) {
      throw new AppError('Access denied', 403);
    }

    const history = await ProfessionalStatusHistory.find({ professionalId })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ changedAt: -1 });

    const total = await ProfessionalStatusHistory.countDocuments({ professionalId });

    res.status(200).json({
      success: true,
      history,
      pagination: { total, limit, skip },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProfessional,
  getProfessionalsByOrg,
  getProfessionalById,
  updateProfessional,
  updateProfessionalStatus,
  getProfessionalByQr,
  getProfessionalHistory,
};