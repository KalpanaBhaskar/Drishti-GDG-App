
import { GoogleGenAI } from "@google/genai";
import { Zone, Incident } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('⚠️ VITE_GEMINI_API_KEY not found in environment variables');
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Types for video analysis
export interface VideoAnalysisResult {
  zones: ZoneMetrics[];
  incidents: DetectedIncident[];
  crowdDensity: number;
  anomalies: string[];
  summary: string;
  timestamp: number;
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
 * Analyze video frame using Gemini 2.5 Flash with vision capabilities
 * This function now combines frame analysis + live summary in ONE API call (every 5 seconds)
 */
export async function analyzeVideoFrame(frameData: string): Promise<VideoAnalysisResult> {
  const prompt = `You are analyzing a live video feed from a large public event (Mumbai Music Festival 2024).
  
  CRITICAL: Divide the video frame into a 3x2 GRID (3 columns × 2 rows) to create 6 FIXED ZONES:
  
  GEOMETRIC SEGMENTATION:
  ┌─────────┬─────────┬─────────┐
  │ Zone A  │ Zone B  │ Zone C  │  ← Row 1 (Top)
  │ (Left)  │(Center) │ (Right) │
  ├─────────┼─────────┼─────────┤
  │ Zone D  │ Zone E  │ Zone F  │  ← Row 2 (Bottom)
  │ (Left)  │(Center) │ (Right) │
  └─────────┴─────────┴─────────┘
  
  ZONE MAPPING (Geometrically divide the frame):
  - Zone A: Top-Left third of frame (columns 0-33%, rows 0-50%)
  - Zone B: Top-Center third of frame (columns 33-66%, rows 0-50%)
  - Zone C: Top-Right third of frame (columns 66-100%, rows 0-50%)
  - Zone D: Bottom-Left third of frame (columns 0-33%, rows 50-100%)
  - Zone E: Bottom-Center third of frame (columns 33-66%, rows 50-100%)
  - Zone F: Bottom-Right third of frame (columns 66-100%, rows 50-100%)
  
  Analyze this frame and provide:
  
  1. ZONE ANALYSIS: For EACH of the 6 zones based on geometric segmentation, estimate crowd density (0-100%):
  
  2. INCIDENT DETECTION: Identify any safety concerns:
     - Medical emergencies (people collapsed, distress signals)
     - Fire or smoke
     - Overcrowding/crushing/stampede risks
     - Security threats (fights, suspicious activity)
     - Infrastructure issues
  
  3. CROWD METRICS:
     - Estimate total visible people
     - Assess crowd movement (static, slow, moderate, fast)
     - Identify bottlenecks or congestion points
  
  4. RISK ASSESSMENT: Flag any immediate dangers requiring emergency response
  
  IMPORTANT: Analyze ALL 6 zones, even if some appear empty or not visible in frame.
  
  Respond in this EXACT JSON format (no markdown, just pure JSON):
  {
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
    "summary": "Brief tactical summary: Overall status, key risks, bottlenecks, and immediate recommendations for event commanders."
  }
  
  Make the summary comprehensive and actionable - it will be used as the live situational update.`;

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
 */
export async function chatWithDrishti(
  userMessage: string, 
  zones: Zone[], 
  incidents: Incident[], 
  conversationHistory: Array<{role: 'user' | 'assistant', message: string}>
): Promise<string> {
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
1. ONLY answer questions about THIS CROWD EVENT (Mumbai Music Festival 2024)
2. ONLY discuss: crowd density, zones A-F, incidents, safety, bottlenecks, event status
3. DO NOT answer general questions, unrelated topics, or anything outside event scope
4. If question is unrelated, politely redirect: "I can only answer questions about the current event crowd status and safety."
5. Keep responses concise and data-focused
6. Reference specific zone data when relevant

Provide a helpful answer ONLY if it relates to the crowd event.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.4,
        systemInstruction: "You are Project Drishti's AI assistant for crowd safety at Mumbai Music Festival 2024. ONLY answer questions about crowd density, zones A-F, incidents, safety, and event status. REFUSE to answer unrelated questions politely. Be concise and professional.",
      },
    });
    
    return response.text || "I'm having trouble processing your question right now.";
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm experiencing connectivity issues. Please try again.";
  }
}

export async function getEmergencyResources(lat: number, lng: number) {
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
