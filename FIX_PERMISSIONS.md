# 🔧 Fix Firestore Permissions - Quick Guide

## ⚠️ Issue Detected

You're getting: **"PERMISSION_DENIED: Missing or insufficient permissions"**

This means your Firestore security rules are blocking write access. Let's fix it!

---

## 🚀 Quick Fix (5 Minutes)

### **Step 1: Open Firestore Rules**

1. Go to: **https://console.firebase.google.com/project/drishti-database/firestore/rules**

   Or manually:
   - Open Firebase Console: https://console.firebase.google.com/
   - Click **"drishti-database"** project
   - Click **"Firestore Database"** in left sidebar
   - Click the **"Rules"** tab at the top

### **Step 2: Update Rules to Test Mode**

You'll see a text editor with current rules. Replace everything with this:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read and write access to all documents
    // ⚠️ NOTE: This is for DEVELOPMENT/TESTING only
    // Update these rules before going to production
    match /{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

### **Step 3: Publish Rules**

1. Click the **"Publish"** button (top-right)
2. Wait for confirmation message: "Rules published successfully"
3. Done! ✅

---

## ✅ Verify It's Fixed

Now run the seed command again:

```bash
npm run seed-db
```

You should see:
```
🌱 Starting database seeding...
📍 Seeding zones...
✅ Successfully seeded 8 zones
📢 Seeding announcements...
✅ Successfully seeded 3 announcements
... (etc)
🎉 Database seeding completed successfully!
```

---

## 🔐 Alternative: Production-Ready Rules (Recommended)

For better security (still allows testing), use these rules instead:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Zones - Anyone can read, only authenticated users can write
    match /zones/{zoneId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    // Incidents - Anyone can read, only authenticated users can write
    match /incidents/{incidentId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    // Announcements - Anyone can read, only authenticated users can write
    match /announcements/{announcementId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    // Metrics - Anyone can read, only authenticated users can write
    match /metrics/{metricId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    // Risk Scores - Anyone can read, only authenticated users can write
    match /riskScores/{scoreId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    // Config - Anyone can read, only authenticated users can write
    match /config/{configId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
  }
}
```

**Note:** With these rules, you need to be logged in as admin to write data, but the automatic zone updates and metrics will work after you log in!

---

## 🎯 Which Rules Should I Use?

### **Option 1: Test Mode (Easiest for Testing)**
- ✅ Allows all reads and writes
- ✅ No authentication needed for testing
- ⚠️ Less secure - change before production
- 👍 **Best for:** Quick testing and development

### **Option 2: Production-Ready (More Secure)**
- ✅ Public can read all data
- ✅ Only authenticated admins can write
- ✅ More secure
- ⚠️ Need to log in first to seed data
- 👍 **Best for:** Staging and production

---

## 📋 Complete Workflow After Fixing

### 1. **Fix Permissions** (Just completed above)

### 2. **Option A: Seed Data Without Login** (Using Test Mode Rules)
```bash
npm run seed-db
```
This will populate your database with sample data immediately.

### 3. **Option B: Seed After Login** (Using Production Rules)
```bash
# Start the app first
npm run dev

# In browser:
# 1. Go to http://localhost:5173
# 2. Click "Admin Login"
# 3. Sign up with: admin@drishti.com / password123
# 4. Now data will save automatically as you use the app

# Or run seed in a separate terminal (after logging in once):
npm run seed-db
```

### 4. **Start Using the App**
```bash
npm run dev
```
Open: http://localhost:5173

### 5. **View Data in Firebase Console**

Go to: https://console.firebase.google.com/project/drishti-database/firestore

You'll see:
- ✅ **zones** - 8 zones with density data
- ✅ **incidents** - Sample incidents
- ✅ **announcements** - Sample announcements  
- ✅ **metrics** - Video metrics (growing every 5 seconds)
- ✅ **riskScores** - Risk calculations
- ✅ **config** - Event configuration

---

## 🔍 Visual Guide: Where to Update Rules

```
Firebase Console
  └─ drishti-database (your project)
      └─ Firestore Database
          └─ [Data]  [Rules]  [Indexes]  [Usage]
                      ↑
                  Click Here!
```

The Rules tab looks like this:
```
┌─────────────────────────────────────────────┐
│  Firestore Rules                            │
│  ┌────────────────────────────────────────┐ │
│  │ rules_version = '2';                    │ │
│  │ service cloud.firestore {              │ │
│  │   match /databases/{database}/docs {   │ │
│  │     match /{document=**} {             │ │
│  │       allow read: if true;             │ │
│  │       allow write: if true;  ← ADD THIS│ │
│  │     }                                   │ │
│  │   }                                     │ │
│  │ }                                       │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  [Publish] ← Click to save                 │
└─────────────────────────────────────────────┘
```

---

## ⚡ Quick Troubleshooting

### Still Getting Permission Error?

1. **Did you click "Publish"?**
   - The rules won't apply until you publish them

2. **Wait 10 seconds**
   - Rules take a few seconds to propagate

3. **Clear browser cache**
   - Sometimes Firebase caches old rules

4. **Check you're editing the right project**
   - Make sure you're in "drishti-database" project

### "Rules syntax error"

Make sure you copied the exact rules format above. Common issues:
- Missing semicolons
- Wrong bracket placement
- Typos in `rules_version`

---

## 🎉 Success Indicators

After fixing permissions and running seed:

✅ **You should see:**
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

❌ **NOT seeing:**
```
Error: PERMISSION_DENIED
```

---

## 🔐 Security Reminder

**Important:** The test mode rules (`allow read, write: if true`) should only be used for:
- Development environment
- Local testing
- Quick prototyping

**Before deploying to production:**
1. Use the production-ready rules (Option 2 above)
2. Or implement custom security logic
3. Test your rules thoroughly
4. Enable Firebase App Check for additional security

---

## 📞 Need More Help?

### Check These:

1. **Firestore Rules Documentation:**
   https://firebase.google.com/docs/firestore/security/get-started

2. **Firebase Console:**
   https://console.firebase.google.com/project/drishti-database

3. **Your Rules Tab:**
   https://console.firebase.google.com/project/drishti-database/firestore/rules

---

## ✨ Next Steps After Fixing

Once permissions are fixed:

1. ✅ Run: `npm run seed-db`
2. ✅ Start app: `npm run dev`  
3. ✅ Visit: http://localhost:5173
4. ✅ Check Firebase Console to see all your data!
5. ✅ Test creating announcements and incidents
6. ✅ Watch live zone updates every 5 seconds

**You're almost there! Just need to update those Firestore rules! 🚀**
