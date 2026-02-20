const Appointment = require('../models/Appointment');
const Professional = require('../models/Professional');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');
const { sendNotificationToUser } = require('../services/notificationService');

const handleValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
};

const generateAppointmentId = () => {
  return `APT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// @desc    Check if user can book more appointments on a given date (max 3)
// @route   GET /api/appointments/check-limit
// @access  Private (customer)
const checkAppointmentLimit = async (req, res, next) => {
  try {
    const { date } = req.query;
    const userId = req.user.uid;

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const count = await Appointment.countDocuments({
      createdBy: userId,
      appointmentDate: { $gte: start, $lte: end },
      status: { $nin: ['cancelled'] },
    });

    const remaining = Math.max(0, 3 - count);
    res.json({ success: true, booked: count, remaining, limit: 3 });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new appointment
// @route   POST /api/appointments/create
// @access  Private
const createAppointment = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const {
      name, age, mobileNo, address, organizationId, professionalId,
      appointmentDate, appointmentExpectedTime,
    } = req.body;

    const uid = req.user.uid;
    const user = req.dbUser;

    // Check if user is customer or organization staff
    // For customers, enforce limit; for staff, allow unlimited (registeredByOrganization)
    const isStaff = user && user.organizationId === organizationId && 
                    ['admin', 'manager', 'receptionist'].includes(user.role);

    // If customer, check daily limit
    if (!isStaff) {
      const start = new Date(appointmentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(appointmentDate);
      end.setHours(23, 59, 59, 999);

      const count = await Appointment.countDocuments({
        createdBy: uid,
        appointmentDate: { $gte: start, $lte: end },
        status: { $nin: ['cancelled'] },
      });
      if (count >= 3) {
        throw new AppError('You have reached the maximum of 3 appointments for this day', 400);
      }
    }

    // Verify professional exists and belongs to the organization
    const professional = await Professional.findOne({ professionalId, organizationId });
    if (!professional) {
      throw new AppError('Professional not found in this organization', 404);
    }

    // Check if professional is active and not on leave (optional: integrate leave check)
    if (!professional.active) {
      throw new AppError('Professional is not active', 400);
    }

    // For paid appointments, status = pending; else accepted
    let status = 'accepted';
    if (professional.isPaidAppointment) {
      status = 'pending';
    }

    const appointmentId = generateAppointmentId();

    const appointment = new Appointment({
      appointmentId,
      name,
      age,
      mobileNo,
      address,
      organizationId,
      professionalId,
      appointmentDate,
      appointmentExpectedTime,
      status,
      registeredByOrganization: isStaff,
      createdBy: uid,
      updatedBy: uid,
    });

    await appointment.save();

    // Send notification to professional (if they have FCM token)
    // Find the professional's user? Professional is not necessarily a user; they might not have an account.
    // Instead, we can notify the organization admins/managers/receptionists.
    const orgAdmins = await User.find({
      organizationId,
      role: { $in: ['admin', 'manager', 'receptionist'] },
      fcmToken: { $exists: true, $ne: null },
    });

    for (const admin of orgAdmins) {
      await sendNotificationToUser(
        admin.uid,
        {
          title: 'New Appointment',
          body: `${name} booked an appointment with ${professional.name} on ${new Date(appointmentDate).toLocaleDateString()}`,
        },
        {
          type: 'appointment_created',
          appointmentId,
          professionalId,
        }
      );
    }

    res.status(201).json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointments for logged-in user
// @route   GET /api/appointments/my
// @access  Private
const getMyAppointments = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { status, limit = 50, skip = 0 } = req.query;

    const filter = { createdBy: uid };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ appointmentDate: -1 });

    const total = await Appointment.countDocuments(filter);

    res.json({ success: true, appointments, pagination: { total, limit, skip } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointments for an organization (admin/manager/receptionist)
// @route   GET /api/appointments/organization/:organizationId
// @access  Private (org staff)
const getOrganizationAppointments = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const { professionalId, date, status, limit = 50, skip = 0 } = req.query;

    // Check permission
    if (req.dbUser?.organizationId !== organizationId || 
        !['admin', 'manager', 'receptionist'].includes(req.dbUser?.role)) {
      throw new AppError('Access denied', 403);
    }

    const filter = { organizationId };
    if (professionalId) filter.professionalId = professionalId;
    if (status) filter.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.appointmentDate = { $gte: start, $lte: end };
    }

    const appointments = await Appointment.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ appointmentDate: 1, appointmentExpectedTime: 1 });

    const total = await Appointment.countDocuments(filter);

    res.json({ success: true, appointments, pagination: { total, limit, skip } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointments for a specific professional (public view for queue)
// @route   GET /api/appointments/professional/:professionalId
// @access  Public (authenticated)
const getProfessionalAppointments = async (req, res, next) => {
  try {
    const { professionalId } = req.params;
    const { date, status = 'accepted' } = req.query;

    // If date not provided, use today
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      professionalId,
      appointmentDate: { $gte: start, $lte: end },
      status,
    }).sort({ appointmentExpectedTime: 1 });

    res.json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's appointments (for export)
// @route   GET /api/appointments/today
// @access  Private (org staff)
const getTodayAppointments = async (req, res, next) => {
  try {
    const organizationId = req.dbUser?.organizationId;
    if (!organizationId || !['admin', 'manager', 'receptionist'].includes(req.dbUser?.role)) {
      throw new AppError('Access denied', 403);
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      organizationId,
      appointmentDate: { $gte: start, $lte: end },
    }).sort({ professionalId: 1, appointmentExpectedTime: 1 });

    res.json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment (status, etc.)
// @route   PATCH /api/appointments/:appointmentId
// @access  Private (staff or customer who created it)
const updateAppointment = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { appointmentId } = req.params;
    const uid = req.user.uid;
    const updates = req.body;

    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Check permission: either the creator (customer) or organization staff
    const isCreator = appointment.createdBy === uid;
    const isOrgStaff = req.dbUser?.organizationId === appointment.organizationId &&
                       ['admin', 'manager', 'receptionist'].includes(req.dbUser?.role);

    if (!isCreator && !isOrgStaff) {
      throw new AppError('Access denied', 403);
    }

    // If customer, only allow cancellation (status to cancelled)
    if (isCreator && !isOrgStaff) {
      if (updates.status !== 'cancelled' || Object.keys(updates).length > 1) {
        throw new AppError('Customers can only cancel appointments', 403);
      }
    }

    // Prevent changing certain fields if not staff
    if (!isOrgStaff) {
      delete updates.professionalId;
      delete updates.appointmentDate;
      delete updates.registeredByOrganization;
    }

    updates.updatedBy = uid;
    delete updates.appointmentId; // don't change ID

    const updated = await Appointment.findOneAndUpdate(
      { appointmentId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    // If status changed to cancelled, notify the other party
    if (updates.status === 'cancelled') {
      // Notify professional (via staff) and possibly creator
      // For simplicity, notify org staff
      const orgStaff = await User.find({
        organizationId: appointment.organizationId,
        role: { $in: ['admin', 'manager', 'receptionist'] },
        fcmToken: { $exists: true, $ne: null },
      });
      for (const staff of orgStaff) {
        await sendNotificationToUser(
          staff.uid,
          { title: 'Appointment Cancelled', body: `Appointment ${appointmentId} cancelled` },
          { type: 'appointment_cancelled', appointmentId }
        );
      }
    }

    res.json({ success: true, appointment: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get queue and expected time for a professional (for customer view)
// @route   GET /api/appointments/queue/:professionalId
// @access  Public
const getQueue = async (req, res, next) => {
  try {
    const { professionalId } = req.params;
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      professionalId,
      appointmentDate: { $gte: start, $lte: end },
      status: { $in: ['accepted', 'InLine'] },
    }).sort({ appointmentExpectedTime: 1 });

    // For now, just return the list; frontend can compute expected time based on meeting time frame
    // Optionally, we could compute estimated times using commonMeetingTimeFrame from professional model
    const professional = await Professional.findOne({ professionalId });
    const meetingTime = professional?.commonMeetingTimeFrame || 15;

    const queue = appointments.map((apt, index) => ({
      ...apt.toObject(),
      estimatedStartTime: index * meetingTime, // in minutes from start? Not precise; frontend can handle.
    }));

    res.json({ success: true, queue, meetingTime });
  } catch (error) {
    next(error);
  }
};


const cancelAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const uid = req.user.uid;

    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) throw new AppError('Appointment not found', 404);

    const isCreator = appointment.createdBy === uid;
    const isOrgStaff = req.dbUser?.organizationId === appointment.organizationId &&
                       ['admin', 'manager', 'receptionist'].includes(req.dbUser?.role);
    if (!isCreator && !isOrgStaff) throw new AppError('Access denied', 403);

    if (appointment.status === 'cancelled') throw new AppError('Already cancelled', 400);

    appointment.status = 'cancelled';
    appointment.updatedBy = uid;
    await appointment.save();

    res.json({ success: true, data: appointment });
  } catch (error) { next(error); }
};


module.exports = {
  checkAppointmentLimit,
  createAppointment,
  getMyAppointments,
  getOrganizationAppointments,
  getProfessionalAppointments,
  getTodayAppointments,
  updateAppointment,
  getQueue,
  cancelAppointment,
};