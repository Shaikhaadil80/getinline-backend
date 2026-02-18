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

module.exports = {
  user: userValidation,
  organization: organizationValidation,
  joinRequest: joinRequestValidation,
  professional: professionalValidation,
};

// module.exports = {
//   userValidation,
//   organizationValidation, // add this
// };
