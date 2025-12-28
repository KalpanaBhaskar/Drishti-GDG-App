# Firebase Integration Documentation - Drishti

## Overview

Drishti now includes complete Firebase integration for authentication and real-time database functionality. This document explains what has been implemented and how to use it.

## ✅ What Has Been Implemented

### 1. **Firebase Authentication**
- ✅ Email/Password signup for admin users
- ✅ Email/Password login for admin users
- ✅ Secure logout functionality
- ✅ Authentication state persistence
- ✅ Beautiful authentication modal UI

### 2. **Firebase Firestore Database**
Complete real-time database integration for:

#### **Admin Login/Signup Data**
- Stores admin credentials securely using Firebase Authentication
- Email and password only (as requested)
- Automatic session management

#### **Video Metrics Storage**
- Automatically saves metrics from live video input every 5 seconds
- Stores: total people count, crowd density, movement speed, anomaly detections
- Zone-specific metrics tracking
- Historical data for analysis

#### **Admin Announcements Portal**
- Create, store, and broadcast announcements
- Priority levels (normal/urgent)
- Real-time sync across all connected devices
- Timestamp tracking

#### **Incident Logging**
- Log incidents with type, location, priority, and description
- Status tracking: reported → dispatched → resolved
- Update incident status in real-time
- Complete incident history

#### **Risk Score and Parameters**
- Automatic risk score calculation and storage
- Saves risk factors and analysis
- Historical risk tracking over time
- Triggered whenever risk score changes

#### **Bottleneck Analysis Data**
- Stores zone density data for graphical visualization
- Predicted density forecasting
- Zone status tracking (normal/congested/bottleneck)
- Real-time updates reflected in the UI

#### **Event Configuration**
- Attendee count tracking
- Emergency contact information
- Location coordinates for emergency services
- Persistent configuration across sessions

### 3. **Real-Time Synchronization**
- ✅ Live zone density updates
- ✅ Real-time incident notifications
- ✅ Instant announcement broadcasts
- ✅ Configuration sync across admin sessions
- ✅ Automatic data refresh without page reload

## 📁 New Files Created

### Services Layer
1. **`services/firebaseConfig.ts`**
   - Firebase app initialization
   - Auth and Firestore setup
   - Environment variable configuration

2. **`services/authService.ts`**
   - Admin signup function
   - Admin login function
   - Logout function
   - Authentication state listener
   - Current user getter

3. **`services/firestoreService.ts`**
   - Zone CRUD operations
   - Incident management
   - Announcement handling
   - Video metrics storage
   - Risk score tracking
   - Event configuration
   - Real-time listeners for all collections

### UI Components
4. **`components/AuthModal.tsx`**
   - Professional authentication modal
   - Sign up / Sign in toggle
   - Email and password validation
   - Error handling and loading states
   - Integrated with Drishti design system

### Documentation
5. **`FIREBASE_SETUP.md`**
   - Complete Firebase setup guide
   - Security rules configuration
   - Troubleshooting tips

6. **`FIREBASE_INTEGRATION.md`** (this file)
   - Integration documentation
   - Usage examples
   - API reference

## 🗄️ Database Schema

### Collections Structure

```
firestore/
├── zones/
│   └── {zoneId}
│       ├── id: string
│       ├── name: string
│       ├── density: number
│       ├── predictedDensity: number
│       ├── status: string
│       └── updatedAt: timestamp
│
├── incidents/
│   └── {incidentId}
│       ├── id: string
│       ├── type: string
│       ├── location: string
│       ├── status: string
│       ├── priority: string
│       ├── timestamp: string
│       ├── description: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── announcements/
│   └── {announcementId}
│       ├── id: string
│       ├── title: string
│       ├── content: string
│       ├── timestamp: string
│       ├── priority: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── metrics/
│   └── {metricId}
│       ├── timestamp: string
│       ├── totalPeople: number
│       ├── crowdDensity: number
│       ├── avgMovementSpeed: number
│       ├── anomalyDetections: number
│       ├── zoneId: string
│       └── createdAt: timestamp
│
├── riskScores/
│   └── {scoreId}
│       ├── score: number
│       ├── level: string
│       ├── factors: array
│       ├── timestamp: string
│       └── createdAt: timestamp
│
└── config/
    └── event-config
        ├── attendeeCount: number
        ├── emergencyContactPhone: string
        ├── locationName: string
        ├── latitude: number
        ├── longitude: number
        └── updatedAt: timestamp
```

## 🎯 Key Features

### Dynamic Data Storage
All data is automatically saved to Firebase:
- Zone updates every 5 seconds
- Video metrics captured continuously
- Risk scores saved on calculation
- Incidents and announcements persist immediately

### Real-Time Reflection in UI
The web app uses Firebase real-time listeners:
- Changes in one browser window appear instantly in others
- No manual refresh needed
- Optimistic UI updates with server sync

### Automatic Initialization
On first run, the app automatically:
- Creates initial zone data
- Sets up default configuration
- Prepares all collections

## 🔐 Security Implementation

### Authentication Flow
1. User clicks "Admin Login"
2. Authentication modal appears
3. User can sign up (new account) or sign in (existing)
4. On success, user gets full admin access
5. Session persists across page reloads
6. Logout clears authentication state

### Data Access Control
- **Public users**: Read-only access to all data
- **Authenticated admins**: Full read/write access
- **Firestore rules**: Can be configured for production

## 📊 Usage Examples

### For Admins

#### Creating an Announcement
```typescript
// In the Announcements tab
1. Fill in title and content
2. Select priority (normal/urgent)
3. Click "Send Broadcast"
4. Announcement appears in real-time for all users
```

#### Logging an Incident
```typescript
// In the Incidents tab
1. Select incident type (medical/security/anomaly)
2. Choose zone location
3. Set priority level
4. Add description
5. Click "Report to Agent"
6. Incident is logged with timestamp
```

#### Updating Incident Status
```typescript
// In the Incidents list
1. Hover over an incident
2. Click dispatch icon (mark as dispatched)
3. Click checkmark icon (mark as resolved)
4. Status updates in real-time
```

#### Saving Event Configuration
```typescript
// In the Configuration tab
1. Update attendee count
2. Modify emergency contact
3. Set location coordinates
4. Click "Save Event Protocol"
5. Configuration syncs across all admin sessions
```

### Automatic Background Operations

#### Zone Density Updates
- Runs every 5 seconds
- Simulates live video input
- Updates all zones simultaneously
- Saves to Firebase automatically

#### Video Metrics Collection
- Captured with each zone update
- Includes people count, density, movement speed
- Tracks anomaly detections
- Stored for historical analysis

#### Risk Score Calculation
- Recalculates when zones or incidents change
- Automatically saves to Firebase
- Includes all risk factors
- Timestamped for trending

## 🔌 API Reference

### Authentication Functions

```typescript
// Sign up new admin
await signUpAdmin(email: string, password: string): Promise<User>

// Sign in existing admin
await signInAdmin(email: string, password: string): Promise<User>

// Sign out current admin
await signOutAdmin(): Promise<void>

// Listen to auth state changes
onAuthStateChange(callback: (user: User | null) => void): Unsubscribe
```

### Firestore Functions

```typescript
// Zones
await saveZone(zone: Zone): Promise<void>
await saveZones(zones: Zone[]): Promise<void>
await getZones(): Promise<Zone[]>
listenToZones(callback: (zones: Zone[]) => void): Unsubscribe

// Incidents
await addIncident(incident: Incident): Promise<string>
await updateIncidentStatus(id: string, status: string): Promise<void>
await getIncidents(): Promise<Incident[]>
listenToIncidents(callback: (incidents: Incident[]) => void): Unsubscribe

// Announcements
await addAnnouncement(announcement: Announcement): Promise<string>
await getAnnouncements(): Promise<Announcement[]>
listenToAnnouncements(callback: (announcements: Announcement[]) => void): Unsubscribe

// Metrics
await saveVideoMetrics(metrics: VideoMetrics): Promise<string>
await getRecentMetrics(limit: number): Promise<VideoMetrics[]>

// Risk Scores
await saveRiskScore(riskData: RiskScoreData): Promise<string>
await getRecentRiskScores(limit: number): Promise<RiskScoreData[]>

// Configuration
await saveEventConfig(config: EventConfig): Promise<void>
await getEventConfig(): Promise<EventConfig | null>
listenToEventConfig(callback: (config: EventConfig | null) => void): Unsubscribe
```

## 🚦 Testing Checklist

- [x] Build compiles without errors
- [ ] Firebase project created
- [ ] Environment variables configured
- [ ] Authentication tested (signup/login/logout)
- [ ] Admin can create announcements
- [ ] Admin can log incidents
- [ ] Admin can update incident status
- [ ] Zone data updates in real-time
- [ ] Risk scores save automatically
- [ ] Configuration persists across sessions
- [ ] Multiple browser windows sync in real-time

## 🎨 UI/UX Features

### Authentication Modal
- Clean, professional design
- Email validation
- Password strength requirements
- Toggle between sign up and sign in
- Error messages for invalid credentials
- Loading states during authentication

### Real-Time Indicators
- Live badges on data feeds
- Pulsing indicators for updates
- Smooth transitions
- Optimistic UI updates

## 🔄 Data Flow

```
User Action → App.tsx → Firebase Service → Firestore
                ↓                            ↓
         Local State Update         Real-time Listener
                ↓                            ↓
            UI Update  ←────────────  Database Sync
```

## 📈 Performance Optimizations

1. **Batch Updates**: Zone data saved in batches
2. **Debounced Saves**: Risk scores only save on change
3. **Optimistic UI**: Instant feedback before server confirm
4. **Efficient Listeners**: Automatic cleanup on unmount
5. **Minimal Re-renders**: Memoized calculations

## 🐛 Known Limitations

1. **Test Mode Security**: Firestore is in test mode - update rules for production
2. **No Email Verification**: Users can sign up without email verification
3. **No Password Reset**: Password reset flow not implemented yet
4. **No Role Management**: All authenticated users have admin access
5. **No User Profiles**: Only email/password stored

## 🚀 Future Enhancements

Potential improvements for production:
- Email verification on signup
- Password reset functionality
- Multi-factor authentication
- Role-based access control (super admin, operator, viewer)
- User profile management
- Audit logs for admin actions
- Data export functionality
- Advanced analytics dashboard
- Push notifications for critical incidents

## 📞 Support

For questions about Firebase integration:
1. Check `FIREBASE_SETUP.md` for setup instructions
2. Review browser console for error messages
3. Verify environment variables are set correctly
4. Ensure Firebase project is properly configured

## ✨ Summary

The Drishti application now has complete Firebase integration including:
- ✅ Secure admin authentication (email/password)
- ✅ Real-time database for all features
- ✅ Automatic video metrics storage
- ✅ Admin announcements portal
- ✅ Incident logging with status tracking
- ✅ Risk score tracking over time
- ✅ Bottleneck analysis data storage
- ✅ Event configuration persistence
- ✅ Real-time synchronization across all devices

The application is ready for testing once Firebase credentials are configured!
