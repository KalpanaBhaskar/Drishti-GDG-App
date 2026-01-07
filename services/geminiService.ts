
import { GoogleGenAI } from "@google/genai";
import { Zone, Incident } from "../types";

const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('⚠️ VITE_GEMINI_API_KEY not found in environment variables');
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// RATE LIMITING: Track API calls to prevent quota exhaustion
const API_CALL_TRACKER = {
  lastCallTime: 0,
  callCount: 0,
  resetTime: Date.now()
};

// OPTIMIZED: Enforce minimum 10 second gap between API calls (Drishti 10-second batches)
const MIN_API_CALL_INTERVAL = 10000; // 10 seconds
const MAX_CALLS_PER_MINUTE = 6; // Maximum 6 calls per minute (one every 10 seconds)

function canMakeApiCall(): boolean {
  const now = Date.now();
  
  // Reset counter every minute
  if (now - API_CALL_TRACKER.resetTime > 60000) {
    API_CALL_TRACKER.callCount = 0;
    API_CALL_TRACKER.resetTime = now;
  }
  
  // Check if we've exceeded per-minute limit
  if (API_CALL_TRACKER.callCount >= MAX_CALLS_PER_MINUTE) {
    console.warn('⚠️ Gemini API rate limit reached (5/min). Skipping call.');
    return false;
  }
  
  // Check if enough time passed since last call
  const timeSinceLastCall = now - API_CALL_TRACKER.lastCallTime;
  if (timeSinceLastCall < MIN_API_CALL_INTERVAL) {
    console.warn(`⚠️ Gemini API called too soon (${timeSinceLastCall}ms < 10s). Skipping.`);
    return false;
  }
  
  return true;
}

function recordApiCall(): void {
  API_CALL_TRACKER.lastCallTime = Date.now();
  API_CALL_TRACKER.callCount++;
  console.log(`📡 Gemini API call ${API_CALL_TRACKER.callCount}/6 this minute (Drishti 10-second batch)`);
}

// Types for video analysis
export interface VideoAnalysisResult {
  zones: ZoneMetrics[];
  incidents: DetectedIncident[];
  crowdDensity: number;
  anomalies: string[];
  summary: string;
  timestamp: number;
  // Drishti Live Intelligence Engine fields
  timestamp_window?: string;
  status?: 'NORMAL' | 'CAUTION' | 'CRITICAL';
  severity_score?: number; // 1-10
  dashboard_ticker_text?: string;
  security_log_details?: string;
  action_required?: boolean;
}

export interface ZoneMetrics {
  zoneId: string;
  zoneName: string;
  crowdDensity: number; // 0-100
  predictedDensity: number; // 0-100
  peopleCount: number;
  movementSpeed: string; // 'slow', 'moderate', 'fast'
  congestionLevel: 'normal' | 'congested' | 'bottleneck';
  riskFactors: string[];
}

export interface DetectedIncident {
  type: 'medical' | 'security' | 'fire' | 'anomaly' | 'congestion' | 'smoke';
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number; // 0-1
  requiresImmediate: boolean;
}

/**
 * @deprecated This function is NO LONGER USED for video analysis
 * Video analysis now uses NVIDIA API (see nvidiaVideoAnalysisService.ts)
 * This function remains for backward compatibility only
 * 
 * Analyze video frame using Gemini 2.5 Flash with vision capabilities
 * "DRISHTI" LIVE INTELLIGENCE ENGINE
 * Processes incoming video data in 10-second batches for real-time safety monitoring
 */
export async function analyzeVideoFrame(frameData: string): Promise<VideoAnalysisResult> {
  // RATE LIMITING: Check if we can make this API call
  if (!canMakeApiCall()) {
    throw new Error('RATE_LIMIT: API call blocked to prevent quota exhaustion');
  }
  
  recordApiCall(); // Track this API call
  
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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { 
              inlineData: {
                mimeType: "image/jpeg",
                data: frameData.split(',')[1] // Remove data:image/jpeg;base64, prefix
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.3, // Lower temperature for more consistent analysis
        systemInstruction: "You are Project Drishti's vision AI, specialized in crowd safety analysis at large public events. Be precise, objective, and prioritize safety.",
      },
    });

    const text = response.text || "{}";
    
    // Extract JSON from response (in case there's markdown formatting)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const analysis: VideoAnalysisResult = JSON.parse(jsonText);
    analysis.timestamp = Date.now();
    
    console.log('✅ Video frame analyzed successfully:', analysis.summary);
    
    return analysis;
  } catch (error) {
    console.error("Video analysis error:", error);
    
    // Return safe default analysis
    return {
      zones: [],
      incidents: [],
      crowdDensity: 50,
      anomalies: [],
      summary: "Unable to analyze frame. Video processing temporarily unavailable.",
      timestamp: Date.now()
    };
  }
}

/**
 * Get live situational summary - called every 5 seconds
 */
export async function getSituationalSummary(zones: Zone[], incidents: Incident[], query?: string) {
  const context = `
    Current Event: Mumbai Music Festival 2024
    Zones: ${JSON.stringify(zones)}
    Active Incidents: ${JSON.stringify(incidents)}
  `;

  const prompt = query 
    ? `Based on the following event data, answer this commander query: "${query}". \nData: ${context}`
    : `Generate a concise, professional, actionable situational summary for an event commander. Focus on risks, bottlenecks, and incident status. Data: ${context}`;

  // RATE LIMITING: Check if we can make this API call
  if (!canMakeApiCall()) {
    return 'Summary temporarily unavailable due to API rate limiting. Please wait a moment.';
  }
  
  recordApiCall(); // Track this API call

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Project Drishti, a high-level security AI agent for major public events. Provide expert, brief, and tactical advice. Format with Markdown.",
      },
    });
    return response.text || "Unable to generate summary at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Intelligence feed currently unavailable.";
  }
}

/**
 * Chatbot for answering user questions about the event
 * STRICTLY RESTRICTED to crowd event details only
 * Uses global rate limiter - no user-specific limits
 */
export async function chatWithDrishti(
  userMessage: string, 
  zones: Zone[], 
  incidents: Incident[], 
  conversationHistory: Array<{role: 'user' | 'assistant', message: string}>
): Promise<string> {
  // RATE LIMITING: Check if we can make this API call (global rate limiter)
  if (!canMakeApiCall()) {
    return 'API rate limit reached. Please wait a moment before sending another message. This limit applies across all users to prevent quota exhaustion.';
  }
  
  const context = `
    Current Event Status:
    - Event: Mumbai Music Festival 2024
    - Active Zones: ${zones.map(z => `${z.name} (${z.density.toFixed(1)}% density)`).join(', ')}
    - Active Incidents: ${incidents.filter(i => i.status !== 'resolved').length}
    - Critical Zones: ${zones.filter(z => z.density >= 80).map(z => z.name).join(', ') || 'None'}
    - Total Zones: 6 fixed zones (A through F)
  `;

  const conversationContext = conversationHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Drishti'}: ${msg.message}`)
    .join('\n');

  const prompt = `${context}

Conversation History:
${conversationContext}

User Question: ${userMessage}

STRICT INSTRUCTIONS:
1. ONLY answer questions about THIS CROWD EVENT 
2. ONLY discuss: crowd density, zones A-F, incidents, safety, bottlenecks, event status
3. DO NOT answer general questions, unrelated topics, or anything outside event scope
4. If question is unrelated, politely redirect: "I can only answer questions about the current event crowd status and safety."
5. Keep responses concise and data-focused
6. Reference specific zone data when relevant

Provide a helpful answer ONLY if it relates to the crowd event.`;

  recordApiCall(); // Track this API call

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.4,
        systemInstruction: "You are Project Drishti's AI assistant for crowd safety at a large public event. ONLY answer questions about crowd density, zones A-F, incidents, safety, and event status. REFUSE to answer unrelated questions politely. Be concise and professional.",
      },
    });
    
    return response.text || "I'm having trouble processing your question right now.";
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm experiencing connectivity issues. Please try again.";
  }
}

export async function getEmergencyResources(lat: number, lng: number) {
  // RATE LIMITING: Check if we can make this API call
  if (!canMakeApiCall()) {
    return { 
      text: 'Emergency resource search temporarily rate-limited. Showing fallback emergency contacts.', 
      sources: [] 
    };
  }
  
  recordApiCall(); // Track this API call
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find the nearest police stations and medical first aid centers near my location. Prioritize those with the fastest access to a large public event venue.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });
    
    const text = response.text || "Searching for nearest emergency units...";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { text, sources };
  } catch (error) {
    console.error("Maps Grounding Error:", error);
    return { text: "Error locating nearby resources. Falling back to internal security dispatch.", sources: [] };
  }
}
