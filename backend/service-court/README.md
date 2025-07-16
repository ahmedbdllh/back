# service-court

Microservice for managing courts in the Sportify project.

## Features
- CRUD operations for courts
- Courts are assigned to companies by `companyId`
- Built with Node.js, Express, and Mongoose

## Setup
1. Install dependencies:
   ```
npm install
   ```
2. Create a `.env` file (see example in repo).
3. Start the service:
   ```
npm start
   ```

## API Endpoints
- `POST   /api/courts/` — Create a new court
- `GET    /api/courts/` — Get all courts
- `GET    /api/courts/company/:companyId` — Get courts by companyId
- `GET    /api/courts/:id` — Get a court by ID
- `PUT    /api/courts/:id` — Update a court
- `DELETE /api/courts/:id` — Delete a court

## Environment Variables
- `PORT` — Port to run the service (default: 5003)
- `MONGODB_URI` — MongoDB connection string
