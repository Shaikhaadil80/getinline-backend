const JoinRequest = require('../models/JoinRequest');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');
const { sendNotificationToOrgRoles, sendNotificationToUser } = require('../services/notificationService');

const handleValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
};

// Generate a unique request ID
const generateRequestId = () => {
  return `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// @desc    Create a join request (user scans organization QR)
// @route   POST /api/join-requests/create
// @access  Private
const createJoinRequest = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { organizationId } = req.body;
    const userId = req.user.uid;

    // Check if organization exists and is active
    const organization = await Organization.findOne({ organizationId, status: 'active' });
    if (!organization) {
      throw new AppError('Organization not found or inactive', 404);
    }

    // Check if user already has an organization
    if (req.dbUser?.organizationId) {
      throw new AppError('You already belong to an organization', 400);
    }

    // Check for existing pending request
    const existingRequest = await JoinRequest.findOne({
      userId,
      organizationId,
      status: 'pending',
    });
    if (existingRequest) {
      throw new AppError('You already have a pending request for this organization', 400);
    }

    // Create new request
    const requestId = generateRequestId();
    const newRequest = new JoinRequest({
      requestId,
      userId,
      organizationId,
      status: 'pending',
      requestedAt: new Date(),
    });

    await newRequest.save();

    // TODO: Send FCM notification to organization admins
// Notify organization admins and managers
await sendNotificationToOrgRoles(
  organizationId,
  ['admin', 'manager'],
  {
    title: 'New Join Request',
    body: `A user wants to join your organization.`,
  },
  {
    type: 'join_request',
    requestId: newRequest.requestId,
    organizationId: organizationId,
  }
);
// Notify user
    res.status(201).json({
      success: true,
      joinRequest: newRequest,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all join requests for an organization
// @route   GET /api/join-requests/organization/:organizationId
// @access  Private (admin/manager of that organization)
const getJoinRequestsByOrg = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { organizationId } = req.params;
    const { status, limit = 50, skip = 0 } = req.query;

    // Check if user has access (admin/manager of this org)
    if (req.dbUser?.organizationId !== organizationId || !['admin', 'manager'].includes(req.dbUser?.role)) {
      throw new AppError('Access denied', 403);
    }

    const filter = { organizationId };
    if (status) filter.status = status;

    const requests = await JoinRequest.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ requestedAt: -1 });

    const total = await JoinRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      joinRequests: requests,
      pagination: { total, limit, skip },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a join request
// @route   PATCH /api/join-requests/accept/:requestId
// @access  Private (admin/manager of that organization)
const acceptJoinRequest = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { requestId } = req.params;
    const { role = 'professional', remark } = req.body;
    const handledBy = req.user.uid;

    const request = await JoinRequest.findOne({ requestId, status: 'pending' });
    if (!request) {
      throw new AppError('Pending request not found', 404);
    }

    // Check if user has access to this organization
    if (req.dbUser?.organizationId !== request.organizationId || !['admin', 'manager'].includes(req.dbUser?.role)) {
      throw new AppError('Access denied', 403);
    }

    // Update request
    request.status = 'accepted';
    request.handledAt = new Date();
    request.handledBy = handledBy;
    request.requestedRole = role; // store the role they were accepted as
    request.remark = remark || null;
    await request.save();

    // Update user's organizationId and role
    await User.findOneAndUpdate(
      { uid: request.userId },
      {
        $set: {
          organizationId: request.organizationId,
          role: role,
          updatedBy: handledBy,
        }
      }
    );

// inside acceptJoinRequest, before sending:
const organization = await Organization.findOne({ organizationId: request.organizationId });
    // TODO: Send FCM notification to user
// Notify the user that their request was accepted
await sendNotificationToUser(
  request.userId,
  {
    title: 'Join Request Accepted',
    body: `Your request to join ${organization.organizationName} has been accepted. You are now a ${role}.`,
  },
  {
    type: 'join_request_accepted',
    organizationId: request.organizationId,
    organizationName: organization.organizationName, // you may need to fetch org name
  }
);
    res.status(200).json({
      success: true,
      joinRequest: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a join request
// @route   PATCH /api/join-requests/reject/:requestId
// @access  Private (admin/manager of that organization)
const rejectJoinRequest = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { requestId } = req.params;
    const { remark } = req.body;
    const handledBy = req.user.uid;

    const request = await JoinRequest.findOne({ requestId, status: 'pending' });
    if (!request) {
      throw new AppError('Pending request not found', 404);
    }

    // Check if user has access to this organization
    if (req.dbUser?.organizationId !== request.organizationId || !['admin', 'manager'].includes(req.dbUser?.role)) {
      throw new AppError('Access denied', 403);
    }

    // Update request
    request.status = 'rejected';
    request.handledAt = new Date();
    request.handledBy = handledBy;
    request.remark = remark || null;
    await request.save();

    // TODO: Send FCM notification to user
// Notify the user that their request was rejected
await sendNotificationToUser(
  request.userId,
  {
    title: 'Join Request Rejected',
    body: `Your request to join the organization has been rejected.`,
  },
  {
    type: 'join_request_rejected',
    organizationId: request.organizationId,
  }
);
// notify user
    res.status(200).json({
      success: true,
      joinRequest: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's own join requests
// @route   GET /api/join-requests/my
// @access  Private
const getMyJoinRequests = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    const requests = await JoinRequest.find({ userId })
      .sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      joinRequests: requests,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJoinRequest,
  getJoinRequestsByOrg,
  acceptJoinRequest,
  rejectJoinRequest,
  getMyJoinRequests,
};