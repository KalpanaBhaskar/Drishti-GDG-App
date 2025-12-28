# 📊 How to View Firebase Firestore Logs and Data

This guide will show you exactly how to view all your data in the Firebase Console, including login attempts, announcements, metrics, incidents, and more.

## ✅ Your Current Setup Status

Based on your `.env.local` file, your Firebase project is:
- **Project ID**: `drishti-database`
- **Status**: ✅ Fully configured with valid credentials

## 🌐 Step-by-Step: Viewing Data in Firebase Console

### Step 1: Access Firebase Console

1. Open your browser and go to: **https://console.firebase.google.com/**
2. Sign in with your Google account (the one you used to create the Firebase project)
3. You should see your project: **"drishti-database"**
4. Click on the **"drishti-database"** project card

### Step 2: Navigate to Firestore Database

1. In the left sidebar, look for the **"Build"** section
2. Click on **"Firestore Database"**
3. You'll see the Firestore Database interface

### Step 3: Understanding the Firestore Interface

The Firestore interface has three main sections:

```
┌─────────────────────────────────────────────────┐
│  [Data]  [Rules]  [Indexes]  [Usage]            │
├─────────────────────────────────────────────────┤
│                                                  │
│  Collections:              Documents:            │
│  ├─ announcements         │ (Document details)  │
│  ├─ config               │                     │
│  ├─ incidents            │                     │
│  ├─ metrics              │                     │
│  ├─ riskScores           │                     │
│  └─ zones                │                     │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Step 4: Viewing Each Collection

#### 📢 **View Announcements**
1. Click on **"announcements"** collection in the left panel
2. You'll see all announcements with:
   - Document ID (e.g., ANN-1234567890)
   - Fields: `title`, `content`, `priority`, `timestamp`, `createdAt`, `updatedAt`
3. Click any document to see full details

**What you'll see:**
```
announcements/
  └─ ANN-1735392000123
      ├─ title: "Welcome Message"
      ├─ content: "Event started successfully"
      ├─ priority: "normal"
      ├─ timestamp: "14:30"
      ├─ createdAt: December 28, 2025 at 2:30:00 PM
      └─ updatedAt: December 28, 2025 at 2:30:00 PM
```

#### 🚨 **View Incidents**
1. Click on **"incidents"** collection
2. You'll see all logged incidents with:
   - Document ID (e.g., INC-001)
   - Fields: `type`, `location`, `status`, `priority`, `description`, `timestamp`

**What you'll see:**
```
incidents/
  └─ INC-1735392000456
      ├─ type: "medical"
      ├─ location: "Main Stage"
      ├─ status: "reported"
      ├─ priority: "high"
      ├─ description: "Medical emergency reported"
      ├─ timestamp: "14:35"
      ├─ createdAt: December 28, 2025 at 2:35:00 PM
      └─ updatedAt: December 28, 2025 at 2:35:00 PM
```

#### 📍 **View Zones (Bottleneck Analysis Data)**
1. Click on **"zones"** collection
2. You'll see all zone density data updated every 5 seconds:
   - Document ID (zone-main-stage, zone-north-entrance, etc.)
   - Fields: `name`, `density`, `predictedDensity`, `status`, `updatedAt`

**What you'll see:**
```
zones/
  └─ zone-main-stage
      ├─ name: "Main Stage"
      ├─ density: 75.3
      ├─ predictedDensity: 78.5
      ├─ status: "congested"
      └─ updatedAt: December 28, 2025 at 2:35:45 PM (updates every 5 sec)
```

#### 📹 **View Video Metrics**
1. Click on **"metrics"** collection
2. You'll see continuous video feed metrics (new entry every 5 seconds per zone):
   - Document ID (auto-generated)
   - Fields: `timestamp`, `totalPeople`, `crowdDensity`, `avgMovementSpeed`, `anomalyDetections`, `zoneId`

**What you'll see:**
```
metrics/
  └─ [auto-id-12345]
      ├─ timestamp: "2025-12-28T14:35:45.123Z"
      ├─ totalPeople: 7530
      ├─ crowdDensity: 75.3
      ├─ avgMovementSpeed: 1.2
      ├─ anomalyDetections: 0
      ├─ zoneId: "zone-main-stage"
      └─ createdAt: December 28, 2025 at 2:35:45 PM
```

#### 📊 **View Risk Scores**
1. Click on **"riskScores"** collection
2. You'll see risk assessment history:
   - Document ID (auto-generated)
   - Fields: `score`, `level`, `factors`, `timestamp`

**What you'll see:**
```
riskScores/
  └─ [auto-id-67890]
      ├─ score: 68
      ├─ level: "HIGH"
      ├─ factors: [array of risk factors]
      ├─ timestamp: "2025-12-28T14:35:00.000Z"
      └─ createdAt: December 28, 2025 at 2:35:00 PM
```

#### ⚙️ **View Event Configuration**
1. Click on **"config"** collection
2. You'll see one document: **"event-config"**
3. Contains: `attendeeCount`, `emergencyContactPhone`, `locationName`, `latitude`, `longitude`

**What you'll see:**
```
config/
  └─ event-config
      ├─ attendeeCount: 45280
      ├─ emergencyContactPhone: "+91-9876543210"
      ├─ locationName: "Mumbai Central First Aid Hub"
      ├─ latitude: 19.0760
      ├─ longitude: 72.8777
      └─ updatedAt: December 28, 2025 at 2:30:00 PM
```

### Step 5: Viewing Authentication Logs

#### 🔐 **View Admin Login/Signup Data**

1. In the left sidebar, click on **"Authentication"** (under "Build")
2. Click on the **"Users"** tab
3. You'll see all registered admin users with:
   - UID (unique user ID)
   - Email address
   - Created date
   - Last sign-in date
   - Provider (Email/Password)

**What you'll see:**
```
Users Table:
┌──────────────────────┬─────────────────────┬─────────────┬──────────────┐
│ Identifier (Email)   │ Providers           │ Created     │ Signed In    │
├──────────────────────┼─────────────────────┼─────────────┼──────────────┤
│ admin@drishti.com    │ Email/Password      │ Dec 28, 2025│ 1 hour ago   │
│ security@drishti.com │ Email/Password      │ Dec 28, 2025│ 30 mins ago  │
└──────────────────────┴─────────────────────┴─────────────┴──────────────┘
```

**Note:** Passwords are NOT visible (they're hashed and encrypted by Firebase for security)

### Step 6: Real-Time Monitoring

#### 🔴 **Watch Live Updates**

1. Keep the Firestore Database tab open
2. Open your Drishti app in another tab
3. Perform an action (e.g., create an announcement)
4. **Switch back to Firebase Console**
5. You'll see the new data appear instantly! ✨

**Pro Tip:** You don't need to refresh - Firestore Console updates in real-time!

### Step 7: Filtering and Searching

#### 🔍 **Find Specific Data**

1. Click on any collection
2. Use the **filter button** (funnel icon) at the top
3. Add filters like:
   - `priority == "urgent"` (for urgent announcements)
   - `status == "reported"` (for new incidents)
   - `density > 80` (for high-density zones)

#### 📅 **Sort by Date**

1. Click on any collection
2. Click the **three-dot menu** (...) next to a document
3. Select **"Order by createdAt descending"** to see newest first

## 🎯 Quick Testing Checklist

### Test 1: Authentication
- [ ] Start your app: `npm run dev`
- [ ] Click "Admin Login"
- [ ] Sign up with: `test@drishti.com` / `password123`
- [ ] Check Firebase Console → Authentication → Users
- [ ] You should see the new user listed!

### Test 2: Announcements
- [ ] Log in as admin
- [ ] Go to Announcements tab
- [ ] Create a new announcement
- [ ] Check Firebase Console → Firestore → announcements
- [ ] You should see the new document!

### Test 3: Incidents
- [ ] Log in as admin
- [ ] Go to Incidents tab
- [ ] Report a new incident
- [ ] Check Firebase Console → Firestore → incidents
- [ ] You should see the new incident!

### Test 4: Live Metrics
- [ ] Start your app and wait 5 seconds
- [ ] Check Firebase Console → Firestore → metrics
- [ ] Refresh after another 5 seconds
- [ ] You should see new metric entries appearing!

### Test 5: Zone Updates
- [ ] Start your app
- [ ] Check Firebase Console → Firestore → zones
- [ ] Watch the `density` and `updatedAt` fields
- [ ] They should update every 5 seconds automatically!

## 📊 Understanding Data Flow

```
Your App Action
      ↓
Firebase Service Layer
      ↓
Firestore Database (Cloud)
      ↓
Firebase Console (You can view it here!)
      ↓
All Connected Apps (Real-time update)
```

## 🛠️ Advanced Viewing Options

### View Document History
Unfortunately, Firestore doesn't have built-in version history. But you can:
1. Check `createdAt` and `updatedAt` timestamps
2. Look at the `riskScores` and `metrics` collections for historical data

### Export Data
1. Go to Firestore Database
2. Click on a collection
3. Click the **three-dot menu** (...)
4. Select **"Export collection"**
5. Data will be exported to Cloud Storage

### View Usage Statistics
1. Go to Firestore Database
2. Click the **"Usage"** tab
3. See:
   - Document reads/writes
   - Storage usage
   - Network bandwidth

## 🚨 Troubleshooting

### "No collections visible"
**Solution:** 
- Run the app first to create collections
- Or run: `npm run seed-db` to initialize sample data

### "Permission denied"
**Solution:**
- Your Firestore is probably not in test mode
- Go to: Firestore → Rules
- Temporarily use test mode rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // TEST MODE ONLY
    }
  }
}
```
- Click **Publish**

### "Can't see recent updates"
**Solution:**
- Firebase Console auto-refreshes, but sometimes you need to:
- Press F5 to refresh the page
- Or close and reopen the collection

## 📱 Mobile Viewing

You can also view Firebase data on mobile:
1. Install **Firebase Console** app (iOS/Android)
2. Sign in with your Google account
3. Select "drishti-database" project
4. Navigate to Firestore Database
5. View all collections on the go!

## 🎓 Pro Tips

1. **Keep Console Open:** Have Firebase Console open in one tab and your app in another
2. **Use Multiple Windows:** View different collections simultaneously
3. **Learn Firestore Queries:** Use the filter feature to find specific data
4. **Check Timestamps:** All documents have `createdAt` and `updatedAt` for tracking
5. **Monitor Usage:** Keep an eye on the Usage tab to avoid quota limits

## 📞 Quick Links

- **Your Firebase Console:** https://console.firebase.google.com/project/drishti-database
- **Firestore Database:** https://console.firebase.google.com/project/drishti-database/firestore
- **Authentication:** https://console.firebase.google.com/project/drishti-database/authentication/users
- **Usage Stats:** https://console.firebase.google.com/project/drishti-database/usage

## ✨ Summary

To view your data:
1. Go to: https://console.firebase.google.com/
2. Select: **drishti-database** project
3. Click: **Firestore Database** in sidebar
4. Browse collections: **announcements**, **incidents**, **zones**, **metrics**, **riskScores**, **config**
5. For auth logs: Click **Authentication** → **Users** tab

**Everything is stored in real-time and visible immediately in the Firebase Console!** 🎉
