# ✅ Complete Firebase Setup Checklist for Drishti

Use this checklist to ensure everything is set up correctly.

---

## 📋 Pre-Setup Checklist

- [x] Firebase account created
- [x] Firebase project "drishti-database" created
- [x] Environment variables configured in `.env.local`
- [x] Firebase npm package installed
- [ ] Firestore database created
- [ ] Firestore rules configured (IMPORTANT!)
- [ ] Authentication enabled

---

## 🔥 Step 1: Create Firestore Database

### If you haven't created Firestore yet:

1. Go to: https://console.firebase.google.com/project/drishti-database/firestore
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Choose location: **us-central** or closest to you
5. Click **"Enable"**
6. Wait for database creation (1-2 minutes)

### Verify:
- [ ] Firestore Database tab is accessible
- [ ] You see "Start collection" button or empty database

---

## 🔐 Step 2: Configure Firestore Rules (CRITICAL!)

### This is why you're getting the permission error!

1. Go to: https://console.firebase.google.com/project/drishti-database/firestore/rules

2. Click the **"Rules"** tab

3. Replace the rules with this (for testing):

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

4. Click **"Publish"** button (top-right)

5. Wait for "Rules published successfully" message

### Verify:
- [ ] Rules published without errors
- [ ] You see "Last published: just now"

---

## 🔑 Step 3: Enable Email/Password Authentication

1. Go to: https://console.firebase.google.com/project/drishti-database/authentication

2. Click **"Get started"** (if first time)

3. Click **"Sign-in method"** tab

4. Find **"Email/Password"** in the providers list

5. Click on it and toggle **"Enable"**

6. Click **"Save"**

### Verify:
- [ ] Email/Password shows "Enabled" status

---

## 🌱 Step 4: Initialize Database with Sample Data

Now that permissions are fixed, run:

```bash
npm run seed-db
```

### Expected Output:
```
🌱 Starting database seeding...
📍 Seeding zones...
✅ Successfully seeded 8 zones
🚨 Seeding incidents...
✅ Successfully seeded 3 incidents
📢 Seeding announcements...
✅ Successfully seeded 3 announcements
⚙️ Seeding event configuration...
✅ Successfully seeded event configuration
📊 Seeding risk score...
✅ Successfully seeded risk score
📹 Seeding video metrics...
✅ Successfully seeded 8 video metrics

🎉 Database seeding completed successfully!
```

### Verify:
- [ ] No permission errors
- [ ] All collections seeded successfully
- [ ] See success messages for each collection

---

## 🚀 Step 5: Start the Application

```bash
npm run dev
```

### Expected Output:
```
  VITE v6.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Verify:
- [ ] Server starts without errors
- [ ] Can access http://localhost:5173
- [ ] No Firebase connection errors in browser console

---

## 🧪 Step 6: Test the Application

### Test 1: View Seeded Data
1. Open http://localhost:5173
2. Click **"Access Public Dashboard"**
3. You should see:
   - [ ] Zone map with 8 zones
   - [ ] 3 incidents in the incident log
   - [ ] 3 announcements in the feed

### Test 2: Admin Login
1. Click **"Admin Login"** button
2. Click **"Sign Up"** link
3. Enter:
   - Email: `admin@drishti.com`
   - Password: `password123`
4. Click **"Create Admin Account"**
5. You should:
   - [ ] See login success
   - [ ] Be redirected to admin dashboard
   - [ ] See admin features (create announcements, log incidents)

### Test 3: Create Announcement
1. Go to **"Announcements"** tab (as admin)
2. Fill in:
   - Title: "Test Announcement"
   - Content: "Testing Firebase integration"
   - Priority: Normal
3. Click **"Send Broadcast"**
4. You should:
   - [ ] See success message
   - [ ] Announcement appears in the list
   - [ ] No errors in console

### Test 4: Log Incident
1. Go to **"Incidents"** tab (as admin)
2. Fill in:
   - Type: Medical
   - Location: Main Stage
   - Priority: High
   - Description: "Test incident"
3. Click **"Report to Agent"**
4. You should:
   - [ ] See success message
   - [ ] Incident appears in the list
   - [ ] Status shows "reported"

---

## 🔍 Step 7: Verify Data in Firebase Console

### Check Firestore Data:

Go to: https://console.firebase.google.com/project/drishti-database/firestore

Click each collection and verify:

#### **zones** collection:
- [ ] 8 documents visible
- [ ] Each has: name, density, predictedDensity, status
- [ ] updatedAt timestamp exists

#### **incidents** collection:
- [ ] At least 3 documents (initial seed)
- [ ] Your test incident is there
- [ ] Each has: type, location, status, priority, description

#### **announcements** collection:
- [ ] At least 3 documents (initial seed)
- [ ] Your test announcement is there
- [ ] Each has: title, content, priority, timestamp

#### **metrics** collection:
- [ ] Multiple documents (grows over time)
- [ ] Each has: timestamp, totalPeople, crowdDensity, zoneId
- [ ] New entries appear every 5 seconds

#### **riskScores** collection:
- [ ] At least 1 document
- [ ] Has: score, level, factors, timestamp

#### **config** collection:
- [ ] 1 document: "event-config"
- [ ] Has: attendeeCount, emergencyContactPhone, locationName

### Check Authentication:

Go to: https://console.firebase.google.com/project/drishti-database/authentication/users

- [ ] Your admin account (admin@drishti.com) is listed
- [ ] Shows "Email/Password" provider
- [ ] Shows creation date and last sign-in

---

## 🔴 Step 8: Test Real-Time Updates

### Test Live Zone Updates:

1. **Browser Window 1:** Keep your app open (http://localhost:5173)
2. **Browser Window 2:** Open Firebase Console → Firestore → zones
3. Click on any zone (e.g., "zone-main-stage")
4. Watch the fields:
   - [ ] `density` changes every 5 seconds
   - [ ] `updatedAt` timestamp updates
   - [ ] Changes are automatic (no page refresh needed)

### Test Real-Time Sync Between Windows:

1. **Window 1:** Your app (logged in as admin)
2. **Window 2:** Your app in incognito/another browser
3. In Window 1: Create a new announcement
4. Check Window 2:
   - [ ] New announcement appears automatically
   - [ ] No page refresh needed
   - [ ] Updates within 1-2 seconds

---

## 📊 Step 9: Monitor Live Metrics

Keep the app running for 30 seconds and check:

### In Firebase Console → Firestore → metrics:
- [ ] New documents appear every 5 seconds
- [ ] One metric per zone per interval
- [ ] Document count increases continuously

### In Your App Dashboard:
- [ ] Zone colors change based on density
- [ ] Risk score updates periodically
- [ ] Incident status can be changed
- [ ] Everything updates smoothly

---

## ✅ Final Verification Checklist

### Firebase Console:
- [x] Project "drishti-database" exists
- [ ] Firestore database created and accessible
- [ ] Firestore rules set to allow read/write
- [ ] Authentication enabled (Email/Password)
- [ ] At least 1 admin user registered

### Firestore Collections (all populated):
- [ ] zones (8 documents)
- [ ] incidents (3+ documents)
- [ ] announcements (3+ documents)
- [ ] metrics (growing continuously)
- [ ] riskScores (1+ documents)
- [ ] config (1 document)

### Application:
- [ ] App starts without errors
- [ ] Can access public dashboard
- [ ] Admin login/signup works
- [ ] Can create announcements
- [ ] Can log incidents
- [ ] Can update incident status
- [ ] Real-time updates working

### Real-Time Features:
- [ ] Zone density updates every 5 seconds
- [ ] Metrics stream continuously
- [ ] Changes sync across browser windows
- [ ] No page refresh needed for updates

---

## 🎉 Success Criteria

### You're fully set up when:

1. ✅ All collections have data in Firestore
2. ✅ Can log in as admin
3. ✅ Can create announcements and incidents
4. ✅ Data appears in Firebase Console immediately
5. ✅ Zone density updates automatically
6. ✅ No permission errors
7. ✅ Real-time sync works between windows

---

## 🚨 If Something's Not Working

### Getting Permission Errors?
→ See: **FIX_PERMISSIONS.md**

### Can't see data in Firebase Console?
→ Make sure app is running and you've created some data

### Authentication not working?
→ Check Email/Password is enabled in Authentication settings

### Real-time updates not working?
→ Check browser console for WebSocket errors
→ Verify Firestore rules allow read access

### App won't start?
→ Run `npm run check-firebase` to verify configuration
→ Check `.env.local` has all Firebase variables

---

## 📞 Quick Links

- **Your Project:** https://console.firebase.google.com/project/drishti-database
- **Firestore:** https://console.firebase.google.com/project/drishti-database/firestore
- **Rules:** https://console.firebase.google.com/project/drishti-database/firestore/rules
- **Auth:** https://console.firebase.google.com/project/drishti-database/authentication/users

---

## 📚 Documentation References

- **Detailed Viewing Guide:** FIRESTORE_VIEWING_GUIDE.md
- **Quick Start:** QUICK_START_GUIDE.md
- **Fix Permissions:** FIX_PERMISSIONS.md
- **Setup Guide:** FIREBASE_SETUP.md
- **Integration Docs:** FIREBASE_INTEGRATION.md

---

## 🎯 Current Status

Based on the error you received, you need to:

### ⚠️ **PRIORITY: Fix Firestore Rules**

1. Go to: https://console.firebase.google.com/project/drishti-database/firestore/rules
2. Update rules to allow write access (see Step 2 above)
3. Click "Publish"
4. Then run `npm run seed-db` again

**This is the only thing blocking you from a full setup!**

---

**Once you fix the Firestore rules, everything else should work perfectly! 🚀**
