const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], 
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/complaint_db';
console.log('🔗 Connecting to MongoDB:', mongoUri);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('📋 Complaint Service: Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ Complaint Service: MongoDB connection error:', error);
  process.exit(1);
});

// Routes
const complaintRoutes = require('./routes/complaints');
const supportRoutes = require('./routes/support');

app.use('/api/complaints', complaintRoutes);
app.use('/api/support', supportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    service: 'complaint-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5002
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Complaint Service API',
    version: '1.0.0',
    endpoints: [
      '/api/complaints',
      '/api/support',
      '/health'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`🚀 Complaint Service running on port ${PORT}`);
  console.log(`📋 Complaint Service: Health check available at http://localhost:${PORT}/health`);
});
