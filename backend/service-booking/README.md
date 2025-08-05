# Booking Service

A microservice for managing court bookings with calendar functionality.

## Features

- **Booking Management**: Create, view, update, and cancel bookings
- **Calendar System**: Visual calendar for each court with availability
- **Working Hours**: Configurable working hours for each court
- **Pricing System**: Flexible pricing with peak hours and special dates
- **Company Integration**: Links with company and court services
- **User Authentication**: Secure booking management

## API Endpoints

### Bookings

- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/status` - Update booking status
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/bookings/company/:companyId` - Get company bookings

### Calendar

- `GET /api/calendar/:courtId` - Get court calendar
- `GET /api/calendar/:courtId/available-slots` - Get available time slots
- `POST /api/calendar/:courtId/config` - Configure court calendar
- `GET /api/calendar/:courtId/config` - Get calendar configuration
- `GET /api/calendar/company/:companyId/bookings` - Company calendar view

## Installation

```bash
npm install
```

## Environment Variables

```env
PORT=5005
MONGODB_URI=mongodb://localhost:27017/booking_db
JWT_SECRET=your-secret-key
AUTH_SERVICE_URL=http://localhost:5001
COMPANY_SERVICE_URL=http://localhost:5002
COURT_SERVICE_URL=http://localhost:5003
```

## Usage

```bash
# Development
npm run dev

# Production
npm start
```

## Models

### Booking
- Court and company references
- Date and time slots
- User details and team information
- Payment and pricing information
- Status tracking

### CalendarConfig
- Working hours configuration
- Pricing rules and peak hours
- Booking policies and restrictions
- Blocked dates management

## Integration

This service integrates with:
- **Auth Service** (port 5001) - User authentication
- **Company Service** (port 5002) - Company management
- **Court Service** (port 5003) - Court information
