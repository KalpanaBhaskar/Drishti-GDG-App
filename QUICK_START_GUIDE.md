# 🚀 Quick Start Guide - Viewing Your Firebase Data

## ✅ Your Setup Status: COMPLETE!

Your Firebase project **"drishti-database"** is fully configured and ready to use!

---

## 📊 Step-by-Step: View Data in Firebase Console

### **STEP 1: Open Firebase Console**

Click this link to open your Firebase project:
👉 **https://console.firebase.google.com/project/drishti-database**

Or manually:
1. Go to https://console.firebase.google.com/
2. Click on **"drishti-database"** project

---

### **STEP 2: View Firestore Database**

**Direct Link:** https://console.firebase.google.com/project/drishti-database/firestore

Or navigate:
1. In the left sidebar, find **"Build"** section
2. Click **"Firestore Database"**
3. You'll see the main Firestore interface

---

### **STEP 3: Browse Your Collections**

After running `npm run seed-db` or starting your app, you'll see these collections:

#### **📍 View Zones (Bottleneck Analysis)**
1. Click **"zones"** in the left panel
2. You'll see 8 zones with real-time density data
3. Each zone shows:
   - `name` - Zone name (e.g., "Main Stage")
   - `density` - Current crowd density (0-100)
   - `predictedDensity` - Forecast density
   - `status` - normal/congested/bottleneck
   - `updatedAt` - Last update timestamp

**To See Live Updates:**
- Keep this tab open
- Run your app: `npm run dev`
- Watch the density values change every 5 seconds! 🔴

#### **📢 View Announcements**
1. Click **"announcements"** collection
2. See all admin broadcasts with:
   - `title` - Announcement headline
   - `content` - Message body
   - `priority` - normal or urgent
   - `timestamp` - When it was created
   - `createdAt` / `updatedAt` - Firebase timestamps

**Test It:**
- Log in as admin in your app
- Create a new announcement
- Refresh Firebase Console - it appears instantly! ✨

#### **🚨 View Incidents**
1. Click **"incidents"** collection
2. See all logged incidents with:
   - `type` - medical/security/fire/anomaly
   - `location` - Where it happened
   - `status` - reported/dispatched/resolved
   - `priority` - high/medium/low
   - `description` - Details
   - `timestamp` - Time logged

**Test It:**
- Report an incident in your app
- Check Firebase Console - it's logged immediately!

#### **📹 View Video Metrics**
1. Click **"metrics"** collection
2. See continuous video feed metrics:
   - `timestamp` - When captured
   - `totalPeople` - People count
   - `crowdDensity` - Density percentage
   - `avgMovementSpeed` - Movement rate
   - `anomalyDetections` - Anomalies detected
   - `zoneId` - Which zone

**Live Data:**
- New entries appear every 5 seconds for each zone!
- You'll see this collection grow automatically

#### **📊 View Risk Scores**
1. Click **"riskScores"** collection
2. See risk assessment history:
   - `score` - Risk score (0-100)
   - `level` - LOW/MODERATE/HIGH/CRITICAL
   - `factors` - Array of contributing factors
   - `timestamp` - When calculated

#### **⚙️ View Event Configuration**
1. Click **"config"** collection
2. Click **"event-config"** document
3. See:
   - `attendeeCount` - Total attendees
   - `emergencyContactPhone` - Emergency number
   - `locationName` - First aid location
   - `latitude` / `longitude` - GPS coordinates

---

### **STEP 4: View Authentication Logs**

**Direct Link:** https://console.firebase.google.com/project/drishti-database/authentication/users

Or navigate:
1. In the left sidebar, click **"Authentication"**
2. Click the **"Users"** tab at the top
3. You'll see a table of all admin users

**What You'll See:**
```
┌─────────────────────┬──────────────┬─────────────┬──────────────┐
│ Email               │ Providers    │ Created     │ Last Sign-In │
├─────────────────────┼──────────────┼─────────────┼──────────────┤
│ admin@drishti.com   │ Email/Pass   │ Dec 28, 2025│ 5 mins ago   │
└─────────────────────┴──────────────┴─────────────┴──────────────┘
```

**Test Authentication:**
1. Start your app: `npm run dev`
2. Click "Admin Login"
3. Sign up with: `test@drishti.com` / `password123`
4. Check Firebase Console → Authentication
5. Your new user appears immediately! 🎉

**Note:** Passwords are encrypted and NOT visible (security feature)

---

## 🧪 Complete Testing Workflow

### **Test 1: Initialize Sample Data**

```bash
npm run seed-db
```

This will populate:
- ✅ 8 zones with crowd data
- ✅ 3 sample incidents
- ✅ 3 sample announcements
- ✅ 8 video metrics entries
- ✅ 1 risk score
- ✅ 1 event configuration

Then check Firebase Console to see all the data!

### **Test 2: Start the App**

```bash
npm run dev
```

Open http://localhost:5173

### **Test 3: Test Public View**
1. Click **"Access Public Dashboard"**
2. View zones, incidents, announcements
3. Check Firebase Console - same data visible!

### **Test 4: Test Admin Authentication**
1. Click **"Admin Login"**
2. Click **"Sign Up"** 
3. Enter: `admin@drishti.com` / `password123`
4. Click **"Create Admin Account"**
5. Go to Firebase Console → Authentication → Users
6. **You should see your new admin user!** ✅

### **Test 5: Create an Announcement**
1. Log in as admin
2. Click **"Announcements"** tab
3. Fill in:
   - Title: "Test Announcement"
   - Content: "This is a test message"
   - Priority: Urgent
4. Click **"Send Broadcast"**
5. Go to Firebase Console → Firestore → announcements
6. **Your announcement appears immediately!** ✅

### **Test 6: Log an Incident**
1. Still logged in as admin
2. Click **"Incidents"** tab
3. Fill in:
   - Type: Medical
   - Location: Main Stage
   - Priority: High
   - Description: "Test incident for verification"
4. Click **"Report to Agent"**
5. Go to Firebase Console → Firestore → incidents
6. **Your incident is logged!** ✅

### **Test 7: Watch Live Zone Updates**
1. Keep app running
2. Open Firebase Console → Firestore → zones
3. Click on any zone document (e.g., zone-main-stage)
4. Watch the `density` field
5. **It updates every 5 seconds automatically!** 🔴 LIVE

### **Test 8: View Metrics Streaming**
1. Keep app running
2. Go to Firebase Console → Firestore → metrics
3. Watch the document count
4. **New metrics appear every 5 seconds!** 📹

---

## 🎯 Quick Reference Links

### Your Firebase Project URLs:

| Resource | Direct Link |
|----------|-------------|
| **Main Console** | https://console.firebase.google.com/project/drishti-database |
| **Firestore Database** | https://console.firebase.google.com/project/drishti-database/firestore |
| **Authentication** | https://console.firebase.google.com/project/drishti-database/authentication/users |
| **Usage Statistics** | https://console.firebase.google.com/project/drishti-database/usage |
| **Project Settings** | https://console.firebase.google.com/project/drishti-database/settings/general |

---

## 📱 Real-Time Monitoring Setup

### **Best Way to Monitor Live Data:**

1. **Two Browser Windows:**
   - Window 1: Your Drishti app (http://localhost:5173)
   - Window 2: Firebase Console (Firestore Database)

2. **What to Watch:**
   - **zones** - Density updates every 5 seconds
   - **metrics** - New documents every 5 seconds
   - **incidents** - Updates when you create/modify
   - **announcements** - Updates when you broadcast

3. **Pro Tip:**
   - Use dual monitors or split screen
   - Keep Firebase Console on the right
   - Keep your app on the left
   - Watch data flow in real-time! 🎥

---

## 🔍 How to Find Specific Data

### **Filter by Priority:**
1. Click on **"incidents"** or **"announcements"**
2. Click the **filter icon** (funnel) at the top
3. Add filter: `priority == "high"`
4. Click **Apply**

### **Sort by Date:**
1. Click on any collection
2. In the top-right, click **sort icon**
3. Select **"Order by createdAt descending"**
4. Newest items appear first!

### **Search by Field:**
1. Click on a collection
2. Use the search bar at the top
3. Enter field name and value
4. Results filter instantly

---

## 🎨 Understanding the Firebase UI

```
Firebase Console Layout:

┌─────────────────────────────────────────────────────┐
│  Firebase  [drishti-database ▼]                     │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│  Build       │  📊 Data View                        │
│  ├─Firestore │  Collections:     Documents:         │
│  ├─Auth      │  announcements →  [ANN-123...]       │
│  ├─Storage   │  config        →  [event-config]     │
│              │  incidents     →  [INC-456...]       │
│  Engage      │  metrics       →  [auto-id...]       │
│  Analytics   │  riskScores    →  [auto-id...]       │
│  Release     │  zones         →  [zone-main...]     │
│              │                                       │
└──────────────┴──────────────────────────────────────┘
```

---

## ✨ What Happens Automatically

### When You Start the App:
1. ✅ Connects to Firebase automatically
2. ✅ Initializes zones if empty
3. ✅ Starts updating zones every 5 seconds
4. ✅ Begins streaming video metrics
5. ✅ Listens for real-time updates

### When You Create Data:
1. ✅ Saves to Firestore instantly
2. ✅ Adds timestamps automatically
3. ✅ Syncs to all connected clients
4. ✅ Visible in Firebase Console immediately
5. ✅ Triggers real-time listeners

---

## 🚨 Troubleshooting

### "I don't see any collections"
**Solution:** Run `npm run seed-db` or start your app first

### "Collections are empty"
**Solution:** Run `npm run seed-db` to populate sample data

### "Can't see new data"
**Solution:** 
- Press F5 to refresh Firebase Console
- Or close and reopen the collection

### "Permission denied error"
**Solution:**
1. Go to Firestore → Rules
2. Make sure you're in test mode:
```javascript
allow read, write: if true;  // TEST MODE
```

---

## 📊 Expected Data After Seeding

After running `npm run seed-db`, you should see:

| Collection | Documents | What to Check |
|------------|-----------|---------------|
| **zones** | 8 docs | All zones listed with density data |
| **incidents** | 3 docs | Sample incidents with different statuses |
| **announcements** | 3 docs | Sample announcements (1 urgent, 2 normal) |
| **metrics** | 8 docs | One metric per zone |
| **riskScores** | 1 doc | Sample risk score calculation |
| **config** | 1 doc | Event configuration settings |

---

## 🎉 Success Checklist

- ✅ Firebase project accessible
- ✅ Firestore Database visible
- ✅ Can see collections
- ✅ Sample data populated
- ✅ App connects successfully
- ✅ Authentication works
- ✅ Can create announcements
- ✅ Can log incidents
- ✅ Live updates visible
- ✅ Metrics streaming

**If all checked - You're ready to use Drishti! 🚀**

---

## 💡 Pro Tips

1. **Bookmark your Firestore URL** for quick access
2. **Keep Console open** while developing
3. **Use Chrome** for best Firebase Console experience
4. **Enable notifications** to see real-time updates
5. **Check Usage tab** to monitor your quota
6. **Export data** regularly for backup

---

## 📞 Need Help?

If something isn't working:
1. Check `FIRESTORE_VIEWING_GUIDE.md` for detailed instructions
2. Run `npm run check-firebase` to verify setup
3. Check browser console for error messages
4. Verify you're logged into the correct Google account
5. Ensure Firestore is in test mode

---

**🎯 Ready to Go!**

Your Firebase integration is complete and working. Start your app and watch the data flow in real-time!

```bash
npm run dev
```

Then visit: https://console.firebase.google.com/project/drishti-database/firestore

**Happy monitoring! 🛡️**
