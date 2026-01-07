/**
 * Layer 3: Specialist Analysis Service (The Expensive Cloud)
 * High-cost APIs: NVIDIA NIM or Grok (xAI)
 * Only triggered manually or by specific keywords from Layer 2
 */

export interface SpecialistAnalysisResult {
  provider: 'nvidia' | 'grok';
  deepAnalysis: string;
  confidence: number;
  detectedObjects?: string[];
  threats?: string[];
  recommendations?: string[];
  timestamp: number;
}

export class SpecialistAnalysisService {
  private nvidiaApiKey: string | null = null;
  private xaiApiKey: string | null = null;
  private isProcessing: boolean = false;

  constructor() {
    // Load API keys from environment
    this.nvidiaApiKey = import.meta.env.VITE_NVIDIA_API_KEY || null;
    this.xaiApiKey = import.meta.env.VITE_XAI_API_KEY || null;

    if (!this.nvidiaApiKey && !this.xaiApiKey) {
      console.warn('⚠️ No specialist API keys configured (NVIDIA or Grok)');
    }
  }

  /**
   * Check if specialist analysis is available
   */
  isAvailable(): boolean {
    return this.nvidiaApiKey !== null || this.xaiApiKey !== null;
  }

  /**
   * Analyze frame with NVIDIA NIM API
   * Using: nvidia/llama-3.2-neva-22b (vision model)
   * Enhanced with MediaPipe detection context from Layer 1
   */
  async analyzeWithNvidia(imageData: string, mediaPipeContext?: { detectionCount: number; confidence: number }): Promise<SpecialistAnalysisResult> {
    if (!this.nvidiaApiKey) {
      throw new Error('NVIDIA API key not configured');
    }

    if (this.isProcessing) {
      throw new Error('Specialist analysis already in progress');
    }

    this.isProcessing = true;

    try {
      console.log('🔬 Calling NVIDIA NIM API for deep analysis...');

      // Build context-aware prompt using MediaPipe detections
      let promptText = 'Perform a detailed security analysis of this image. ';
      if (mediaPipeContext && mediaPipeContext.detectionCount > 0) {
        promptText += `[CONTEXT: MediaPipe detected ${mediaPipeContext.detectionCount} person(s) with ${(mediaPipeContext.confidence * 100).toFixed(0)}% confidence] `;
      }
      promptText += 'Identify: 1) All people and objects, 2) Any potential threats or dangers, 3) Crowd density/behavior patterns, 4) Safety recommendations. Use the MediaPipe context to enhance your analysis.';

      const response = await fetch('https://ai.api.nvidia.com/v1/gr/meta/llama-3.2-neva-22b/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.nvidiaApiKey}`,
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
                  text: promptText
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
          max_tokens: 300,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`NVIDIA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const analysis = data.choices[0].message.content;

      console.log('✅ NVIDIA NIM analysis completed');

      return {
        provider: 'nvidia',
        deepAnalysis: analysis,
        confidence: 0.9,
        timestamp: Date.now(),
        detectedObjects: this.extractObjects(analysis),
        threats: this.extractThreats(analysis),
        recommendations: this.extractRecommendations(analysis)
      };

    } catch (error) {
      console.error('❌ NVIDIA NIM API error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Analyze frame with Grok (xAI) API
   * Using: grok-vision-beta
   * Enhanced with MediaPipe detection context from Layer 1
   */
  async analyzeWithGrok(imageData: string, mediaPipeContext?: { detectionCount: number; confidence: number }): Promise<SpecialistAnalysisResult> {
    if (!this.xaiApiKey) {
      throw new Error('Grok API key not configured');
    }

    if (this.isProcessing) {
      throw new Error('Specialist analysis already in progress');
    }

    this.isProcessing = true;

    try {
      console.log('🔬 Calling Grok API for deep analysis...');

      // Build context-aware prompt using MediaPipe detections
      let promptText = 'Perform a comprehensive security and safety analysis of this scene. ';
      if (mediaPipeContext && mediaPipeContext.detectionCount > 0) {
        promptText += `[CONTEXT: MediaPipe detected ${mediaPipeContext.detectionCount} person(s) with ${(mediaPipeContext.confidence * 100).toFixed(0)}% confidence] `;
      }
      promptText += 'Provide: 1) Detailed description of all visible elements, 2) Risk assessment based on crowd behavior, 3) Behavioral analysis, 4) Actionable safety recommendations. Use the MediaPipe context to refine your analysis.';

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.xaiApiKey}`,
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
                  text: promptText
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
          max_tokens: 350,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const analysis = data.choices[0].message.content;

      console.log('✅ Grok analysis completed');

      return {
        provider: 'grok',
        deepAnalysis: analysis,
        confidence: 0.95,
        timestamp: Date.now(),
        detectedObjects: this.extractObjects(analysis),
        threats: this.extractThreats(analysis),
        recommendations: this.extractRecommendations(analysis)
      };

    } catch (error) {
      console.error('❌ Grok API error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Auto-select best available specialist API
   */
  async analyzeFrame(
    imageData: string, 
    preferredProvider?: 'nvidia' | 'grok',
    mediaPipeContext?: { detectionCount: number; confidence: number }
  ): Promise<SpecialistAnalysisResult> {
    if (preferredProvider === 'nvidia' && this.nvidiaApiKey) {
      return this.analyzeWithNvidia(imageData, mediaPipeContext);
    }
    
    if (preferredProvider === 'grok' && this.xaiApiKey) {
      return this.analyzeWithGrok(imageData, mediaPipeContext);
    }

    // Fallback to any available
    if (this.xaiApiKey) {
      return this.analyzeWithGrok(imageData, mediaPipeContext);
    }
    
    if (this.nvidiaApiKey) {
      return this.analyzeWithNvidia(imageData, mediaPipeContext);
    }

    throw new Error('No specialist API available');
  }

  /**
   * Extract detected objects from analysis text
   */
  private extractObjects(text: string): string[] {
    const objects: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Common objects to look for
    const patterns = ['person', 'people', 'crowd', 'vehicle', 'bag', 'weapon', 
                     'fire', 'smoke', 'barrier', 'camera', 'door', 'exit'];
    
    patterns.forEach(pattern => {
      if (lowerText.includes(pattern)) {
        objects.push(pattern);
      }
    });

    return [...new Set(objects)]; // Remove duplicates
  }

  /**
   * Extract threats from analysis text
   */
  private extractThreats(text: string): string[] {
    const threats: string[] = [];
    const sentences = text.split(/[.!?]+/);
    
    const threatKeywords = ['danger', 'threat', 'risk', 'hazard', 'unsafe', 
                           'emergency', 'caution', 'warning', 'alert'];
    
    sentences.forEach(sentence => {
      const lower = sentence.toLowerCase();
      if (threatKeywords.some(keyword => lower.includes(keyword))) {
        threats.push(sentence.trim());
      }
    });

    return threats.slice(0, 5); // Max 5 threats
  }

  /**
   * Extract recommendations from analysis text
   */
  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const sentences = text.split(/[.!?]+/);
    
    const recKeywords = ['should', 'recommend', 'suggest', 'advise', 'ensure', 
                        'need to', 'must', 'consider', 'implement'];
    
    sentences.forEach(sentence => {
      const lower = sentence.toLowerCase();
      if (recKeywords.some(keyword => lower.includes(keyword))) {
        recommendations.push(sentence.trim());
      }
    });

    return recommendations.slice(0, 5); // Max 5 recommendations
  }

  /**
   * Check if specialist analysis should be auto-triggered
   * Based on keywords from Layer 2
   */
  shouldAutoTrigger(keywords: string[]): boolean {
    const criticalKeywords = ['danger', 'emergency', 'weapon', 'fire', 'threat'];
    return keywords.some(kw => criticalKeywords.includes(kw));
  }

  /**
   * Get processing status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      nvidiaAvailable: this.nvidiaApiKey !== null,
      grokAvailable: this.xaiApiKey !== null
    };
  }
}

// Singleton instance
let specialistServiceInstance: SpecialistAnalysisService | null = null;

export function getSpecialistAnalysisService(): SpecialistAnalysisService {
  if (!specialistServiceInstance) {
    specialistServiceInstance = new SpecialistAnalysisService();
  }
  return specialistServiceInstance;
}
