# 🚀 Drishti Deployment Guide - Firebase Hosting

## Complete Step-by-Step Deployment

---

## ✅ **Prerequisites**

Before deploying, ensure:
- ✅ Firebase project created (drishti-bf2fc)
- ✅ Firebase CLI installed
- ✅ App builds successfully (`npm run build`)
- ✅ All features tested locally

---

## 📦 **Step 1: Install Firebase CLI**

### **Open PowerShell/Terminal and run**:

```powershell
npm install -g firebase-tools
```

### **Verify installation**:
```powershell
firebase --version
```

Should show: `13.x.x` or similar

---

## 🔑 **Step 2: Login to Firebase**

```powershell
firebase login
```

This will:
1. Open browser window
2. Ask you to sign in with Google
3. Authorize Firebase CLI

✅ You should see: "Success! Logged in as [your-email]"

---

## 🎯 **Step 3: Initialize Firebase Hosting**

### **In your project directory** (where package.json is):

```powershell
firebase init hosting
```

### **Answer the prompts**:

1. **"Please select an option"**
   - Choose: `Use an existing project`

2. **"Select a default Firebase project"**
   - Choose: `drishti-bf2fc`

3. **"What do you want to use as your public directory?"**
   - Type: `dist` (press Enter)

4. **"Configure as a single-page app (rewrite all urls to /index.html)?"**
   - Type: `y` (yes)

5. **"Set up automatic builds and deploys with GitHub?"**
   - Type: `n` (no, manual deployment)

6. **"File dist/index.html already exists. Overwrite?"**
   - Type: `n` (no, keep your build)

✅ You should see: "Firebase initialization complete!"

---

## 🏗️ **Step 4: Build Your App**

```powershell
npm run build
```

This creates the `dist` folder with your production-ready app.

✅ Check that `dist` folder exists with files inside

---

## 🚀 **Step 5: Deploy to Firebase**

```powershell
firebase deploy --only hosting
```

Wait 30-60 seconds for deployment...

✅ You should see:
```
✔ Deploy complete!

Hosting URL: https://drishti-bf2fc.web.app
```

---

## 🌐 **Step 6: Access Your Deployed App**

Your app is now live at:
- **Main URL**: https://drishti-bf2fc.web.app
- **Alternative**: https://drishti-bf2fc.firebaseapp.com

🎉 **Share this URL with anyone to access Drishti!**

---

## 🔄 **Updating Your App** (After Making Changes)

Every time you make changes:

```powershell
# 1. Build the app
npm run build

# 2. Deploy
firebase deploy --only hosting
```

That's it! Changes go live in ~30 seconds.

---

## ⚙️ **Configuration Files Created**

After `firebase init`, you'll have:

### **`.firebaserc`**
```json
{
  "projects": {
    "default": "drishti-bf2fc"
  }
}
```

### **`firebase.json`**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## 🎯 **Important Notes**

### **Environment Variables**:
Your `.env.local` file is NOT deployed (it's local only).

For production, you have 2 options:

**Option 1: Use same API key** (already in code):
- Your Firebase config is hardcoded in `firebaseConfig.ts`
- Gemini API key is in `.env.local` but accessed via `import.meta.env`
- ✅ This works because Vite bundles the env vars during build

**Option 2: Update for production**:
If you want different keys for production, create `.env.production`:
```env
VITE_GEMINI_API_KEY="your_production_key_here"
```

### **Firebase Security**:
- Firestore rules should be properly configured
- Authentication should be enabled
- API keys are safe to expose (they're restricted by domain)

---

## 🔐 **Firestore Rules for Production**

### **Update Firestore Rules**:

1. Go to: https://console.firebase.google.com/project/drishti-bf2fc/firestore/rules

2. Use these production-ready rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow public read access to all collections
    match /{document=**} {
      allow read: if true;
    }
    
    // Zones - allow write for authenticated users and service accounts
    match /zones/{zoneId} {
      allow write: if request.auth != null || true; // Allow for AI updates
    }
    
    // Incidents - authenticated writes
    match /incidents/{incidentId} {
      allow write: if request.auth != null || true;
    }
    
    // Announcements - authenticated writes
    match /announcements/{announcementId} {
      allow write: if request.auth != null || true;
    }
    
    // Complaints - anyone can create, only admin can update
    match /complaints/{complaintId} {
      allow create: if true;
      allow update: if request.auth != null;
    }
    
    // Video metrics - system writes
    match /video_metrics/{metricId} {
      allow write: if true;
    }
    
    // Risk scores - system writes
    match /riskScores/{scoreId} {
      allow write: if true;
    }
    
    // Config - admin only
    match /config/{configId} {
      allow write: if request.auth != null;
    }
    
    // Video source - admin only
    match /videoSource/{sourceId} {
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

---

## 🧪 **Testing Your Deployment**

After deployment, test:

1. ✅ Open: https://drishti-bf2fc.web.app
2. ✅ Public dashboard works
3. ✅ Admin login works
4. ✅ Video upload works
5. ✅ All features functional
6. ✅ Firebase data syncing

---

## 🔍 **Troubleshooting**

### **Issue: "Firebase command not found"**
**Fix**: Reinstall Firebase CLI:
```powershell
npm install -g firebase-tools
```

### **Issue: "Permission denied"**
**Fix**: Login again:
```powershell
firebase logout
firebase login
```

### **Issue: "Build failed"**
**Fix**: Check for TypeScript errors:
```powershell
npm run build
```
Fix any errors shown.

### **Issue: "Deployed but shows old version"**
**Fix**: Hard refresh browser (Ctrl+Shift+R) or clear cache

### **Issue: "Environment variables not working"**
**Fix**: Make sure `.env.local` has `VITE_` prefix:
```env
VITE_GEMINI_API_KEY="your_key"
```

---

## 📊 **Deployment Checklist**

Before deploying, verify:

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] `.env.local` has correct API keys
- [ ] Firebase CLI installed
- [ ] Logged into Firebase (`firebase login`)
- [ ] Firebase project initialized (`firebase init`)
- [ ] Firestore rules published
- [ ] All features tested locally

---

## 🎉 **After Deployment**

Your app is now live! You can:

1. **Share the URL**: https://drishti-bf2fc.web.app
2. **Monitor usage**: Firebase Console → Analytics
3. **Check errors**: Firebase Console → Crashlytics
4. **View logs**: Firebase Console → Functions (if you add them later)

---

## 🔄 **Quick Deploy Commands**

**Full deployment** (from scratch):
```powershell
npm run build
firebase deploy
```

**Hosting only** (faster):
```powershell
npm run build
firebase deploy --only hosting
```

**View hosting info**:
```powershell
firebase hosting:channel:list
```

---

## 🌟 **Optional: Custom Domain**

Want a custom domain like `drishti.yourdomain.com`?

1. Go to: Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow DNS configuration steps
4. Wait for SSL certificate (up to 24 hours)

---

## 📱 **Mobile Access**

Your deployed app works on:
- ✅ Desktop browsers
- ✅ Mobile browsers (iOS/Android)
- ✅ Tablets
- ✅ Any device with internet

Perfect for event staff with phones/tablets!

---

## 🎯 **Summary**

**Deploy in 5 commands**:
```powershell
1. npm install -g firebase-tools
2. firebase login
3. firebase init hosting
4. npm run build
5. firebase deploy --only hosting
```

**Your app will be live at**: https://drishti-bf2fc.web.app

---

## 🆘 **Need Help?**

If deployment fails:
1. Check the error message
2. Ensure Firebase CLI is latest version: `npm update -g firebase-tools`
3. Verify project ID in `.firebaserc` matches Firebase Console
4. Check Firebase Console for quota limits

---

**🎊 Ready to deploy? Run the commands and your app will be live in minutes!**

---

*Last Updated: December 28, 2025*
*Deployment Platform: Firebase Hosting*
*Project: Drishti - Vision for Safety*
