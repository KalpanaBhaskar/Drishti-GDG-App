# 🔍 Firebase Debug Guide - Complaints & Zones Not Saving

## Issue: Data Not Saving to Firebase

### Possible Causes:
1. Firestore rules not allowing writes
2. Network/connection issues
3. Import errors in services
4. State not triggering save functions

---

## ✅ Step 1: Verify Firestore Rules

### Check Current Rules:
1. Go to: https://console.firebase.google.com/project/drishti-bf2fc/firestore/rules
2. Current rules should be:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"** if not already set
4. Wait 1-2 minutes for propagation

---

## ✅ Step 2: Test Complaints in Browser Console

### Open Browser Console (F12) and run:

```javascript
// Test complaint submission
const testComplaint = {
  id: 'COMP-TEST-' + Date.now(),
  subject: 'Test Complaint',
  details: 'Testing Firebase write',
  importance: 'medium',
  department: 'general',
  status: 'open',
  submittedBy: 'test@user.com',
  submittedAt: new Date().toLocaleTimeString()
};

// Check if function exists
console.log('addComplaint function:', typeof addComplaint);

// Try to submit
// (This will only work if imports are correct)
```

### Expected Console Output:
```
✅ Complaint saved to Firebase
```

### If You See Errors:
- ❌ "Permission denied" → Rules not set correctly
- ❌ "Function not defined" → Import issue
- ❌ "Network error" → Connection problem

---

## ✅ Step 3: Test Zones Save

### In Browser Console:

```javascript
// Test zone save
const testZones = [
  { id: 'zone-a', name: 'Zone A', density: 50, predictedDensity: 55, status: 'normal' }
];

console.log('saveZones function:', typeof saveZones);
```

### Check Console for:
```
💾 Saving 1 fixed zones to Firebase...
✅ Successfully saved 1 zones
```

---

## ✅ Step 4: Manual Test in App

### Test Complaints:
1. Open app: http://localhost:3008
2. Click "Access Public Dashboard"
3. Go to **Complaints** tab
4. Fill out form:
   - Subject: "Test Complaint"
   - Details: "Testing Firebase integration"
   - Importance: High
   - Department: Security
5. Click **"Submit Complaint"**
6. Open Browser Console (F12)
7. Look for:
   ```
   ✅ Complaint saved successfully
   ```

### Check Firebase:
1. Open Firebase Console
2. Go to Firestore Database
3. Look for `complaints` collection
4. Should see your test complaint

### Test Zones:
1. Admin login
2. Go to Config → Upload video
3. Go to Dashboard → Live Feed
4. Click "Start AI Analysis"
5. Wait 5 seconds
6. Check Console:
   ```
   💾 Saving 6 fixed zones to Firebase...
   ✅ Successfully saved 6 zones
   ```

### Check Firebase:
1. Firestore Database
2. `zones` collection
3. Should see 6 documents updating in real-time

---

## 🐛 Common Issues & Fixes

### Issue 1: "Permission Denied"
**Fix**: Update Firestore rules as shown in Step 1

### Issue 2: Complaints collection not appearing
**Cause**: No complaints submitted yet
**Fix**: Submit at least one complaint to create collection

### Issue 3: Zones not updating
**Possible causes**:
- AI analysis not running
- Video not loaded
- saveZones filter rejecting zones
- Firebase connection issue

**Debug**:
```javascript
// Check if zones are valid
const zones = ['zone-a', 'zone-b', 'zone-c', 'zone-d', 'zone-e', 'zone-f'];
console.log('Valid zone IDs:', zones);
```

### Issue 4: Old zones reappearing
**Cause**: Multiple sources writing to Firebase
**Fix**: Ensure simulation is stopped when AI active

---

## 📊 Verification Checklist

- [ ] Firestore rules allow read/write (published)
- [ ] Browser console shows no permission errors
- [ ] Network tab shows successful Firebase requests
- [ ] Complaints form submits without errors
- [ ] Console shows "Complaint saved successfully"
- [ ] Firebase console shows complaints collection
- [ ] Zones console logs show "Saving X zones"
- [ ] Firebase shows 6 zone documents
- [ ] Zone documents updating with new density values

---

## 🔬 Advanced Debugging

### Enable Verbose Logging:

Add to browser console:
```javascript
localStorage.setItem('firebase:logging', 'true');
```

Refresh page and check console for detailed Firebase logs.

### Check Network Requests:

1. Open DevTools → Network tab
2. Filter by "firestore.googleapis.com"
3. Look for POST/PATCH requests
4. Check response codes:
   - 200 OK ✅
   - 403 Forbidden ❌ (permissions issue)
   - 500 Error ❌ (server issue)

---

## ✅ Expected Behavior

### When Complaint Submitted:
1. Form validates
2. Complaint object created
3. `addComplaint()` called
4. Firestore write initiated
5. Console: "Complaint saved"
6. Firebase: Document appears in `complaints` collection
7. UI: Complaint appears in list

### When Zones Update (Every 5 seconds):
1. Frame captured
2. Gemini API analyzes
3. 6 zones returned
4. Filtered to valid IDs
5. `saveZones()` called
6. Console: "Saving 6 zones"
7. Firebase: 6 documents updated
8. UI: Tactical map updates

---

## 🆘 Still Not Working?

### Try Manual Firebase Write Test:

```javascript
// Direct Firebase write test
import { doc, setDoc, getFirestore } from 'firebase/firestore';

const db = getFirestore();
const testDoc = doc(db, 'test_collection', 'test_doc');

setDoc(testDoc, {
  test: 'Hello Firebase',
  timestamp: new Date().toISOString()
}).then(() => {
  console.log('✅ Direct write successful!');
}).catch((error) => {
  console.error('❌ Direct write failed:', error);
});
```

If this works → Issue is with app logic
If this fails → Issue is with Firebase config/rules

---

*Created: December 28, 2025*
*Purpose: Debug Firebase write issues*
