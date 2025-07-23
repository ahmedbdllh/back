# Sportify Company Service

This microservice handles company/business management for the Sportify platform. It manages companies that own sports facilities and provides APIs for company CRUD operations, verification, and statistics.

## Features

- **Company Management**: Create, read, update, and delete companies
- **Owner Relationship**: Foreign key relationship with Users (Manager/Admin roles only)
- **Verification System**: Admin approval workflow for companies
- **Business Information**: Comprehensive company profiles with address, contact, and business details
- **Statistics Tracking**: Company performance metrics (facilities, bookings, ratings)
- **Inter-service Communication**: Validates users with Auth service

## API Endpoints

### Public Endpoints
- `GET /api/companies` - Get all companies (with filters)
- `GET /api/companies/verified` - Get verified companies
- `GET /api/companies/:id` - Get company by ID

### Authenticated Endpoints
- `POST /api/companies` - Create new company (Manager/Admin only)
- `GET /api/companies/owner/:ownerId` - Get companies by owner
- `PUT /api/companies/:id` - Update company (Owner or Admin only)
- `DELETE /api/companies/:id` - Delete company (Owner or Admin only)

### Admin Only Endpoints
- `PATCH /api/companies/:id/verify` - Verify company
- `PATCH /api/companies/:id/suspend` - Suspend company

### Internal Service Endpoints
- `PATCH /api/companies/:id/stats` - Update company statistics

## Company Model Schema

```javascript
{
  companyName: String (required),
  ownerId: ObjectId (required, references User),
  ownerRole: String (enum: ['Manager', 'Admin']),
  description: String,
  industry: String,
  email: String (required),
  phone: String (required),
  address: {
    street: String (required),
    city: String (required),
    state: String (required),
    zipCode: String (required),
    country: String (default: 'Tunisia')
  },
  registrationNumber: String (unique),
  taxId: String (unique),
  status: String (enum: ['Active', 'Inactive', 'Suspended', 'Pending']),
  isVerified: Boolean (default: false),
  logo: String,
  images: [String],
  socialMedia: {
    website: String,
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String
  },
  businessHours: {
    monday: { open: String, close: String, closed: Boolean },
    // ... other days
  },
  totalFacilities: Number (default: 0),
  totalBookings: Number (default: 0),
  rating: Number (0-5),
  totalReviews: Number (default: 0),
  subscriptionPlan: String (enum: ['Basic', 'Premium', 'Enterprise'])
}
```

## Setup and Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file with:
   ```
   PORT=3002
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/sportify_companies
   AUTH_SERVICE_URL=http://localhost:3001
   JWT_SECRET=your_jwt_secret_here
   ```

3. **Run the Service**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Inter-Service Communication

The Company service communicates with the Auth service to:
- Validate JWT tokens
- Verify user existence and roles
- Ensure only Managers and Admins can own companies

### Authentication Flow
1. Client sends request with JWT token
2. Company service validates token with Auth service
3. Auth service returns user information
4. Company service authorizes the request based on user role

## Database Relationships

### Company → User (Owner)
- `ownerId` field references User._id from Auth service
- Only users with role 'Manager' or 'Admin' can own companies
- One user can own multiple companies
- Foreign key constraint enforced at application level

## Security Features

- **Role-based Access Control**: Different permissions for Players, Managers, and Admins
- **Ownership Validation**: Users can only modify their own companies (unless Admin)
- **Token Validation**: All protected routes validate JWT tokens with Auth service
- **Input Validation**: Comprehensive validation for all endpoints

## Error Handling

The service provides consistent error responses:
```javascript
{
  "message": "Error description",
  "code": "ERROR_CODE", // Optional
  "details": {} // Optional additional details
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Health Check

Check service health at: `GET /health`

Response:
```javascript
{
  "status": "OK",
  "service": "Company Service",
  "timestamp": "2025-06-04T12:00:00.000Z"
}
```

## Future Enhancements

- **Image Upload**: Company logo and gallery management
- **Payment Integration**: Subscription management
- **Analytics**: Advanced company performance metrics
- **Notifications**: Company status change notifications
- **Search**: Advanced search and filtering capabilities