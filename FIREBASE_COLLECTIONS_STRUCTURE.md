# 📊 Firebase Collections Structure - Drishti

## Complete Database Schema

---

## 1️⃣ **zones** Collection

**Purpose**: Store 6 fixed zones for tactical map

**Document IDs**: `zone-a`, `zone-b`, `zone-c`, `zone-d`, `zone-e`, `zone-f`

**Schema**:
```typescript
{
  id: string;           // "zone-a" to "zone-f"
  name: string;         // "Zone A" to "Zone F"
  density: number;      // 0-100 (current crowd density %)
  predictedDensity: number;  // 0-100 (forecast +20min)
  status: "normal" | "congested" | "bottleneck";
  updatedAt: string;    // ISO timestamp
}
```

**Example**:
```json
{
  "id": "zone-c",
  "name": "Zone C",
  "density": 78.450,
  "predictedDensity": 85.200,
  "status": "bottleneck",
  "updatedAt": "2025-12-28T12:00:00Z"
}
```

**Count**: EXACTLY 6 documents (constant)

---

## 2️⃣ **incidents** Collection

**Purpose**: Track security incidents

**Document IDs**: Auto-generated (`INC-XXX` or `INC-AUTO-XXX`)

**Schema**:
```typescript
{
  id: string;           // "INC-001" or "INC-AUTO-1735392145123"
  type: "medical" | "security" | "fire" | "anomaly";
  location: string;     // zone-a to zone-f
  status: "reported" | "dispatched" | "resolved";
  priority: "low" | "medium" | "high";
  timestamp: string;    // "14:22" format
  description: string;  // Incident details
  createdAt: string;    // ISO timestamp (auto-added)
}
```

**Example**:
```json
{
  "id": "INC-AUTO-1735392145123",
  "type": "medical",
  "location": "zone-b",
  "status": "reported",
  "priority": "high",
  "timestamp": "14:22",
  "description": "[AUTO-DETECTED] Person collapsed near entry gate (Confidence: 87%)",
  "createdAt": "2025-12-28T14:22:00Z"
}
```

**Count**: Variable (grows as incidents occur)

---

## 3️⃣ **announcements** Collection

**Purpose**: Event announcements for public

**Document IDs**: Auto-generated (`ANN-XXX`, `ANN-AI-XXX`, `ANN-AUTO-XXX`)

**Schema**:
```typescript
{
  id: string;           // "ANN-001" or "ANN-AI-1735392145123"
  title: string;        // Announcement title
  content: string;      // Announcement message
  timestamp: string;    // "14:00" format
  priority: "normal" | "urgent";
  createdAt: string;    // ISO timestamp (auto-added)
}
```

**Example**:
```json
{
  "id": "ANN-AI-1735392145123",
  "title": "⚠️ Crowd Alert",
  "content": "High crowd density detected in Zone C. Please use alternative routes and follow crowd control measures for your safety.",
  "timestamp": "14:35",
  "priority": "urgent",
  "createdAt": "2025-12-28T14:35:00Z"
}
```

**Count**: Variable (grows with announcements)

---

## 4️⃣ **complaints** Collection

**Purpose**: User complaint management system

**Document IDs**: Auto-generated (`COMP-XXX`)

**Schema**:
```typescript
{
  id: string;           // "COMP-1735392145123"
  subject: string;      // Complaint title
  details: string;      // Full description
  importance: "low" | "medium" | "high" | "critical";
  department: "security" | "medical" | "facilities" | "crowd-management" | "general";
  status: "open" | "in-progress" | "resolved" | "revoked";
  submittedBy: string;  // User email
  submittedAt: string;  // "14:35:45" format
  adminReply?: string;  // Optional admin response
  repliedBy?: string;   // Admin email
  repliedAt?: string;   // "14:40:12" format
  createdAt: string;    // ISO timestamp (auto-added)
}
```

**Example**:
```json
{
  "id": "COMP-1735392145123",
  "subject": "Sound system too loud",
  "details": "The speakers near the main stage are causing discomfort. Many people are covering their ears.",
  "importance": "high",
  "department": "facilities",
  "status": "in-progress",
  "submittedBy": "public@user.com",
  "submittedAt": "14:35:45",
  "adminReply": "We've adjusted the volume. Thank you for reporting this.",
  "repliedBy": "admin@drishti.com",
  "repliedAt": "14:40:12",
  "createdAt": "2025-12-28T14:35:45Z"
}
```

**Count**: Variable (grows with complaints)

---

## 5️⃣ **video_metrics** Collection

**Purpose**: Store AI analysis metrics over time

**Document IDs**: Auto-generated (timestamp-based)

**Schema**:
```typescript
{
  timestamp: string;        // ISO format
  totalPeople: number;      // Estimated count
  crowdDensity: number;     // 0-100%
  avgMovementSpeed: number; // m/s
  anomalyDetections: number; // Count of anomalies
  zoneId: string;           // zone-a to zone-f or "all"
}
```

**Example**:
```json
{
  "timestamp": "2025-12-28T14:35:00Z",
  "totalPeople": 4500,
  "crowdDensity": 78.5,
  "avgMovementSpeed": 1.2,
  "anomalyDetections": 2,
  "zoneId": "zone-c"
}
```

**Count**: Many (historical data)

---

## 6️⃣ **riskScores** Collection

**Purpose**: Track overall risk assessment

**Document IDs**: Auto-generated (timestamp-based)

**Schema**:
```typescript
{
  score: number;        // 0-100
  level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  factors: Array<{
    name: string;
    value: string;
    impact: string;
    icon: any;
  }>;
  timestamp: string;    // ISO format
}
```

**Example**:
```json
{
  "score": 72.5,
  "level": "HIGH",
  "factors": [
    {
      "name": "Crowd Density",
      "value": "72% Avg",
      "impact": "High Severity"
    },
    {
      "name": "Critical Incidents",
      "value": "2 Active",
      "impact": "Urgent"
    }
  ],
  "timestamp": "2025-12-28T14:35:00Z"
}
```

**Count**: Many (historical data)

---

## 7️⃣ **config** Collection

**Purpose**: Event configuration settings

**Document IDs**: Usually `current-config` (single document)

**Schema**:
```typescript
{
  attendeeCount: number;          // Total attendees
  emergencyContactPhone: string;  // Emergency number
  locationName: string;           // Event location name
  latitude: number;               // GPS latitude
  longitude: number;              // GPS longitude
  updatedAt: string;              // ISO timestamp
}
```

**Example**:
```json
{
  "attendeeCount": 45280,
  "emergencyContactPhone": "+91-9876543210",
  "locationName": "Mumbai Central First Aid Hub",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "updatedAt": "2025-12-28T12:00:00Z"
}
```

**Count**: 1 document (singleton)

---

## 8️⃣ **videoSource** Collection

**Purpose**: Store current video source configuration

**Document IDs**: `current-video` (single document)

**Schema**:
```typescript
{
  id: string;           // "VIDEO-1735392145123"
  type: "youtube" | "local";
  url: string;          // Video URL or blob URL
  fileName?: string;    // Only for local videos
  uploadedAt: string;   // ISO timestamp
  uploadedBy: string;   // User email
}
```

**Example**:
```json
{
  "id": "VIDEO-1735392145123",
  "type": "local",
  "url": "blob:http://localhost:3000/abc123",
  "fileName": "event_footage.mp4",
  "uploadedAt": "2025-12-28T10:00:00Z",
  "uploadedBy": "admin@drishti.com"
}
```

**Count**: 1 document (current source only)

---

## 📊 Summary Table

| Collection | Documents | Purpose | Constant/Variable |
|------------|-----------|---------|-------------------|
| **zones** | 6 | Tactical map zones | ✅ Constant IDs, Variable data |
| **incidents** | Variable | Security incidents | 🔄 Grows over time |
| **announcements** | Variable | Public announcements | 🔄 Grows over time |
| **complaints** | Variable | User complaints | 🔄 Grows over time |
| **video_metrics** | Many | AI analysis history | 🔄 Historical data |
| **riskScores** | Many | Risk tracking | 🔄 Historical data |
| **config** | 1 | Event settings | ⚙️ Updated as needed |
| **videoSource** | 1 | Current video | ⚙️ Changed by admin |

---

## 🎯 Data Flow

### **AI Analysis → Firebase**:
```
Every 5 seconds:
  1. Capture frame
  2. Gemini API analysis
  3. Update zones → Firebase
  4. Log incidents (if detected) → Firebase
  5. Create announcements (if critical) → Firebase
  6. Store metrics → Firebase
```

### **User Actions → Firebase**:
```
- Public submits complaint → complaints collection
- Admin replies → Update complaint document
- Admin adds announcement → announcements collection
- Admin logs incident → incidents collection
- Admin changes config → config collection
```

---

## ✅ Verification Checklist

To verify your Firebase is correctly set up:

- [ ] Zones collection has EXACTLY 6 documents (zone-a through zone-f)
- [ ] Incidents collection exists and has examples
- [ ] Announcements collection exists and has examples
- [ ] Complaints collection exists (may be empty)
- [ ] Video metrics collection has data (after AI analysis)
- [ ] Risk scores collection has data
- [ ] Config collection has current event settings
- [ ] VideoSource collection has current video

---

*Last Updated: December 28, 2025*
*Database Schema Version: 1.0*
