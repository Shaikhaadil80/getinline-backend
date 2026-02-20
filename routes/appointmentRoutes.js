const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/auth');
const { appointment } = require('../utils/validation');

// Public routes (any authenticated user)
router.get('/queue/:professionalId', appointment.professionalIdParam, appointmentController.getQueue);
router.get('/professional/:professionalId', appointment.professionalIdParam, appointmentController.getProfessionalAppointments);

router.post('/cancel/:appointmentId', authMiddleware, appointmentController.cancelAppointment);

router.get('/check-limit', authMiddleware, appointmentController.checkAppointmentLimit);

// All routes below require authentication
router.use(authMiddleware);

router.post('/create', appointment.create, appointmentController.createAppointment);
router.get('/my', appointmentController.getMyAppointments);
router.get('/organization/:organizationId', appointment.organizationIdParam, appointmentController.getOrganizationAppointments);
router.get('/today', appointmentController.getTodayAppointments);
router.patch('/:appointmentId', appointment.update, appointmentController.updateAppointment);

router.put('/:appointmentId', authMiddleware, appointment.update, appointmentController.updateAppointment);

module.exports = router;