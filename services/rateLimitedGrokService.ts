/**
 * Layer 2: Rate-Limited Grok Service (The General Analyst)
 * Strict rate limiting: <10 calls per minute
 * Only called when Layer 1 detects activity AND time threshold met
 */

export interface GrokAnalysisResult {
  description: string;
  timestamp: number;
  frameNumber: number;
  triggerReason: string;
  keywords: string[]; // For Layer 3 triggering
}

export class RateLimitedGrokService {
  private apiKey: string;
  private lastCallTime: number = 0;
  private callCount: number = 0;
  private callHistory: number[] = []; // Timestamps of calls in last minute
  private minIntervalMs: number = 7000; // 7 seconds minimum between calls
  private maxCallsPerMinute: number = 8; // Conservative limit
  private isProcessing: boolean = false;
  private currentDescription: string = 'Waiting for initial analysis...';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Check if we can make an API call (rate limiting logic)
   */
  canMakeCall(): boolean {
    const now = Date.now();
    
    // Check minimum interval
    if (now - this.lastCallTime < this.minIntervalMs) {
      return false;
    }

    // Clean up call history (remove calls older than 1 minute)
    this.callHistory = this.callHistory.filter(time => now - time < 60000);

    // Check if we've hit the per-minute limit
    if (this.callHistory.length >= this.maxCallsPerMinute) {
      return false;
    }

    return true;
  }

  /**
   * Get time until next call is allowed
   */
  getTimeUntilNextCall(): number {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.minIntervalMs) {
      return this.minIntervalMs - timeSinceLastCall;
    }

    // Check per-minute limit
    const oldestCall = this.callHistory[0];
    if (this.callHistory.length >= this.maxCallsPerMinute && oldestCall) {
      const timeUntilOldestExpires = 60000 - (now - oldestCall);
      return Math.max(0, timeUntilOldestExpires);
    }

    return 0;
  }

  /**
   * Analyze frame with Grok (async, non-blocking)
   */
  async analyzeFrame(
    imageData: string, 
    frameNumber: number,
    detectionContext?: { detectionCount: number; confidence: number }
  ): Promise<GrokAnalysisResult> {
    if (!this.canMakeCall()) {
      const waitTime = Math.ceil(this.getTimeUntilNextCall() / 1000);
      console.log(`⏳ Rate limit: Wait ${waitTime}s before next Grok call`);
      
      // Return cached description
      return {
        description: this.currentDescription,
        timestamp: Date.now(),
        frameNumber,
        triggerReason: 'rate_limited',
        keywords: []
      };
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      console.log(`🤖 Calling Grok API (Frame ${frameNumber})...`);

      // Build context-aware prompt
      let prompt = 'Describe the action in this frame briefly (1-2 sentences). ';
      if (detectionContext) {
        prompt += `MediaPipe detected ${detectionContext.detectionCount} person(s) with ${(detectionContext.confidence * 100).toFixed(0)}% confidence. `;
      }
      prompt += 'Focus on crowd behavior, safety concerns, and activity. If you see any potential danger, mention it clearly.';

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-vision-beta',
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
                    url: imageData
                  }
                }
              ]
            }
          ],
          max_tokens: 100,
          temperature: 0.4
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const description = data.choices[0].message.content;
      const keywords = this.extractKeywords(description);
      
      // Update state
      this.currentDescription = description;
      this.lastCallTime = Date.now();
      this.callHistory.push(this.lastCallTime);
      this.callCount++;

      const duration = Date.now() - startTime;
      console.log(`✅ Grok response (${duration}ms): ${description.substring(0, 80)}...`);

      return {
        description,
        timestamp: this.lastCallTime,
        frameNumber,
        triggerReason: 'detection_triggered',
        keywords
      };

    } catch (error) {
      console.error('❌ Grok API error:', error);
      
      // Return cached description on error
      return {
        description: this.currentDescription || 'Analysis temporarily unavailable',
        timestamp: Date.now(),
        frameNumber,
        triggerReason: 'error',
        keywords: []
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Extract keywords for Layer 3 triggering
   */
  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Critical keywords that trigger Layer 3
    const criticalPatterns = ['danger', 'emergency', 'weapon', 'fire', 'threat', 'panic', 'stampede', 'fight', 'violence'];
    
    // Safety-related keywords
    const safetyPatterns = ['crowd', 'congestion', 'bottleneck', 'medical', 'injury', 'fall', 'security'];
    
    criticalPatterns.forEach(pattern => {
      if (lowerText.includes(pattern)) {
        keywords.push(pattern);
      }
    });
    
    safetyPatterns.forEach(pattern => {
      if (lowerText.includes(pattern)) {
        keywords.push(pattern);
      }
    });
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      totalCallsMade: this.callCount,
      callsInLastMinute: this.callHistory.length,
      timeUntilNextCall: this.getTimeUntilNextCall(),
      isProcessing: this.isProcessing,
      currentDescription: this.currentDescription
    };
  }

  /**
   * Check if currently processing
   */
  isActive(): boolean {
    return this.isProcessing;
  }
}

// Singleton instance
let grokServiceInstance: RateLimitedGrokService | null = null;

export function getRateLimitedGrokService(): RateLimitedGrokService {
  const apiKey = import.meta.env.VITE_XAI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_XAI_API_KEY not found in environment variables');
  }
  
  if (!grokServiceInstance) {
    grokServiceInstance = new RateLimitedGrokService(apiKey);
  }
  return grokServiceInstance;
}
