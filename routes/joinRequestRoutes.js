const express = require('express');
const router = express.Router();
const joinRequestController = require('../controllers/joinRequestController');
const authMiddleware = require('../middleware/auth');
const { joinRequestValidation } = require('../utils/validation');

// All routes require authentication
router.use(authMiddleware);

// Create a join request
router.post('/create', joinRequestValidation.create, joinRequestController.createJoinRequest);

// Get user's own requests
router.get('/my', joinRequestController.getMyJoinRequests);

// Get requests for an organization (admin/manager)
router.get(
  '/organization/:organizationId',
  joinRequestValidation.organizationIdParam,
  joinRequestValidation.statusQuery,
  joinRequestController.getJoinRequestsByOrg
);

// Accept a request
router.patch(
  '/accept/:requestId',
  joinRequestValidation.accept,
  joinRequestController.acceptJoinRequest
);

// Reject a request
router.patch(
  '/reject/:requestId',
  joinRequestValidation.reject,
  joinRequestController.rejectJoinRequest
);

module.exports = router;