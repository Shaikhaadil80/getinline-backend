const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const authMiddleware = require('../middleware/auth');
const { leave } = require('../utils/validation');

// Public check availability
router.get('/check-availability', leaveController.checkAvailability);
router.get('/professional/:professionalId', leave.professionalIdParam, leaveController.getLeavesByProfessional);

// Protected routes (require auth)
router.use(authMiddleware);

router.post('/create', leave.create, leaveController.createLeave);
router.patch('/:leaveId', leave.update, leaveController.updateLeave);
router.delete('/:leaveId', leave.leaveIdParam, leaveController.deleteLeave);

module.exports = router;