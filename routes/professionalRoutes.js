const express = require('express');
const router = express.Router();
const professionalController = require('../controllers/professionalController');
const authMiddleware = require('../middleware/auth');
const { professionalValidation } = require('../utils/validation');

// Public routes (any authenticated user)
router.get(
  '/organization/:organizationId',
  professionalValidation.organizationIdParam,
  professionalController.getProfessionalsByOrg
);
router.get('/qr/:qrId', professionalValidation.qrIdParam, professionalController.getProfessionalByQr);
router.get('/:professionalId', professionalValidation.professionalIdParam, professionalController.getProfessionalById);

// All routes below require authentication
router.use(authMiddleware);

// Create professional (admin/manager)
router.post('/create', professionalValidation.create, professionalController.createProfessional);

// Update professional (admin/manager)
router.patch(
  '/:professionalId',
  professionalValidation.professionalIdParam,
  professionalValidation.update,
  professionalController.updateProfessional
);

// Update status (admin/manager)
router.patch(
  '/:professionalId/status',
  professionalValidation.professionalIdParam,
  professionalValidation.statusUpdate,
  professionalController.updateProfessionalStatus
);

// Get status history (admin/manager)
router.get(
  '/:professionalId/history',
  professionalValidation.professionalIdParam,
  professionalController.getProfessionalHistory
);

module.exports = router;