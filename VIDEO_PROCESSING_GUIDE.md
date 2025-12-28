# Drishti Video Processing Pipeline - Complete Guide

## 🎯 Overview

The Drishti video processing pipeline uses **MediaPipe + Gemini 2.5 Flash API** to analyze video feeds frame-by-frame every 3 seconds, providing real-time crowd safety monitoring and incident detection.

## 🏗️ Architecture

### Core Components

1. **VideoFrameProcessor** (`services/videoFrameProcessor.ts`)
   - Extracts frames from video every 3 seconds
   - Converts frames to base64 JPEG for API processing
   - Manages frame capture lifecycle

2. **Gemini AI Services** (`services/geminiService.ts`)
   - **analyzeVideoFrame()**: Analyzes video frames using Gemini 2.5 Flash Vision
   - **getSituationalSummary()**: Generates live summaries every 5 seconds
   - **chatWithDrishti()**: Powers the interactive chatbot

3. **VideoAnalysisOrchestrator** (`services/videoAnalysisOrchestrator.ts`)
   - Coordinates the entire pipeline
   - Manages zone updates, incident detection, and emergency announcements
   - Prevents duplicate incident logging

## 📊 Data Flow

```
Video Feed (Local/YouTube)
    ↓
VideoFrameProcessor (every 3 seconds)
    ↓
Gemini 2.5 Flash Vision API
    ↓
VideoAnalysisOrchestrator
    ↓
├─→ Zone Metrics → Update Tactical Map
├─→ Incident Detection → Auto-log Incidents
├─→ Emergency Detection → Auto-announce
└─→ Metrics Storage → Firebase/Firestore
```

## 🚀 How to Use

### Step 1: Upload Video Source

1. Navigate to **Config** tab as Admin
2. Upload a local video file or provide YouTube URL
3. Save the video source

### Step 2: Start Video Analysis

1. Go to **Dashboard** tab
2. Switch to **Live Feed** view
3. Click **"Start AI Analysis"** button
4. The system will now:
   - Extract frames every 3 seconds
   - Analyze crowd density per zone
   - Detect incidents automatically
   - Generate live summaries every 5 seconds

### Step 3: Monitor Real-Time Analysis

#### Tactical Map
- **Zones update automatically** with AI-detected crowd density
- Hover over zones to see detailed metrics
- Color coding: 🟢 Low → 🟡 Moderate → 🟠 High → 🔴 Critical

#### Incident Feed
- **Auto-detected incidents** appear with `[AUTO-DETECTED]` prefix
- Includes confidence scores
- Automatic priority assignment based on severity

#### Announcements
- **Critical incidents trigger automatic announcements**
- Emergency types: Fire, Smoke, Medical, Congestion, Security
- Urgent priority for immediate attention

### Step 4: Use AI Agent

#### Summary Mode (Auto-updates every 5 seconds)
- Real-time situational overview
- Risk assessment
- Bottleneck predictions
- Custom queries via input box

#### Chatbot Mode
- Ask questions about current event status
- Examples:
  - "What's the current crowd situation?"
  - "Which zones are safest right now?"
  - "Are there any active incidents?"

## 🔧 Technical Details

### Frame Processing Rate
- **Every 3 seconds** per video source
- Configurable in `videoFrameProcessor.ts` (line 48)

### AI Model
- **Gemini 2.5 Flash** with vision capabilities
- Temperature: 0.3 (for consistent analysis)
- JSON-structured responses

### Incident Detection Thresholds
- Confidence threshold: **60%** (configurable)
- Duplicate prevention: **5-minute window**
- Auto-logging for confidence ≥ 60%

### Zone Metrics Generated
For each zone, AI provides:
- **Crowd Density** (0-100%)
- **Predicted Density** (20-min forecast)
- **People Count** (estimated)
- **Movement Speed** (slow/moderate/fast)
- **Congestion Level** (normal/congested/bottleneck)
- **Risk Factors** (array of concerns)

### Incident Types Auto-Detected
- 🚑 **Medical**: Collapsed persons, distress signals
- 🔥 **Fire**: Flames, fire hazards
- 💨 **Smoke**: Smoke detection
- 👥 **Congestion**: Overcrowding, stampede risks
- 🔒 **Security**: Fights, suspicious activity
- ⚠️ **Anomaly**: Other safety concerns

## 📈 Bottleneck Analysis

The **Bottleneck** page displays graphs that are automatically populated from:
1. AI-analyzed zone metrics (every 3 seconds)
2. Predicted density forecasts
3. Historical trend data stored in Firestore

The graphs show:
- Current vs predicted density per zone
- Time-series crowd flow patterns
- Bottleneck risk indicators

## 🤖 Chatbot Capabilities

The integrated chatbot (in AI Agent panel) can answer:
- Current crowd status and density
- Active incident queries
- Zone-specific safety information
- Historical event data
- Custom commander queries

Powered by **Gemini 2.5 Flash** with access to:
- Real-time zone data
- Active incidents
- Event configuration
- Historical patterns

## 🎛️ Control Panel Features

Located at bottom of Live Feed view:

### Controls
- ▶️ **Start AI Analysis**: Begin frame processing
- ⏸️ **Stop Analysis**: Pause processing

### Live Statistics
- **Frames Analyzed**: Total frames processed
- **AI Cycles**: Number of complete analysis runs
- **Last Update**: Timestamp of most recent analysis

### Latest AI Summary
- Quick overview of current situation
- Incident count indicator
- Real-time status updates

## ⚙️ Configuration

### Environment Variables Required
```env
API_KEY=your_gemini_api_key_here
```

### Firebase Collections Used
- `zones` - Zone density and metrics
- `incidents` - Auto-detected and manual incidents
- `announcements` - Auto-generated and manual announcements
- `video_metrics` - Frame-by-frame analysis data
- `risk_scores` - Calculated risk assessments

## 🧪 Testing the Pipeline

### Test Scenario 1: Normal Crowd Flow
1. Upload a video with moderate crowd density
2. Start analysis
3. Verify zones update with density values
4. Check tactical map reflects changes

### Test Scenario 2: Incident Detection
1. Use video with visible emergency (fire, medical, congestion)
2. Start analysis
3. Verify incident auto-logged in Incidents tab
4. Check if urgent announcement was created

### Test Scenario 3: Chatbot Interaction
1. Switch to AI Agent → Chatbot mode
2. Ask: "What's the current situation?"
3. Verify response includes real-time data
4. Ask follow-up questions

## 🔍 Troubleshooting

### Analysis Not Starting
- Ensure video is loaded (check console for errors)
- Verify Gemini API key is configured
- Check browser console for specific errors

### No Zones Updating
- Verify Gemini API is responding (check network tab)
- Ensure video has visible crowd scenes
- Check Firebase write permissions

### Incidents Not Auto-Logging
- Verify confidence threshold (default: 60%)
- Check if incident already logged (duplicate prevention)
- Ensure Firebase connection is active

### Summary Not Updating
- Check 5-second interval is running
- Verify zones and incidents data is available
- Check Gemini API quotas

## 📊 Performance Metrics

- **Frame Processing**: ~1-2 seconds per frame
- **AI Analysis**: ~2-4 seconds via Gemini API
- **Total Cycle Time**: ~3-6 seconds per analysis
- **Summary Update**: Every 5 seconds
- **Database Writes**: Real-time via Firebase

## 🎓 Best Practices

1. **Start with test videos** before live deployment
2. **Monitor API quotas** (Gemini has rate limits)
3. **Review auto-detected incidents** for accuracy
4. **Adjust confidence thresholds** based on accuracy
5. **Use tactical map** for zone-based decision making
6. **Leverage chatbot** for quick status queries

## 🚨 Emergency Response Workflow

When critical incident detected:
1. **Automatic incident log** created with details
2. **Urgent announcement** broadcast to all users
3. **Zone status** updated to reflect emergency
4. **Risk score** recalculated and updated
5. **Commanders notified** via real-time updates

## 📝 Notes

- Only **local videos** support frame-by-frame analysis (YouTube embeds have limitations)
- Analysis continues until manually stopped
- All data persists to Firebase in real-time
- Chatbot maintains conversation context
- Summary auto-refreshes even without video analysis active

---

**Built with**: MediaPipe, Gemini 2.5 Flash, React, TypeScript, Firebase
**For**: Large-scale public event safety monitoring
**Project**: Drishti - Vision for Safety
