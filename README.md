<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🛡️ PROJECT DRISHTI - Safety Monitoring Platform

**Drishti** is an advanced AI-powered safety and event awareness platform designed for large public events. It provides real-time crowd monitoring, incident tracking, risk assessment, and emergency response coordination.

## ✨ Features

- 🔐 **Secure Admin Authentication** - Firebase-powered email/password authentication
- 📊 **Real-Time Crowd Monitoring** - Live zone density tracking with predictive analytics
- 🚨 **Incident Management** - Log, track, and resolve security incidents in real-time
- 📢 **Admin Announcements** - Broadcast urgent messages to all attendees
- 🤖 **AI Situational Analysis** - Gemini-powered intelligent summaries and recommendations
- 📈 **Risk Score Engine** - Dynamic risk assessment based on multiple factors
- 🗺️ **Interactive Event Map** - Visual representation of zones and incidents
- 💾 **Firebase Integration** - Real-time database with automatic synchronization
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Firebase account (free tier works great)
- Gemini API key

### Installation

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Update `.env.local` with your credentials:
   ```env
   # Gemini API Key
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Set Up Firebase**
   
   Follow the detailed guide: [📖 FIREBASE_SETUP.md](FIREBASE_SETUP.md)
   
   Quick steps:
   - Create a Firebase project
   - Enable Email/Password authentication
   - Create Firestore database (start in test mode)
   - Copy your Firebase config to `.env.local`

4. **Run the Application**
   ```bash
   npm run dev
   ```

5. **Access the App**
   - Open http://localhost:5173 in your browser
   - Choose "Access Public Dashboard" or "Admin Login"

## 📚 Documentation

- **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** - Complete Firebase setup guide
- **[FIREBASE_INTEGRATION.md](FIREBASE_INTEGRATION.md)** - Integration documentation and API reference

## 🗄️ Firebase Database Structure

The application uses Firebase Firestore with the following collections:

- **`zones`** - Real-time crowd density data for each event zone
- **`incidents`** - Security incident logs with status tracking
- **`announcements`** - Admin announcements and broadcasts
- **`metrics`** - Live video feed metrics (collected every 5 seconds)
- **`riskScores`** - Historical risk assessment data
- **`config`** - Event configuration (attendee count, emergency contacts, location)

All data syncs in real-time across all connected devices!

## 🔐 Authentication

### Admin Access
1. Click "Admin Login" on the home screen
2. **Sign Up**: Create a new admin account with email/password
3. **Sign In**: Log in with existing credentials
4. Access full admin features:
   - Create announcements
   - Log and manage incidents
   - Configure event settings
   - View AI-powered situational summaries

### Public Access
- View real-time crowd density maps
- See active incidents and announcements
- Access emergency SOS features
- Read-only access to all public data

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: Google Gemini API (AI Studio)
- **Authentication**: Firebase Authentication
- **Database**: Cloud Firestore (real-time NoSQL)
- **Hosting**: Ready for Firebase Hosting or any static host

## 🎯 Key Capabilities

### Real-Time Monitoring
- Live zone density updates every 5 seconds
- Automatic video metrics collection
- Predictive bottleneck analysis
- Dynamic risk score calculation

### Incident Management
- Log incidents (medical, security, fire, anomaly)
- Track status: reported → dispatched → resolved
- Priority levels (high, medium, low)
- Location-based incident mapping

### Admin Portal
- Broadcast announcements (normal/urgent priority)
- Manual incident reporting
- Event configuration management
- Emergency contact setup

### AI Intelligence
- Situational summary generation
- Query-based analysis
- Emergency resource location (via Google Maps grounding)
- Predictive crowd flow analysis

## 📱 Usage

### For Event Organizers (Admins)
1. Log in with admin credentials
2. Monitor the dashboard for real-time crowd density
3. Review AI-powered situational summaries
4. Create announcements for attendees
5. Log and track incidents as they occur
6. Adjust event configuration as needed

### For Security Personnel
1. Access public dashboard
2. Monitor zone status and incident reports
3. Use SOS feature for emergency assistance
4. View live announcements

### For Attendees (Future Feature)
- Mobile app integration planned
- Receive real-time announcements
- Find safe routes during emergencies
- Report incidents via app

## 🔒 Security Features

- Firebase Authentication for secure admin access
- Environment variable protection for sensitive keys
- Firestore security rules (customizable)
- Session persistence and automatic logout
- Password validation (minimum 6 characters)

## 🧪 Testing

Build the application:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 🌐 Deployment

### Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Other Platforms
The app can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## 📊 Data Flow

```
Admin Action → React App → Firebase Service → Firestore
       ↓                                          ↓
  Local Update                            Real-time Listener
       ↓                                          ↓
   UI Update  ←──────────────────────────  All Connected Clients
```

## 🎨 UI/UX Features

- Dark theme optimized for control room environments
- High-contrast design for visibility
- Real-time animations and indicators
- Responsive layout (desktop/tablet/mobile)
- Accessibility considerations
- Professional command center aesthetic

## 🐛 Troubleshooting

### "Firebase: Error (auth/operation-not-allowed)"
- Enable Email/Password authentication in Firebase Console

### "Missing or insufficient permissions"
- Ensure Firestore is in test mode for development
- Check security rules in Firebase Console

### "Firebase: Error (auth/invalid-api-key)"
- Verify all Firebase environment variables in `.env.local`
- Ensure `VITE_` prefix is present on all Firebase variables

### Data not updating in real-time
- Check browser console for errors
- Verify internet connection
- Ensure Firebase project is active

## 🤝 Contributing

This project was built for the Mumbai Music Festival 2024 safety initiative. Contributions are welcome!

## 📄 License

This project is built with Google AI Studio and uses Firebase services.

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- Firebase for authentication and real-time database
- React and Vite teams for excellent developer experience
- Lucide for beautiful icons

## 📞 Support

For issues and questions:
- Check [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for Firebase-specific help
- Review [FIREBASE_INTEGRATION.md](FIREBASE_INTEGRATION.md) for integration details
- Open an issue on GitHub (if applicable)

## 🎯 Project Vision

**Drishti** (Sanskrit: "vision" or "sight") aims to provide event organizers with complete situational awareness through:
- Real-time crowd monitoring
- Predictive analytics
- AI-powered decision support
- Rapid incident response
- Emergency coordination

Built with safety as the top priority. 🛡️

---

View your app in AI Studio: https://ai.studio/apps/drive/1ssJe0uXN7A-60GKJFIDi-Y3TY8eIrBiz
