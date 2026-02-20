const { body, param, query } = require('express-validator');

const userValidation = {
  create: [
    body('name').isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('mobile').matches(/^\d{10}$/).withMessage('Mobile must be 10 digits'),
    body('address').notEmpty().withMessage('Address is required'),
    body('role').optional().isIn(['customer', 'admin', 'manager', 'receptionist', 'professional']),
    body('organizationId').optional().isString(),
  ],
  updateProfile: [
    body('name').optional().isLength({ min: 2, max: 100 }),
    body('mobile').optional().matches(/^\d{10}$/),
    body('address').optional().notEmpty(),
  ],
  fcmToken: [
    body('fcmToken').notEmpty().withMessage('FCM token is required'),
  ],
  updateRole: [
    body('uid').notEmpty().withMessage('User UID is required'),
    body('role').isIn(['customer', 'admin', 'manager', 'receptionist', 'professional']).withMessage('Invalid role'),
  ],
  updateStatus: [
    body('uid').notEmpty().withMessage('User UID is required'),
    body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  ],
  uidParam: [
    param('uid').notEmpty().withMessage('UID is required'),
  ],
};

const organizationValidation = {
  create: [
    body('organizationId').optional().isString().withMessage('Organization ID must be a string'),
    body('organizationName').isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('picUrl').optional().isURL().withMessage('Invalid picture URL'),
    body('mobile').matches(/^\d{10}$/).withMessage('Mobile must be 10 digits'),
    body('address').notEmpty().withMessage('Address is required'),
    body('latlong').optional().isString(),
    body('qrId').optional().isString().withMessage('QR ID must be a string'),
  ],
  update: [
    body('organizationName').optional().isLength({ min: 2, max: 100 }),
    body('picUrl').optional().isURL(),
    body('mobile').optional().matches(/^\d{10}$/),
    body('address').optional().notEmpty(),
    body('latlong').optional().isString(),
    body('status').optional().isIn(['active', 'inactive', 'suspended']),
    body('remark').optional().isString(),
  ],
  organizationIdParam: [
    param('organizationId').notEmpty().withMessage('Organization ID is required'),
  ],
  qrIdParam: [
    param('qrId').notEmpty().withMessage('QR ID is required'),
  ],
  search: [
    query('q').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
  ],
};


const joinRequestValidation = {
  create: [
    body('organizationId').notEmpty().withMessage('Organization ID is required'),
  ],
  accept: [
    param('requestId').notEmpty().withMessage('Request ID is required'),
    body('role').optional().isIn(['customer', 'professional', 'receptionist', 'manager', 'admin']).withMessage('Invalid role'),
    body('remark').optional().isString(),
  ],
  reject: [
    param('requestId').notEmpty().withMessage('Request ID is required'),
    body('remark').optional().isString(),
  ],
  organizationIdParam: [
    param('organizationId').notEmpty().withMessage('Organization ID is required'),
  ],
  statusQuery: [
    query('status').optional().isIn(['pending', 'accepted', 'rejected']),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
  ],
};

const professionalValidation = {
  create: [
    body('name').notEmpty().withMessage('Name is required'),
    body('profession').notEmpty().withMessage('Profession is required'),
    body('degree').notEmpty().withMessage('Degree is required'),
    body('mobile').matches(/^\d{10}$/).withMessage('Mobile must be 10 digits'),
    body('slots').optional().isArray(),
    body('commonLeaves').optional().isArray(),
    body('isPaidAppointment').optional().isBoolean(),
    body('appointmentFees').optional().isNumeric(),
    body('minBookAppointmentFees').optional().isNumeric(),
    body('commonMeetingTimeFrame').optional().isInt({ min: 1 }),
  ],
  update: [
    body('name').optional().notEmpty(),
    body('profession').optional().notEmpty(),
    body('degree').optional().notEmpty(),
    body('mobile').optional().matches(/^\d{10}$/),
    body('status').optional().isIn(['IN', 'OUT']),
    body('slots').optional().isArray(),
    body('commonLeaves').optional().isArray(),
    body('active').optional().isBoolean(),
    body('isPaidAppointment').optional().isBoolean(),
    body('appointmentFees').optional().isNumeric(),
    body('minBookAppointmentFees').optional().isNumeric(),
    body('commonMeetingTimeFrame').optional().isInt({ min: 1 }),
    body('inOutNote').optional().isString(),
  ],
  statusUpdate: [
    body('status').isIn(['IN', 'OUT']).withMessage('Status must be IN or OUT'),
    body('note').optional().isString(),
  ],
  professionalIdParam: [
    param('professionalId').notEmpty().withMessage('Professional ID is required'),
  ],
  organizationIdParam: [
    param('organizationId').notEmpty().withMessage('Organization ID is required'),
  ],
  qrIdParam: [
    param('qrId').notEmpty().withMessage('QR ID is required'),
  ],
};

const appointmentValidation = {
  create: [
    body('name').notEmpty().withMessage('Name is required'),
    body('age').isInt({ min: 0, max: 150 }).withMessage('Valid age required'),
    body('mobileNo').matches(/^\d{10}$/).withMessage('10-digit mobile required'),
    body('address').notEmpty().withMessage('Address required'),
    body('organizationId').notEmpty().withMessage('Organization ID required'),
    body('professionalId').notEmpty().withMessage('Professional ID required'),
    body('appointmentDate').isISO8601().toDate().withMessage('Valid date required'),
    body('appointmentExpectedTime').notEmpty().withMessage('Expected time required'),
    body('status').optional().isIn(['pending', 'accepted', 'cancelled', 'InLine']),
  ],
  update: [
    param('appointmentId').notEmpty(),
    body('status').optional().isIn(['pending', 'accepted', 'cancelled', 'InLine']),
    body('appointmentExpectedTime').optional(),
    body('name').optional(),
    body('mobileNo').optional().matches(/^\d{10}$/),
  ],
  appointmentIdParam: [
    param('appointmentId').notEmpty(),
  ],
  professionalIdParam: [
    param('professionalId').notEmpty(),
  ],
  organizationIdParam: [
    param('organizationId').notEmpty(),
  ],
  dateQuery: [
    query('date').optional().isISO8601().toDate(),
    query('status').optional().isString(),
  ],
  limitCheck: [
    query('date').isISO8601().toDate(),
    query('userId').optional(), // for admin checking others? not needed now
  ],
};

const leaveValidation = {
  create: [
    body('professionalId').notEmpty(),
    body('startDate').isISO8601().toDate(),
    body('endDate').isISO8601().toDate().custom((end, { req }) => {
      if (end < req.body.startDate) throw new Error('End date must be after start date');
      return true;
    }),
    body('reason').optional().isString(),
  ],
  update: [
    param('leaveId').notEmpty(),
    body('startDate').optional().isISO8601().toDate(),
    body('endDate').optional().isISO8601().toDate(),
    body('reason').optional().isString(),
  ],
  leaveIdParam: [param('leaveId').notEmpty()],
  professionalIdParam: [param('professionalId').notEmpty()],
};

const notificationValidation = {
  userIdParam: [param('userId').notEmpty()],
  notificationIdParam: [param('notificationId').notEmpty()],
};

const notifyValidation = {
  create: [
    body('professionalId').notEmpty(),
    body('organizationId').notEmpty(),
  ],
  notifyIdParam: [param('notifyId').notEmpty()],
  professionalIdParam: [param('professionalId').notEmpty()],
};

const transactionValidation = {
  create: [
    body('appointmentId').notEmpty(),
    body('amountPaid').isNumeric().withMessage('Amount must be a number'),
    body('paymentMode').isIn(['cash', 'online', 'phonepe', 'card', 'other']),
    body('paymentDate').optional().isISO8601().toDate(),
    body('remarks').optional().isString(),
  ],
  appointmentIdParam: [param('appointmentId').notEmpty()],
  organizationIdParam: [param('organizationId').notEmpty()],
};

module.exports = {
  user: userValidation,
  organization: organizationValidation,
  joinRequest: joinRequestValidation,
  professional: professionalValidation,
  appointment: appointmentValidation,
  leave: leaveValidation,
  notification: notificationValidation,
  notify: notifyValidation,
  transaction: transactionValidation,
};

// module.exports = {
//   userValidation,
//   organizationValidation, // add this
// };
