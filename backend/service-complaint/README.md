# Complaint Service

A microservice for handling complaints and support requests in the sports facility booking platform.

## Overview

The Complaint Service provides comprehensive complaint management functionality including:
- Complaint submission and tracking
- Admin complaint management
- Support resources (FAQ, contact info)
- System status monitoring

## Features

### Complaint Management
- **Submit Complaints**: Users can submit detailed complaints with categories and priorities
- **Track Status**: Real-time status tracking from submission to resolution
- **Comment System**: Interactive commenting between users and support staff
- **File Attachments**: Support for attaching files to complaints
- **Satisfaction Ratings**: Post-resolution satisfaction feedback

### Admin Features
- **Complaint Dashboard**: Comprehensive view of all complaints
- **Assignment System**: Assign complaints to specific admin staff
- **Status Management**: Update complaint status and resolutions
- **Statistics**: Detailed analytics and reporting
- **Internal Comments**: Staff-only internal communication

### Support Resources
- **FAQ System**: Categorized frequently asked questions
- **Contact Information**: Multiple contact methods and hours
- **Quick Help**: Anonymous help requests for non-users
- **System Status**: Real-time service health monitoring

## API Endpoints

### Complaints
- `GET /api/complaints` - List complaints (filtered by user role)
- `GET /api/complaints/:id` - Get specific complaint
- `POST /api/complaints` - Submit new complaint
- `PUT /api/complaints/:id/status` - Update complaint status (admin)
- `POST /api/complaints/:id/comments` - Add comment to complaint
- `POST /api/complaints/:id/satisfaction` - Submit satisfaction rating
- `GET /api/complaints/statistics` - Get complaint statistics (admin)

### Support
- `GET /api/support/categories` - Get complaint categories
- `GET /api/support/faq` - Get FAQ items
- `GET /api/support/contact-info` - Get contact information
- `POST /api/support/quick-help` - Submit anonymous help request
- `GET /api/support/system-status` - Get system status

## Data Models

### Complaint Model
```javascript
{
  title: String,
  description: String,
  category: Enum,
  priority: Enum,
  status: Enum,
  submittedBy: {
    userId: ObjectId,
    userName: String,
    userEmail: String,
    userRole: String
  },
  relatedTo: {
    type: String,
    referenceId: ObjectId,
    referenceName: String
  },
  assignedTo: {
    adminId: ObjectId,
    adminName: String,
    assignedAt: Date
  },
  resolution: {
    description: String,
    resolvedBy: Object,
    resolvedAt: Date,
    satisfaction: {
      rating: Number,
      feedback: String
    }
  },
  comments: Array,
  attachments: Array,
  timestamps: true
}
```

## Categories

1. **Booking** - Reservation and scheduling issues
2. **Court** - Facility conditions and equipment
3. **Payment** - Billing and payment processing
4. **Staff** - Service quality and staff behavior
5. **Facility** - General amenities and services
6. **Team** - Team management features
7. **Technical** - Website and app issues
8. **Other** - Miscellaneous issues

## Priority Levels

- **Low** - Minor issues, non-urgent
- **Medium** - Standard issues (default)
- **High** - Important issues affecting service
- **Urgent** - Critical issues requiring immediate attention

## Status Flow

1. **Open** - Newly submitted complaint
2. **In Progress** - Being actively worked on
3. **Resolved** - Issue has been resolved
4. **Closed** - Complaint is finalized

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```env
MONGO_URI=mongodb://localhost:27017/sports-facility
JWT_SECRET=your_jwt_secret
PORT=5002
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email
EMAIL_PASSWORD=your_password
```

3. Start the service:
```bash
npm start
```

## Usage

### Submit a Complaint
```javascript
POST /api/complaints
{
  "title": "Court lighting issue",
  "description": "The lights on court 3 are flickering",
  "category": "court",
  "priority": "medium",
  "relatedTo": {
    "type": "court",
    "referenceId": "court_id_here",
    "referenceName": "Court 3"
  }
}
```

### Admin Update Status
```javascript
PUT /api/complaints/:id/status
{
  "status": "resolved",
  "resolution": {
    "description": "Lighting fixtures have been replaced"
  }
}
```

## Security

- JWT token authentication required for most endpoints
- Role-based access control (admin, manager, player)
- Input validation and sanitization
- Rate limiting on sensitive endpoints

## Monitoring

The service provides health check endpoints and system status monitoring:
- `/health` - Service health check
- `/api/support/system-status` - Overall system status

## Error Handling

Comprehensive error handling with:
- Validation errors for invalid input
- Authentication/authorization errors
- Database connection errors
- Service communication errors
- Detailed error logging

## Integration

This service integrates with:
- **Auth Service** - User authentication and authorization
- **Email Service** - Notification emails
- **Other Services** - Cross-reference complaints with bookings, courts, teams

## Testing

Run tests with:
```bash
npm test
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Submit pull requests for review

## License

ISC License
