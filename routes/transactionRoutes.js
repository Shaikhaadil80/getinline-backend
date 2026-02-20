const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/auth');
const { transaction } = require('../utils/validation');

// All routes require authentication
router.use(authMiddleware);

router.post('/create', transaction.create, transactionController.createTransaction);
router.get('/appointment/:appointmentId', transaction.appointmentIdParam, transactionController.getAppointmentTransactions);
router.get('/organization/:organizationId', transaction.organizationIdParam, transactionController.getOrganizationTransactions);

module.exports = router;