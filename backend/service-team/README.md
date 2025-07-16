# Team Management Service (service-team)

A microservice for managing teams in the Sportify platform, running on port 5003.

## Features

### Team Management
- ✅ Create, read, update, and delete teams
- ✅ Team logo upload and management
- ✅ Public/private team visibility
- ✅ Team statistics and achievements tracking

### Membership Management
- ✅ Join request system
- ✅ Approve/reject join requests
- ✅ Member role management (captain, member, moderator)
- ✅ Remove members from teams
- ✅ Update member roles and permissions

### Integration
- ✅ JWT-based authentication
- ✅ Integration with auth service for user data
- ✅ Bulk user data fetching (including profile images)
- ✅ Cross-service communication

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Team Operations
- `GET /api/teams` - Get all teams (with filtering)
- `POST /api/teams` - Create a new team
- `GET /api/teams/:id` - Get team by ID
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Membership Operations
- `POST /api/teams/:id/join` - Request to join team
- `POST /api/teams/:id/join-requests/:requestId/approve` - Approve join request
- `POST /api/teams/:id/join-requests/:requestId/reject` - Reject join request
- `DELETE /api/teams/:id/members/:userId` - Remove member
- `PUT /api/teams/:id/members/:userId` - Update member role
- `GET /api/teams/user/:userId` - Get user's teams

## Installation

1. Navigate to the service directory:
```bash
cd backend/service-team
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the service:
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 5003 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/sportify_teams |
| `JWT_SECRET` | JWT secret key | - |
| `AUTH_SERVICE_URL` | Auth service URL | http://localhost:5001 |
| `NODE_ENV` | Environment | development |

## Dependencies

### Core Dependencies
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment configuration
- `multer` - File upload handling
- `axios` - HTTP client for service communication
- `jsonwebtoken` - JWT authentication

### Development Dependencies
- `nodemon` - Development server with auto-reload

## Team Model Schema

```javascript
{
  name: String,           // Team name
  sport: String,          // Sport type
  description: String,    // Team description
  logo: String,           // Logo file path
  captain: ObjectId,      // Captain user ID
  members: [{             // Team members
    user: ObjectId,
    role: String,
    joinedAt: Date,
    permissions: [String]
  }],
  isPublic: Boolean,      // Public/private visibility
  maxMembers: Number,     // Maximum team size
  joinRequests: [{        // Pending join requests
    user: ObjectId,
    message: String,
    requestedAt: Date
  }],
  achievements: [String], // Team achievements
  statistics: Object,     // Team stats
  settings: Object,       // Team settings
  location: {             // Team location
    city: String,
    country: String,
    coordinates: [Number]
  }
}
```

## Authentication

The service uses JWT-based authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## File Uploads

Team logos can be uploaded using multipart/form-data:

```javascript
const formData = new FormData();
formData.append('name', 'Team Name');
formData.append('sport', 'Football');
formData.append('logo', file);

fetch('/api/teams', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

## Error Handling

The service returns standardized error responses:

```javascript
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## Integration with Other Services

### Auth Service Integration
- Fetches user data including profile images
- Validates JWT tokens
- Bulk user data retrieval for team member information

### Example User Data Integration
```javascript
// Team members with user data
{
  "members": [
    {
      "user": "user_id",
      "role": "captain",
      "userData": {
        "username": "john_doe",
        "email": "john@example.com",
        "profileImage": "http://localhost:5001/uploads/profiles/john.jpg"
      }
    }
  ]
}
```

## Development

### Running Tests
```bash
npm test
```

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm start
```

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include JSDoc comments for new functions
4. Test all endpoints before submitting
5. Update this README for new features

## Service Architecture

```
service-team/
├── index.js              # Main server file
├── package.json          # Dependencies
├── .env                  # Environment config
├── models/
│   └── Team.js           # Team data model
├── controllers/
│   └── teamController.js # Business logic
├── routes/
│   └── team.js           # API routes
├── middleware/
│   └── auth.js           # Authentication
└── uploads/
    └── teams/            # Team logo storage
```

## Monitoring

- Health check endpoint: `GET /health`
- Database connection status included in health check
- Error logging to console (configure external logging as needed)

## Security

- JWT token validation
- File upload validation (type, size)
- Input sanitization
- CORS configuration
- Rate limiting (add as needed)

---

**Service Status**: ✅ Ready for development and testing
**Port**: 5003
**Database**: MongoDB (sportify_teams)
**Auth**: JWT-based
