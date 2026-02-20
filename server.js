require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const joinRequestRoutes = require('./routes/joinRequestRoutes');
const professionalRoutes = require('./routes/professionalRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const notifyRoutes = require('./routes/notifyRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const { errorHandler } = require('./utils/errorHandler');

const app = express();

// Connect to database
connectDB();


const cors = require('cors');

app.use(cors({
  origin: [
    'https://getinlin.web.app',
    'https://getinlin.firebaseapp.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// IMPORTANT: handle preflight
app.options('*', cors());

// Middleware
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/join-requests', joinRequestRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notify', notifyRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));