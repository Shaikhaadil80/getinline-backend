const express = require('express');
const router = express.Router();
const professionalController = require('../controllers/professionalController');
const authMiddleware = require('../middleware/auth');
const { professional } = require('../utils/validation');

// Public routes (any authenticated user)
router.get(
  '/organization/:organizationId',
  professional.organizationIdParam,
  professionalController.getProfessionalsByOrg
);
router.get('/qr/:qrId', professional.qrIdParam, professionalController.getProfessionalByQr);
router.get('/:professionalId', professional.professionalIdParam, professionalController.getProfessionalById);

// All routes below require authentication
router.use(authMiddleware);

// Create professional (admin/manager)
router.post('/create', professional.create, professionalController.createProfessional);

// Update professional (admin/manager)
router.patch(
  '/:professionalId',
  professional.professionalIdParam,
  professional.update,
  professionalController.updateProfessional
);

// Update status (admin/manager)
router.patch(
  '/:professionalId/status',
  professional.professionalIdParam,
  professional.statusUpdate,
  professionalController.updateProfessionalStatus
);

// Get status history (admin/manager)
router.get(
  '/:professionalId/history',
  professional.professionalIdParam,
  professionalController.getProfessionalHistory
);

router.put('/:professionalId', authMiddleware, professional.update, professionalController.updateProfessional);

module.exports = router;