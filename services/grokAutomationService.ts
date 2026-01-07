/**
 * Grok Automation Service
 * Uses Grok API for automatic updates: bottleneck graphs, announcements, incidents, attendee count
 * This handles all the automated intelligence updates based on video analysis
 */

import { VideoAnalysisResult } from './geminiService';

/**
 * Process video analysis result with Grok to generate automated updates
 * This includes: incident classification, announcement generation, bottleneck predictions
 */
export async function generateAutomatedUpdatesWithGrok(
  analysisResult: VideoAnalysisResult,
  previousAnalysis?: VideoAnalysisResult
): Promise<{
  enhancedIncidents: any[];
  suggestedAnnouncements: any[];
  bottleneckPredictions: any[];
  attendeeEstimate: number;
  riskAssessment: string;
}> {
  const grokApiKey = import.meta.env.VITE_XAI_API_KEY;
  if (!grokApiKey) {
    console.warn('⚠️ Grok API key not configured. Falling back to basic processing.');
    return fallbackProcessing(analysisResult);
  }

  try {
    console.log('🤖 Calling Grok API for automated intelligence updates...');

    const prompt = `You are an intelligent automation assistant for the Drishti event monitoring system.

CONTEXT:
You will receive video analysis data and must generate automated updates for:
1. Enhanced incident classification and prioritization
2. Intelligent announcement suggestions
3. Bottleneck predictions and trend analysis
4. Accurate attendee count estimation
5. Overall risk assessment

CURRENT ANALYSIS DATA:
${JSON.stringify(analysisResult, null, 2)}

${previousAnalysis ? `PREVIOUS ANALYSIS (for trend detection):
${JSON.stringify(previousAnalysis, null, 2)}` : ''}

YOUR TASKS:

1. INCIDENT ENHANCEMENT:
   - Classify each incident by severity and urgency
   - Add context and recommended actions
   - Determine if immediate response is needed
   - Assign appropriate emergency teams

2. ANNOUNCEMENT GENERATION:
   - Create public-friendly announcements for critical situations
   - Keep announcements clear, calm, and actionable
   - Prioritize by urgency (normal/urgent)
   - Avoid causing panic while maintaining safety

3. BOTTLENECK PREDICTION:
   - Analyze zone densities and movement patterns
   - Predict which zones will become bottlenecks in next 5-10 minutes
   - Suggest crowd redistribution strategies
   - Identify evacuation route concerns

4. ATTENDEE ESTIMATION:
   - Calculate total attendee count from zone data
   - Apply realistic variance (±50 people)
   - Consider zone overlap and movement

5. RISK ASSESSMENT:
   - Overall event risk level (LOW/MEDIUM/HIGH/CRITICAL)
   - Key risk factors and mitigation strategies
   - Predicted issues in next 10-15 minutes

OUTPUT FORMAT (strict JSON):
{
  "enhancedIncidents": [
    {
      "originalIncident": {...},
      "enhancedSeverity": "low|medium|high|critical",
      "urgency": "immediate|high|medium|low",
      "recommendedAction": "specific action description",
      "assignedTeams": ["medical", "security", "fire"],
      "estimatedResponseTime": "2 minutes",
      "publicAnnouncement": "should this trigger public announcement? true/false"
    }
  ],
  "suggestedAnnouncements": [
    {
      "title": "Short title",
      "content": "Clear, actionable message for attendees",
      "priority": "normal|urgent",
      "targetZones": ["zone-a", "zone-b"],
      "reason": "Why this announcement is needed"
    }
  ],
  "bottleneckPredictions": [
    {
      "zoneId": "zone-x",
      "zoneName": "Zone X",
      "currentDensity": 75,
      "predictedDensity": 95,
      "timeToBottleneck": "8 minutes",
      "confidence": 0.85,
      "suggestedAction": "Redirect traffic to Zone Y",
      "alternativeRoutes": ["via Zone Z"]
    }
  ],
  "attendeeEstimate": {
    "totalCount": 1250,
    "confidence": 0.9,
    "breakdown": {
      "zone-a": 200,
      "zone-b": 300,
      ...
    }
  },
  "riskAssessment": {
    "overallRisk": "LOW|MEDIUM|HIGH|CRITICAL",
    "riskFactors": ["factor 1", "factor 2"],
    "mitigationStrategies": ["strategy 1", "strategy 2"],
    "predictedIssues": ["issue 1 in 10 min"],
    "staffingRecommendations": "Deploy 2 more security to Zone A"
  }
}

IMPORTANT:
- Output MUST be pure JSON (no markdown)
- Be concise but comprehensive
- Focus on actionable intelligence
- Consider public safety as top priority
- Maintain calm and professional tone in announcements`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grokApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: 'You are an AI automation assistant for event safety monitoring. Generate structured intelligence updates in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Grok API error:', errorText);
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON response
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanContent);

    console.log('✅ Grok automated updates generated');
    console.log(`   - Enhanced incidents: ${result.enhancedIncidents?.length || 0}`);
    console.log(`   - Suggested announcements: ${result.suggestedAnnouncements?.length || 0}`);
    console.log(`   - Bottleneck predictions: ${result.bottleneckPredictions?.length || 0}`);
    console.log(`   - Attendee estimate: ${result.attendeeEstimate?.totalCount || 0}`);
    console.log(`   - Overall risk: ${result.riskAssessment?.overallRisk || 'UNKNOWN'}`);

    return {
      enhancedIncidents: result.enhancedIncidents || [],
      suggestedAnnouncements: result.suggestedAnnouncements || [],
      bottleneckPredictions: result.bottleneckPredictions || [],
      attendeeEstimate: result.attendeeEstimate?.totalCount || calculateBasicAttendeeCount(analysisResult),
      riskAssessment: result.riskAssessment?.overallRisk || 'MEDIUM'
    };

  } catch (error) {
    console.error('❌ Grok automation error:', error);
    console.log('⚠️ Falling back to basic processing');
    return fallbackProcessing(analysisResult);
  }
}

/**
 * Fallback processing when Grok API is unavailable
 */
function fallbackProcessing(analysisResult: VideoAnalysisResult) {
  return {
    enhancedIncidents: analysisResult.incidents?.map(inc => ({
      originalIncident: inc,
      enhancedSeverity: inc.severity,
      urgency: inc.requiresImmediate ? 'immediate' : 'medium',
      recommendedAction: `Respond to ${inc.type} incident at ${inc.location}`,
      assignedTeams: [inc.type === 'medical' ? 'medical' : 'security'],
      estimatedResponseTime: '5 minutes',
      publicAnnouncement: inc.requiresImmediate
    })) || [],
    suggestedAnnouncements: [],
    bottleneckPredictions: analysisResult.zones?.filter(z => z.crowdDensity > 80).map(z => ({
      zoneId: z.zoneId,
      zoneName: z.zoneName,
      currentDensity: z.crowdDensity,
      predictedDensity: z.predictedDensity,
      timeToBottleneck: '10 minutes',
      confidence: 0.7,
      suggestedAction: 'Monitor closely',
      alternativeRoutes: []
    })) || [],
    attendeeEstimate: calculateBasicAttendeeCount(analysisResult),
    riskAssessment: analysisResult.crowdDensity > 80 ? 'HIGH' : analysisResult.crowdDensity > 60 ? 'MEDIUM' : 'LOW'
  };
}

/**
 * Calculate basic attendee count from zones
 */
function calculateBasicAttendeeCount(analysisResult: VideoAnalysisResult): number {
  if (!analysisResult.zones || analysisResult.zones.length === 0) {
    return 0;
  }
  
  const totalPeople = analysisResult.zones.reduce((sum, z) => sum + z.peopleCount, 0);
  // Add random variation of ±50 people
  const variation = Math.floor(Math.random() * 101) - 50;
  return Math.max(0, totalPeople + variation);
}

/**
 * Quick check for critical situations that need immediate Grok analysis
 */
export function shouldTriggerGrokAnalysis(analysisResult: VideoAnalysisResult): boolean {
  // Trigger Grok for:
  // 1. Any incidents detected
  if (analysisResult.incidents && analysisResult.incidents.length > 0) {
    return true;
  }
  
  // 2. High crowd density
  if (analysisResult.crowdDensity > 80) {
    return true;
  }
  
  // 3. Anomalies detected
  if (analysisResult.anomalies && analysisResult.anomalies.length > 0) {
    return true;
  }
  
  // 4. Critical status
  if (analysisResult.status === 'CRITICAL') {
    return true;
  }
  
  // 5. Action required flag
  if (analysisResult.action_required) {
    return true;
  }
  
  return false;
}
