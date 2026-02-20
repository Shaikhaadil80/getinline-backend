const express = require('express');
const router = express.Router();
const joinRequestController = require('../controllers/joinRequestController');
const authMiddleware = require('../middleware/auth');
const { joinRequest } = require('../utils/validation');

// All routes require authentication
router.use(authMiddleware);

// Create a join request
router.post('/create', joinRequest.create, joinRequestController.createJoinRequest);

// Get user's own requests
router.get('/my', joinRequestController.getMyJoinRequests);

// Get requests for an organization (admin/manager)
router.get(
  '/organization/:organizationId',
  joinRequest.organizationIdParam,
  joinRequest.statusQuery,
  joinRequestController.getJoinRequestsByOrg
);

// Accept a request
router.patch(
  '/accept/:requestId',
  joinRequest.accept,
  joinRequestController.acceptJoinRequest
);

// Reject a request
router.patch(
  '/reject/:requestId',
  joinRequest.reject,
  joinRequestController.rejectJoinRequest
);

module.exports = router;