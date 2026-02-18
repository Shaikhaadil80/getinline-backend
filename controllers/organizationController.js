const Organization = require('../models/Organization');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Helper for validation errors
const handleValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
};

// Generate a unique QR ID
const generateQrId = () => {
  return uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
};

// @desc    Create a new organization
// @route   POST /api/organizations/create
// @access  Private
const createOrganization = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { organizationName, mobile, address, latlong, organizationId: providedOrgId, qrId: providedQrId } = req.body;
    const uid = req.user.uid;

    // Check if user already has an organization
    if (req.dbUser?.organizationId) {
      throw new AppError('User already belongs to an organization', 400);
    }

    // Handle picture upload or provided URL
    let picUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'organizations');
      picUrl = result.secure_url;
    } else if (req.body.picUrl) {
      picUrl = req.body.picUrl; // allow direct URL as fallback
    }

    // Generate IDs if not provided
    const organizationId = providedOrgId || `ORG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const qrId = providedQrId || generateQrId();

    // Ensure unique organizationId and qrId
    const existingOrg = await Organization.findOne({
      $or: [{ organizationId }, { qrId }]
    });
    if (existingOrg) {
      if (existingOrg.organizationId === organizationId) {
        throw new AppError('Organization ID already exists', 400);
      }
      if (existingOrg.qrId === qrId) {
        throw new AppError('QR ID already exists', 400);
      }
    }

    // Create organization
    const newOrg = new Organization({
      organizationId,
      organizationName,
      picUrl,
      mobile,
      address,
      latlong,
      qrId,
      createdBy: uid,
      updatedBy: uid,
    });

    await newOrg.save();

    // Update the creator's user document: set organizationId and role to 'admin'
    await User.findOneAndUpdate(
      { uid },
      { 
        $set: { 
          organizationId, 
          role: 'admin',
          updatedBy: uid 
        } 
      }
    );

    res.status(201).json({
      success: true,
      data: newOrg,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get organization by ID
// @route   GET /api/organizations/:organizationId
// @access  Private (members of that organization or admin)
const getOrganizationById = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { organizationId } = req.params;
    const uid = req.user.uid;

    const organization = await Organization.findOne({ organizationId });
    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    // Check access: user must be in this organization OR be global admin
    if (req.dbUser?.organizationId !== organizationId && req.dbUser?.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    res.status(200).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update organization
// @route   PATCH /api/organizations/:organizationId
// @access  Private (only admin of that organization)
const updateOrganization = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { organizationId } = req.params;
    const uid = req.user.uid;

    const organization = await Organization.findOne({ organizationId });
    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    // Check if user is the creator (admin)
    if (organization.createdBy !== uid && req.dbUser?.role !== 'admin') {
      throw new AppError('Only the organization admin can update', 403);
    }

    const updates = {};
    if (req.body.organizationName) updates.organizationName = req.body.organizationName;
    if (req.body.mobile) updates.mobile = req.body.mobile;
    if (req.body.address) updates.address = req.body.address;
    if (req.body.latlong !== undefined) updates.latlong = req.body.latlong;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.remark !== undefined) updates.remark = req.body.remark;

    // Handle picture update
    if (req.file) {
      // New file uploaded
      const result = await uploadToCloudinary(req.file.buffer, 'organizations');
      updates.picUrl = result.secure_url;
    } else if (req.body.picUrl !== undefined) {
      // Explicit text field: set to provided value (allow null/empty to remove)
      updates.picUrl = req.body.picUrl === '' ? null : req.body.picUrl;
    }

    updates.updatedBy = uid;

    const updatedOrg = await Organization.findOneAndUpdate(
      { organizationId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedOrg,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search organizations by name or address
// @route   GET /api/organizations/search?q=...
// @access  Public
const searchOrganizations = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { q, limit = 20, skip = 0 } = req.query;
    const filter = { status: 'active' };

    if (q && q.trim()) {
      filter.$or = [
        { organizationName: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } },
      ];
    }

    const organizations = await Organization.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ organizationName: 1 });

    const total = await Organization.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: organizations,
      pagination: { total, limit, skip },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get organization by QR ID
// @route   GET /api/organizations/qr/:qrId
// @access  Public
const getOrganizationByQr = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { qrId } = req.params;

    const organization = await Organization.findOne({ qrId, status: 'active' });
    if (!organization) {
      throw new AppError('Organization not found or inactive', 404);
    }

    res.status(200).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrganization,
  getOrganizationById,
  updateOrganization,
  searchOrganizations,
  getOrganizationByQr,
};