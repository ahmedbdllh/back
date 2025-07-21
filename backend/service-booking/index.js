const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { testEmailConfiguration } = require('./services/emailService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booking_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('📅 Booking Service: Connected to MongoDB'))
.catch((err) => console.error('❌ Booking Service: MongoDB connection error:', err));

// Routes
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/team-bookings', require('./routes/teamBooking'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'Booking Service',
    status: 'running',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Booking Service Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong in the booking service!',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Booking Service: Route not found'
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Booking Service running on port ${PORT}`);
  
  // Test email configuration
  console.log('📧 Testing email configuration...');
  const emailReady = await testEmailConfiguration();
  if (emailReady) {
    console.log('✅ Email service is configured and ready');
  } else {
    console.log('⚠️ Email service configuration issue - emails may not be sent');
  }
});

module.exports = app;
