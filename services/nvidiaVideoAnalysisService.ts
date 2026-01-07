/**
 * NVIDIA Video Analysis Service
 * Uses NVIDIA NIM API for video frame analysis with Drishti prompt
 * This replaces Gemini for video analysis (Gemini is now chatbot-only)
 */

import { VideoAnalysisResult, ZoneMetrics, DetectedIncident } from './geminiService';

// Rate limiting for NVIDIA API
const API_CALL_TRACKER = {
  lastCallTime: 0,
  callCount: 0,
  resetTime: 0
};

// NVIDIA API: 10-second intervals for Drishti batches
const MIN_API_CALL_INTERVAL = 10000; // 10 seconds
const MAX_CALLS_PER_MINUTE = 6; // Maximum 6 calls per minute

/**
 * Check if we can make an API call (rate limiting)
 */
function canMakeApiCall(): boolean {
  const now = Date.now();
  
  // Reset counter every 60 seconds
  if (now - API_CALL_TRACKER.resetTime > 60000) {
    API_CALL_TRACKER.callCount = 0;
    API_CALL_TRACKER.resetTime = now;
  }
  
  // Check if we've hit the rate limit
  if (API_CALL_TRACKER.callCount >= MAX_CALLS_PER_MINUTE) {
    console.warn(`⚠️ NVIDIA API rate limit reached (${MAX_CALLS_PER_MINUTE} calls/min). Skipping.`);
    return false;
  }
  
  // Check if enough time passed since last call
  const timeSinceLastCall = now - API_CALL_TRACKER.lastCallTime;
  if (timeSinceLastCall < MIN_API_CALL_INTERVAL) {
    console.warn(`⚠️ NVIDIA API called too soon (${timeSinceLastCall}ms < 10s). Skipping.`);
    return false;
  }
  
  return true;
}

/**
 * Record API call for rate limiting
 */
function recordApiCall(): void {
  API_CALL_TRACKER.lastCallTime = Date.now();
  API_CALL_TRACKER.callCount++;
  console.log(`📡 NVIDIA API call ${API_CALL_TRACKER.callCount}/6 this minute (Drishti 10-second batch)`);
}

/**
 * Analyze video frame using NVIDIA NIM API with Drishti prompt
 * "DRISHTI" LIVE INTELLIGENCE ENGINE
 * Processes incoming video data in 10-second batches for real-time safety monitoring
 */
export async function analyzeVideoFrameWithNvidia(frameData: string): Promise<VideoAnalysisResult> {
  // RATE LIMITING: Check if we can make this API call
  if (!canMakeApiCall()) {
    throw new Error('RATE_LIMIT: NVIDIA API call blocked to prevent quota exhaustion');
  }
  
  recordApiCall(); // Track this API call
  
  const nvidiaApiKey = import.meta.env.VITE_NVIDIA_API_KEY;
  if (!nvidiaApiKey) {
    throw new Error('NVIDIA API key not configured. Please set VITE_NVIDIA_API_KEY in .env.local');
  }
  
  // Get current timestamp for the 10-second window
  const now = new Date();
  const windowStart = new Date(now.getTime() - 10000); // 10 seconds ago
  const timestamp_window = `${windowStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} - ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  
  const prompt = `Role & Objective:
You are the "Drishti" Live Intelligence Engine. Your task is to process incoming video data streams in strict 10-second batches. Your goal is to generate a real-time safety summary that updates the monitoring dashboard exactly once per batch.

Input Context:
You will receive visual data representing the most recent 10 seconds of activity. Treat this 10-second window as the "Current Event."

Core Analysis Protocols:

1. THE 10-SECOND ASSESSMENT:
   - Analyze only the behavior occurring in the current window
   - Compare the start of the window (0s) to the end (10s) to determine immediate trends
   - Example: "Crowd density increased by 20% in the last 10 seconds"

2. VISUAL EVENT DETECTION:
   - Identify key entities: Individuals, distinct crowd clusters, and objects
   - Scan for anomalies: Running, falling, aggressive gestures, or formation of bottlenecks

3. SEVERITY SCORING (Real-Time):
   Assign a score (1-10) based strictly on the current 10-second observation:
   - Low (1-3): Steady flow, normal behavior
   - Medium (4-7): Sudden stops, loud gesturing, minor congestion
   - High (8-10): Violence, weapons, fire, or stampede dynamics

4. GEOMETRIC ZONE DIVISION:
   Divide the frame into a 3x2 GRID (6 FIXED ZONES):
   ┌─────────┬─────────┬─────────┐
   │ Zone A  │ Zone B  │ Zone C  │  ← Top Row
   ├─────────┼─────────┼─────────┤
   │ Zone D  │ Zone E  │ Zone F  │  ← Bottom Row
   └─────────┴─────────┴─────────┘
   
   - Zone A: Top-Left (0-33% width, 0-50% height)
   - Zone B: Top-Center (33-66% width, 0-50% height)
   - Zone C: Top-Right (66-100% width, 0-50% height)
   - Zone D: Bottom-Left (0-33% width, 50-100% height)
   - Zone E: Bottom-Center (33-66% width, 50-100% height)
   - Zone F: Bottom-Right (66-100% width, 50-100% height)

STRICT OUTPUT TEMPLATE - Respond ONLY with raw JSON (no markdown, no conversational text):
{
  "timestamp_window": "${timestamp_window}",
  "status": "NORMAL|CAUTION|CRITICAL",
  "severity_score": 1-10,
  "dashboard_ticker_text": "Max 15 words high-level summary",
  "security_log_details": "Max 50 words specific details on who, what, and where",
  "action_required": true|false,
  "zones": [
    {
      "zoneId": "zone-a|zone-b|zone-c|zone-d|zone-e|zone-f",
      "zoneName": "Zone A|Zone B|Zone C|Zone D|Zone E|Zone F",
      "crowdDensity": 0-100,
      "predictedDensity": 0-100,
      "peopleCount": estimated_number,
      "movementSpeed": "slow|moderate|fast",
      "congestionLevel": "normal|congested|bottleneck",
      "riskFactors": ["risk1", "risk2"]
    }
  ],
  "incidents": [
    {
      "type": "medical|security|fire|anomaly|congestion|smoke",
      "location": "zone_id",
      "severity": "low|medium|high|critical",
      "description": "What you observed",
      "confidence": 0.0-1.0,
      "requiresImmediate": true|false
    }
  ],
  "crowdDensity": 0-100,
  "anomalies": ["anomaly descriptions"],
  "summary": "Brief tactical summary for event commanders"
}

CRITICAL RULES:
- Output MUST be pure JSON (no \`\`\`json markers)
- Dashboard ticker text MUST be under 15 words
- Security log details MUST be under 50 words
- Analyze ALL 6 zones even if empty
- Base severity_score ONLY on this 10-second window`;

  try {
    console.log('🔬 Calling NVIDIA NIM API for video analysis (Drishti)...');
    
    const response = await fetch('https://ai.api.nvidia.com/v1/gr/meta/llama-3.2-neva-22b/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nvidiaApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.2-neva-22b',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: frameData
                }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA API error:', errorText);
      throw new Error(`NVIDIA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('✅ NVIDIA analysis received');

    // Parse JSON response
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanContent);

    // Add timestamp
    result.timestamp = Date.now();

    console.log('✅ NVIDIA video analysis completed');
    console.log(`   - Status: ${result.status}`);
    console.log(`   - Severity: ${result.severity_score}/10`);
    console.log(`   - Zones: ${result.zones?.length || 0}`);
    console.log(`   - Incidents: ${result.incidents?.length || 0}`);

    return result as VideoAnalysisResult;

  } catch (error) {
    console.error('❌ NVIDIA video analysis error:', error);
    throw error;
  }
}

/**
 * Get rate limiting stats
 */
export function getNvidiaStats() {
  const now = Date.now();
  const timeSinceLastCall = now - API_CALL_TRACKER.lastCallTime;
  const timeUntilNextCall = Math.max(0, MIN_API_CALL_INTERVAL - timeSinceLastCall);
  
  return {
    callsThisMinute: API_CALL_TRACKER.callCount,
    maxCallsPerMinute: MAX_CALLS_PER_MINUTE,
    timeUntilNextCall,
    canMakeCall: canMakeApiCall()
  };
}
