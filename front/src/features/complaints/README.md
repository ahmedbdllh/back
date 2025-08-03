# Complaint Management System

A comprehensive complaint management system for the sports booking platform, enabling users to report issues and administrators to manage them effectively.

## 🎯 Overview

The complaint system provides:
- **Role-based access** for Players, Managers, and Admins
- **Multi-category complaints** (court, booking, payment, staff, etc.)
- **Real-time status tracking** (open, in-progress, resolved, closed)
- **Priority management** (low, medium, high, urgent)
- **Two-way communication** via comments and responses
- **Integration points** throughout the platform

## 📁 File Structure

```
src/features/complaints/
├── components/
│   ├── ComplaintCard.js              # Individual complaint display
│   ├── ComplaintFormModal.js         # Complaint submission form
│   ├── ComplaintDetailsModal.js      # Detailed view with responses
│   ├── ComplaintFlagButton.js        # Flag button for reporting issues
│   └── EnhancedCourtCard.js          # Example integration with court cards
├── pages/
│   ├── MyComplaintsPage.js           # Player complaint dashboard
│   ├── ManagerComplaintsPage.js      # Manager complaint dashboard
│   └── ComplaintSystemDemo.js        # Interactive system demo
├── hooks/
│   └── useComplaints.js              # Complaint service hooks
└── index.js                          # Export barrel
```

## 🚀 Quick Start

### 1. Backend Setup
The complaint service should already be running on port 5002:
```bash
cd backend/service-complaint
npm start
```

### 2. Import Components
```javascript
import { 
  ComplaintFlagButton, 
  MyComplaintsPage,
  useComplaints 
} from '../features/complaints';
```

### 3. Basic Usage

#### Flag Button Integration
```javascript
// Add to any component where users might need to report issues
<ComplaintFlagButton
  relatedTo={{
    type: 'court',
    referenceId: court._id,
    referenceName: court.name
  }}
  variant="icon" // 'icon', 'button', 'text'
  size="sm"      // 'sm', 'md', 'lg'
/>
```

#### Using the Hook
```javascript
const { 
  complaints, 
  loading, 
  error, 
  createComplaint, 
  fetchComplaints 
} = useComplaints();
```

## 🔗 Routes & Navigation

### Player Routes
- `/my-complaints` - View and track submitted complaints
- Access via: User dropdown → "My Complaints"

### Manager Routes  
- `/manager/complaints` - Manage facility-related complaints
- Access via: User dropdown → "Complaints"

### Admin Routes
- `/dashboard/complaint-management` - Full system administration
- Access via: Dashboard sidebar → "Complaint Management"

### Demo Route
- `/complaint-demo` - Interactive system demonstration

## 🎨 UI Components

### ComplaintFlagButton
Integrates reporting functionality anywhere in the app.

**Props:**
- `relatedTo` - Object linking complaint to specific item
- `variant` - Button style: 'icon', 'button', 'text'
- `size` - Button size: 'sm', 'md', 'lg'
- `className` - Additional CSS classes

**Example:**
```javascript
<ComplaintFlagButton
  relatedTo={{
    type: 'booking',
    referenceId: booking._id,
    referenceName: `Booking on ${date}`
  }}
  variant="button"
  size="md"
/>
```

### ComplaintFormModal
Modal for submitting new complaints.

**Props:**
- `isOpen` - Modal visibility
- `onClose` - Close handler
- `onSuccess` - Success callback
- `relatedTo` - Pre-populate related item
- `prefilledCategory` - Pre-select category

### ComplaintCard
Displays complaint summary with actions.

**Props:**
- `complaint` - Complaint object
- `onView` - View details handler
- `showSubmittedBy` - Show submitter info (for managers/admins)
- `showActions` - Show action buttons

## 🔧 Integration Examples

### Court Listing Integration
```javascript
// In court cards
<div className="court-card">
  {/* Court info */}
  <div className="absolute top-2 right-2">
    <ComplaintFlagButton
      relatedTo={{
        type: 'court',
        referenceId: court._id,
        referenceName: court.name
      }}
      variant="icon"
    />
  </div>
</div>
```

### Booking History Integration
```javascript
// In booking cards
<div className="booking-card">
  {/* Booking info */}
  <ComplaintFlagButton
    relatedTo={{
      type: 'booking',
      referenceId: booking._id,
      referenceName: `${court.name} - ${date}`
    }}
    variant="text"
    className="w-full mt-2"
  />
</div>
```

### Team Dashboard Integration
```javascript
// In team management
<ComplaintFlagButton
  relatedTo={{
    type: 'team',
    referenceId: team._id,
    referenceName: team.name
  }}
  variant="button"
/>
```

## 📊 Data Flow

### Complaint Lifecycle
1. **Submission** - User submits complaint via flag button or form
2. **Routing** - Auto-assigned based on category and user role
3. **Response** - Manager/Admin responds with comments or status updates
4. **Resolution** - Status updated to resolved/closed with resolution notes
5. **Feedback** - Optional user satisfaction rating

### Status Flow
```
Open → In Progress → Resolved → Closed
  ↓        ↓           ↓
Comment  Response   Resolution
```

## 🔑 Key Features

### Role-Based Access Control
- **Players**: Submit complaints, view own complaints, add comments
- **Managers**: Handle facility-related complaints, respond to issues  
- **Admins**: Full system access, advanced response tools

### Category Management
- Court Issues
- Booking Problems  
- Payment Issues
- Staff Behavior
- Facility Problems
- Team Issues
- Technical Problems
- Other

### Priority Levels
- **Low**: Minor issues, non-urgent
- **Medium**: Standard priority (default)
- **High**: Important issues requiring attention
- **Urgent**: Critical issues requiring immediate response

### Smart Routing
- Court complaints → Managing company
- Booking complaints → Both manager and admin
- Team complaints → Admin only
- Technical complaints → Admin only

## 🎯 Best Practices

### Performance
- Use pagination for large complaint lists
- Implement real-time updates via WebSocket (future enhancement)
- Cache frequently accessed data

### User Experience
- Provide clear feedback on submission
- Show progress indicators for loading states
- Use appropriate icons and colors for status

### Integration
- Place flag buttons contextually where issues might occur
- Pre-populate form data when possible
- Maintain consistent styling with existing UI

## 🚀 Future Enhancements

### Planned Features
- **Email Notifications** - Automatic alerts for status changes
- **File Attachments** - Allow users to upload images/documents
- **SLA Tracking** - Monitor response and resolution times
- **Analytics Dashboard** - Complaint trends and metrics
- **Mobile App Integration** - Native mobile complaint features
- **Satisfaction Surveys** - Post-resolution feedback collection

### Technical Improvements
- **Real-time Updates** - WebSocket implementation
- **Advanced Search** - Full-text search capabilities
- **Bulk Operations** - Batch status updates for admins
- **API Rate Limiting** - Prevent complaint spam
- **Data Export** - CSV/Excel export for reporting

## 🛠️ Troubleshooting

### Common Issues

**Complaint service not running:**
```bash
cd backend/service-complaint
npm install
npm start
```

**Components not found:**
```javascript
// Ensure proper import path
import { ComplaintFlagButton } from '../features/complaints';
```

**Authentication errors:**
```javascript
// Check token in localStorage
const token = localStorage.getItem('token');
```

### Development Tips
- Use `/complaint-demo` route to test functionality
- Check browser console for API errors
- Verify backend service is running on port 5002
- Ensure user authentication is working

## 📈 Performance Metrics

The system is designed to handle:
- **Concurrent Users**: 100+ simultaneous users
- **Response Time**: < 2 seconds for complaint operations
- **Data Volume**: 10,000+ complaints with efficient querying
- **Availability**: 99.9% uptime with proper error handling

---

## 🤝 Contributing

When adding new features:
1. Follow the existing component structure
2. Add proper TypeScript types (when migrating)
3. Include error handling and loading states
4. Write comprehensive tests
5. Update documentation

For questions or issues, check the complaint demo at `/complaint-demo` for working examples!
