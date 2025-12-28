# 🔥 Firebase Cleanup & Inspection Guide

## ❌ Issue: Permission Denied

The cleanup script encountered a **PERMISSION_DENIED** error. This means Firestore security rules need to be updated.

---

## 🔧 Step 1: Fix Firebase Permissions

### **Go to Firebase Console**:
1. Open https://console.firebase.google.com/
2. Select your project: **drishti-bf2fc**
3. Click **Firestore Database** in left sidebar
4. Click **Rules** tab at the top

### **Current Rules** (Too Restrictive):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;  // ❌ Blocks everything
    }
  }
}
```

### **Update to These Rules** (Development Mode):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to everyone
    match /{document=**} {
      allow read: if true;
    }
    
    // Allow write access to authenticated users
    match /{document=**} {
      allow write: if request.auth != null;
    }
    
    // Special rules for specific collections
    match /zones/{zoneId} {
      allow read: if true;
      allow write: if true;  // Open for development
    }
    
    match /incidents/{incidentId} {
      allow read: if true;
      allow write: if true;
    }
    
    match /announcements/{announcementId} {
      allow read: if true;
      allow write: if true;
    }
    
    match /complaints/{complaintId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

### **Click "Publish"** to save the rules

---

## 🧹 Step 2: Manual Cleanup in Firebase Console

### **Remove Old Zones**:

1. Go to **Firestore Database** → **Data** tab
2. Find the **`zones`** collection
3. You should see multiple zone documents

### **Keep Only These 6 Zones**:
- ✅ `zone-a` (Zone A)
- ✅ `zone-b` (Zone B)
- ✅ `zone-c` (Zone C)
- ✅ `zone-d` (Zone D)
- ✅ `zone-e` (Zone E)
- ✅ `zone-f` (Zone F)

### **Delete Any Other Zones**:
Examples of zones to DELETE:
- ❌ `north`
- ❌ `south`
- ❌ `east`
- ❌ `west`
- ❌ `central`
- ❌ Any duplicates of zone-a through zone-f

### **How to Delete**:
1. Click on the zone document (e.g., "north")
2. Click the **3 dots menu** (⋮) at top right
3. Click **"Delete document"**
4. Confirm deletion
5. Repeat for all old zones

---

## 📊 Step 3: Verify Data in Firebase Console

### **Check Each Collection**:

### **1. Zones Collection** (`zones`):
✅ Should have EXACTLY 6 documents:
```
zone-a: { name: "Zone A", density: X, predictedDensity: Y, status: "..." }
zone-b: { name: "Zone B", density: X, predictedDensity: Y, status: "..." }
zone-c: { name: "Zone C", density: X, predictedDensity: Y, status: "..." }
zone-d: { name: "Zone D", density: X, predictedDensity: Y, status: "..." }
zone-e: { name: "Zone E", density: X, predictedDensity: Y, status: "..." }
zone-f: { name: "Zone F", density: X, predictedDensity: Y, status: "..." }
```

### **2. Incidents Collection** (`incidents`):
Check for:
- Manual incidents (INC-XXX)
- Auto-detected incidents (INC-AUTO-XXX)
- Fields: type, location, status, priority, description, timestamp

Example:
```
INC-001:
  type: "medical"
  location: "zone-b"
  status: "dispatched"
  priority: "high"
  description: "Male, 24, reporting heat exhaustion in Zone B."
  timestamp: "14:22"
```

### **3. Announcements Collection** (`announcements`):
Check for:
- Manual announcements (ANN-XXX)
- Auto-created announcements (ANN-AI-XXX, ANN-AUTO-XXX)
- Fields: title, content, priority, timestamp

Example:
```
ANN-001:
  title: "Main Stage Update"
  content: "Performance delayed by 15 mins..."
  priority: "normal"
  timestamp: "14:00"
```

### **4. Complaints Collection** (`complaints`):
Check for:
- User submitted complaints (COMP-XXX)
- Fields: subject, details, importance, department, status, submittedBy, adminReply

Example:
```
COMP-1735392145123:
  subject: "Sound too loud"
  details: "The speakers near main stage..."
  importance: "high"
  department: "facilities"
  status: "open"
  submittedBy: "public@user.com"
  submittedAt: "14:35:45"
  adminReply: (optional) "We've adjusted the volume..."
```

### **5. Video Metrics Collection** (`video_metrics`):
- Multiple documents with timestamp-based IDs
- Fields: timestamp, totalPeople, crowdDensity, avgMovementSpeed, zoneId

### **6. Risk Scores Collection** (`riskScores`):
- Multiple documents tracking risk over time
- Fields: score, level, factors, timestamp

### **7. Config Collection** (`config`):
- Usually 1 document with event configuration
- Fields: attendeeCount, emergencyContactPhone, locationName, latitude, longitude

---

## 📸 Step 4: Take Screenshots (Optional)

For verification, you can take screenshots of:
1. Zones collection showing only 6 zones
2. Incidents collection with entries
3. Announcements collection
4. Complaints collection
5. Firebase Rules page showing updated rules

---

## 🔄 Step 5: After Cleanup - Restart App

Once you've cleaned up Firebase:

1. Stop the dev server (Ctrl+C)
2. Restart: `npm run dev`
3. The app will now read only the 6 fixed zones
4. All other data (incidents, announcements, complaints) will be preserved

---

## ✅ Expected Result After Cleanup

### **Zones Collection**:
```
📁 zones
  ├── zone-a (Zone A)
  ├── zone-b (Zone B)
  ├── zone-c (Zone C)
  ├── zone-d (Zone D)
  ├── zone-e (Zone E)
  └── zone-f (Zone F)
```

**Total**: Exactly 6 zones, no more, no less.

### **These Zones are CONSTANT**:
- ✅ IDs never change (zone-a through zone-f)
- ✅ Names never change (Zone A through Zone F)
- ✅ Only **density, predictedDensity, status** vary based on:
  - Live video analysis
  - AI feedback every 5 seconds
  - Real-time crowd monitoring

---

## 🎯 Why 6 Fixed Zones?

1. **Consistent Mapping**: Always know which zone is which
2. **Efficient Processing**: AI doesn't need to discover zones
3. **Reliable Graphs**: Bottleneck graphs always show same zones
4. **Predictable**: Users and admins know the zone layout
5. **Faster API**: Simplified zone structure = faster analysis

---

## 📝 Quick Checklist

Use this to verify your Firebase cleanup:

- [ ] Firebase rules updated to allow read/write
- [ ] Zones collection has EXACTLY 6 documents
- [ ] Zone IDs are: zone-a, zone-b, zone-c, zone-d, zone-e, zone-f
- [ ] No old zones (north, south, east, west, central)
- [ ] Incidents collection visible and has data
- [ ] Announcements collection visible and has data
- [ ] Complaints collection exists (may be empty)
- [ ] Video metrics collection exists
- [ ] Risk scores collection exists
- [ ] Config collection exists
- [ ] App restarts successfully after cleanup

---

## 🆘 Troubleshooting

### **Still seeing permission errors?**
- Wait 1-2 minutes after updating rules
- Hard refresh Firebase console (Ctrl+Shift+R)
- Sign out and sign back into Firebase console

### **Zones keep reappearing?**
- Make sure app is stopped (Ctrl+C)
- Delete zones in Firebase
- Update rules
- Restart app

### **Can't see data in Firebase?**
- Check you're in the correct project (drishti-bf2fc)
- Check Firestore Database is enabled
- Check you're looking at the "Data" tab, not "Rules"

---

## 📚 Additional Resources

### **Firebase Console URLs**:
- **Your Project**: https://console.firebase.google.com/project/drishti-bf2fc
- **Firestore Data**: https://console.firebase.google.com/project/drishti-bf2fc/firestore/data
- **Firestore Rules**: https://console.firebase.google.com/project/drishti-bf2fc/firestore/rules

### **What Each Collection Does**:
- **zones**: Tactical map visualization (6 fixed zones)
- **incidents**: Security incidents feed
- **announcements**: Public announcements
- **complaints**: User complaint system
- **video_metrics**: AI analysis historical data
- **riskScores**: Risk assessment tracking
- **config**: Event configuration settings

---

**After completing these steps, your Firebase will be clean and organized with only the 6 fixed zones that should exist for all events!** ✅

---

*Created: December 28, 2025*
*Purpose: Firebase cleanup and data verification*
