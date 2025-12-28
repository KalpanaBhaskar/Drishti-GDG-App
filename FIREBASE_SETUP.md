# Firebase Setup Guide for Drishti

This guide will help you set up Firebase for the Drishti application to enable authentication and real-time database functionality.

## 🔥 Firebase Setup Steps

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `drishti-safety-platform` (or your preferred name)
4. Follow the setup wizard (you can disable Google Analytics if not needed)
5. Click "Create project"

### 2. Enable Firebase Authentication

1. In the Firebase Console, select your project
2. Go to **Build** → **Authentication**
3. Click "Get started"
4. Select the **Email/Password** sign-in method
5. Enable **Email/Password** (toggle it on)
6. Click "Save"

### 3. Create Firestore Database

1. In the Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Select **Start in test mode** (for development)
   - **Important**: For production, set proper security rules
4. Choose a Cloud Firestore location (select closest to your users)
5. Click "Enable"

### 4. Set Up Firestore Security Rules (Important!)

For development, you can use test mode rules. For production, update the rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all users for public data
    match /zones/{zoneId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /incidents/{incidentId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /announcements/{announcementId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /metrics/{metricId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /riskScores/{scoreId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /config/{configId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 5. Get Firebase Configuration

1. In the Firebase Console, click the **gear icon** (⚙️) next to "Project Overview"
2. Select **Project settings**
3. Scroll down to "Your apps" section
4. Click the **Web icon** (`</>`) to add a web app
5. Register your app with a nickname (e.g., "Drishti Web App")
6. Click "Register app"
7. Copy the Firebase configuration object

### 6. Update Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
```

### 7. Initialize Database with Sample Data (Optional)

The app will automatically initialize with sample data on first run. The following collections will be created:

- `zones` - Zone crowd density data
- `incidents` - Security incident logs
- `announcements` - Admin announcements
- `metrics` - Live video feed metrics
- `riskScores` - Historical risk score data
- `config` - Event configuration

## 🔒 Authentication Flow

### Admin Signup/Login

1. Click "Admin Login" on the home screen
2. Choose "Sign Up" to create a new admin account
3. Enter email and password (min 6 characters)
4. After signup, you can log in with the same credentials

### Data Permissions

- **Public users**: Can read all data (zones, incidents, announcements)
- **Authenticated admins**: Can read and write all data

## 📊 Database Collections

### Zones Collection
Stores real-time crowd density data for each zone.

```typescript
{
  id: string,
  name: string,
  density: number,
  predictedDensity: number,
  status: 'normal' | 'congested' | 'bottleneck',
  updatedAt: timestamp
}
```

### Incidents Collection
Logs security incidents with status tracking.

```typescript
{
  id: string,
  type: 'medical' | 'security' | 'fire' | 'anomaly',
  location: string,
  status: 'reported' | 'dispatched' | 'resolved',
  priority: 'high' | 'medium' | 'low',
  timestamp: string,
  description: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Announcements Collection
Admin announcements broadcast to all users.

```typescript
{
  id: string,
  title: string,
  content: string,
  timestamp: string,
  priority: 'normal' | 'urgent',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Metrics Collection
Video analytics metrics from live feeds.

```typescript
{
  timestamp: string,
  totalPeople: number,
  crowdDensity: number,
  avgMovementSpeed: number,
  anomalyDetections: number,
  zoneId: string,
  createdAt: timestamp
}
```

### Risk Scores Collection
Historical risk assessment data.

```typescript
{
  score: number,
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL',
  factors: array,
  timestamp: string,
  createdAt: timestamp
}
```

### Config Collection
Event configuration settings.

```typescript
{
  attendeeCount: number,
  emergencyContactPhone: string,
  locationName: string,
  latitude: number,
  longitude: number,
  updatedAt: timestamp
}
```

## 🚀 Real-Time Features

The application uses Firebase real-time listeners for:

- **Live zone updates**: Crowd density changes reflect immediately
- **Incident tracking**: New incidents appear in real-time
- **Announcements**: Broadcasts show instantly to all users
- **Configuration sync**: Settings sync across all admin sessions

## 🧪 Testing the Integration

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test Public Access**:
   - Click "Access Public Dashboard"
   - View zones, incidents, and announcements (read-only)

3. **Test Admin Authentication**:
   - Click "Admin Login"
   - Sign up with a new email/password
   - Log in with your credentials
   - Test creating announcements and incidents

4. **Test Real-Time Sync**:
   - Open two browser windows
   - Log in as admin in one window
   - Create an incident or announcement
   - See it appear immediately in the other window

## 🔐 Security Best Practices

### For Production:

1. **Update Firestore Rules**: Replace test mode rules with proper authentication checks
2. **Enable App Check**: Protect against abuse
3. **Set up Firebase Authentication quotas**: Prevent abuse
4. **Use environment variables**: Never commit real credentials to Git
5. **Enable audit logging**: Track admin actions
6. **Implement rate limiting**: Prevent API abuse

### Recommended Production Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // All collections require authentication for writes
    match /{document=**} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
  }
}
```

## 📱 Firebase Console Monitoring

Monitor your application in real-time:

- **Authentication**: View registered users
- **Firestore**: Browse and edit data
- **Usage**: Monitor read/write operations
- **Performance**: Track response times

## ⚠️ Troubleshooting

### "Firebase: Error (auth/operation-not-allowed)"
- Enable Email/Password authentication in Firebase Console

### "Missing or insufficient permissions"
- Check Firestore security rules
- Ensure test mode is enabled for development

### "Firebase: Error (auth/invalid-api-key)"
- Verify environment variables in `.env.local`
- Ensure `VITE_` prefix is present

### Data not syncing in real-time
- Check browser console for errors
- Verify Firestore rules allow read access
- Ensure Firebase initialization is successful

## 📞 Support

For Firebase-specific issues:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Community](https://firebase.google.com/community)

For Drishti application issues:
- Check the main README.md
- Review application logs in browser console
