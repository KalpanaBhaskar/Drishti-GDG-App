/**
 * Layer 2: Rate-Limited Gemini Service (The General Analyst)
 * Strict rate limiting: <10 calls per minute
 * Only called when Layer 1 detects activity AND time threshold met
 */

import { GoogleGenAI } from '@google/genai';

export interface GeminiAnalysisResult {
  description: string;
  timestamp: number;
  frameNumber: number;
  triggerReason: string;
  keywords: string[]; // For Layer 3 triggering
}

export class RateLimitedGeminiService {
  private ai: GoogleGenAI;
  private lastCallTime: number = 0;
  private callCount: number = 0;
  private callHistory: number[] = []; // Timestamps of calls in last minute
  private minIntervalMs: number = 7000; // 7 seconds minimum between calls
  private maxCallsPerMinute: number = 8; // Conservative limit
  private isProcessing: boolean = false;
  private currentDescription: string = 'Waiting for initial analysis...';

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
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
    this.callHistory = this.callHistory.filter(timestamp => now - timestamp < 60000);

    // Check if we're under the per-minute limit
    if (this.callHistory.length >= this.maxCallsPerMinute) {
      return false;
    }

    // Check if already processing
    if (this.isProcessing) {
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
    this.callHistory = this.callHistory.filter(timestamp => now - timestamp < 60000);
    if (this.callHistory.length >= this.maxCallsPerMinute) {
      const oldestCall = Math.min(...this.callHistory);
      return 60000 - (now - oldestCall);
    }

    return 0;
  }

  /**
   * Analyze frame with Gemini (async, non-blocking)
   */
  async analyzeFrame(
    imageData: string, 
    frameNumber: number,
    detectionContext?: { detectionCount: number; confidence: number }
  ): Promise<GeminiAnalysisResult> {
    if (!this.canMakeCall()) {
      const waitTime = Math.ceil(this.getTimeUntilNextCall() / 1000);
      console.log(`⏳ Rate limit: Wait ${waitTime}s before next Gemini call`);
      
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
      console.log(`🤖 Calling Gemini API (Frame ${frameNumber})...`);

      // Build context-aware prompt
      let prompt = 'Describe the action in this frame briefly (1-2 sentences). ';
      if (detectionContext) {
        prompt += `${detectionContext.detectionCount} person(s) detected. `;
      }
      prompt += 'If you see any potential danger, start with "DANGER:" or "ALERT:".';

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageData.split(',')[1] // Remove data:image/jpeg;base64, prefix
                }
              }
            ]
          }
        ],
        config: {
          temperature: 0.4,
        }
      });

      const description = response.text || '';
      const keywords = this.extractKeywords(description);
      
      // Update state
      this.currentDescription = description;
      this.lastCallTime = Date.now();
      this.callHistory.push(this.lastCallTime);
      this.callCount++;

      const duration = Date.now() - startTime;
      console.log(`✅ Gemini response (${duration}ms): ${description.substring(0, 80)}...`);

      return {
        description,
        timestamp: this.lastCallTime,
        frameNumber,
        triggerReason: 'detection_triggered',
        keywords
      };

    } catch (error: any) {
      console.error('❌ Gemini API error:', error);

      // Handle 429 Rate Limit
      if (error?.message?.includes('429')) {
        console.warn('⚠️ Gemini rate limit hit - backing off');
        this.lastCallTime = Date.now() + 10000; // Add 10s penalty
      }

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
    const triggerWords = ['danger', 'alert', 'emergency', 'fire', 'weapon', 'fight', 
                          'injured', 'medical', 'suspicious', 'unknown', 'threat'];
    const lowerText = text.toLowerCase();
    return triggerWords.filter(word => lowerText.includes(word));
  }

  /**
   * Get current cached description (for overlay display)
   */
  getCurrentDescription(): string {
    return this.currentDescription;
  }

  /**
   * Get rate limit statistics
   */
  getStats() {
    const now = Date.now();
    this.callHistory = this.callHistory.filter(timestamp => now - timestamp < 60000);
    
    return {
      totalCalls: this.callCount,
      callsInLastMinute: this.callHistory.length,
      timeSinceLastCall: now - this.lastCallTime,
      canMakeCall: this.canMakeCall(),
      timeUntilNextCall: this.getTimeUntilNextCall(),
      isProcessing: this.isProcessing
    };
  }

  /**
   * Reset rate limiter (for testing)
   */
  reset(): void {
    this.lastCallTime = 0;
    this.callHistory = [];
    this.isProcessing = false;
  }
}

// Singleton instance
let geminiServiceInstance: RateLimitedGeminiService | null = null;

export function getRateLimitedGeminiService(): RateLimitedGeminiService {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY not found in environment variables');
  }
  
  if (!geminiServiceInstance) {
    geminiServiceInstance = new RateLimitedGeminiService(apiKey);
  }
  return geminiServiceInstance;
}
