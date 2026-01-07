/**
 * Hybrid Ensemble Video Analysis Orchestrator
 * Three-layer "Smart Funnel" for cost-efficient computer vision
 * 
 * Layer 1: MediaPipe (Local, Every Frame, Zero Cost)
 * Layer 2: Gemini (Cloud, Rate Limited, Low Cost)
 * Layer 3: NVIDIA/Grok (Cloud, On-Demand, High Cost)
 */

import { 
  MediaPipeDetectionService, 
  getMediaPipeDetectionService,
  DetectionResult 
} from './mediaPipeDetectionService';
import {
  RateLimitedGeminiService,
  getRateLimitedGeminiService,
  GeminiAnalysisResult
} from './rateLimitedGeminiService';
import { 
  SpecialistAnalysisService,
  getSpecialistAnalysisService,
  SpecialistAnalysisResult
} from './specialistAnalysisService';

export interface AnalysisState {
  // Layer 1 (Real-time)
  layer1: {
    hasDetection: boolean;
    detectionCount: number;
    confidence: number;
    lastUpdate: number;
  };
  
  // Layer 2 (Throttled)
  layer2: {
    description: string;
    keywords: string[];
    lastUpdate: number;
    nextUpdateIn: number;
  };
  
  // Layer 3 (On-Demand)
  layer3: {
    deepAnalysis: string | null;
    threats: string[];
    recommendations: string[];
    lastUpdate: number | null;
    isProcessing: boolean;
  };

  // System stats
  stats: {
    totalFramesProcessed: number;
    grokCallsMade: number;
    nvidiaCallsMade: number;
    autoTriggersDetected: number;
  };
}

export class HybridVideoAnalysisOrchestrator {
  // Layer services
  private layer1: MediaPipeDetectionService;
  private layer2: RateLimitedGeminiService | null = null;
  private layer3: SpecialistAnalysisService | null = null;

  // Video elements
  private videoElement: HTMLVideoElement | null = null;
  private overlayCanvas: HTMLCanvasElement | null = null;

  // Processing state
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private targetFps: number = 30;

  // Analysis state
  private currentState: AnalysisState = {
    layer1: {
      hasDetection: false,
      detectionCount: 0,
      confidence: 0,
      lastUpdate: 0
    },
    layer2: {
      description: 'Initializing AI analysis...',
      keywords: [],
      lastUpdate: 0,
      nextUpdateIn: 0
    },
    layer3: {
      deepAnalysis: null,
      threats: [],
      recommendations: [],
      lastUpdate: null,
      isProcessing: false
    },
    stats: {
      totalFramesProcessed: 0,
      grokCallsMade: 0,
      nvidiaCallsMade: 0,
      autoTriggersDetected: 0
    }
  };

  // Callbacks
  private stateUpdateCallback: ((state: AnalysisState) => void) | null = null;

  // Layer 2 async queue (keep it small to avoid backlog on short videos)
  private layer2Queue: Array<{ imageData: string; frameNumber: number; detectionContext: any }> = [];
  private isProcessingLayer2: boolean = false;

  // Layer 2 cadence: run a summary every 10 seconds (Drishti batches)
  private layer2IntervalId: ReturnType<typeof setInterval> | null = null;

  // Last known detection context from Layer 1 (used to enrich Layer 2 prompts)
  private lastDetection: DetectionResult | null = null;

  constructor() {
    this.layer1 = getMediaPipeDetectionService();
    // Layer 2/3 are lazy-initialized in initialize() to avoid crashing the UI
    // when optional API keys are not configured.
  }

  /**
   * Initialize all layers (fast initialization - only Layer 1 is required)
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Hybrid Video Analysis System...');
    
    try {
      // Initialize Layer 1 (MediaPipe) - this is the only required layer for basic functionality
      await this.layer1.initialize();
      console.log('✅ Layer 1 (MediaPipe) ready - basic analysis can start');

      // Initialize Layer 2/3 in background (non-blocking)
      this.initializeOptionalLayersInBackground();

      console.log('🎉 Hybrid Video Analysis System core initialized - ready for analysis');
    } catch (error) {
      console.error('❌ Failed to initialize core analysis system:', error);
      throw error;
    }
  }

  /**
   * Initialize optional layers in background (non-blocking)
   */
  private async initializeOptionalLayersInBackground(): Promise<void> {
    // Initialize Layer 2 (Gemini) if available
    try {
      this.layer2 = getRateLimitedGeminiService();
      console.log('✅ Layer 2 (Gemini) ready');
      
      // Update UI to show Layer 2 is now available
      this.currentState.layer2.description = 'Gemini analysis ready - summaries will begin shortly...';
      if (this.stateUpdateCallback) {
        this.stateUpdateCallback(this.currentState);
      }
    } catch (e) {
      this.layer2 = null;
      console.log('⚠️ Layer 2 (Gemini) not configured - add VITE_GEMINI_API_KEY');
      this.currentState.layer2.description = 'Gemini analysis not configured (missing API key)';
      if (this.stateUpdateCallback) {
        this.stateUpdateCallback(this.currentState);
      }
    }

    // Initialize Layer 3 (Specialist) 
    try {
      this.layer3 = getSpecialistAnalysisService();
      if (this.layer3.isAvailable()) {
        console.log('✅ Layer 3 (NVIDIA Specialist) ready');
      } else {
        console.log('⚠️ Layer 3 (NVIDIA Specialist) not configured - add VITE_NVIDIA_API_KEY');
      }
    } catch (e) {
      this.layer3 = null;
      console.log('⚠️ Layer 3 (Specialist) initialization failed:', e);
    }
  }

  /**
   * Start video analysis pipeline
   */
  start(
    videoElement: HTMLVideoElement, 
    overlayCanvas: HTMLCanvasElement,
    onStateUpdate: (state: AnalysisState) => void
  ): void {
    if (this.isRunning) {
      console.warn('⚠️ Analysis already running');
      return;
    }

    this.videoElement = videoElement;
    this.overlayCanvas = overlayCanvas;
    this.stateUpdateCallback = onStateUpdate;
    this.isRunning = true;

    console.log('▶️ Starting hybrid video analysis...');

    // Start Layer 1 processing loop (30 FPS)
    this.processFrame();

    // Start Layer 2 async processor
    this.startLayer2Processor();

    // Start Layer 2 cadence: immediate summary + then every 10s
    this.startLayer2Scheduler();
  }

  /**
   * Stop video analysis pipeline
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.layer2IntervalId) {
      clearInterval(this.layer2IntervalId);
      this.layer2IntervalId = null;
    }

    // Clear any pending Layer 2 work
    this.layer2Queue = [];
    this.isProcessingLayer2 = false;

    // Update state so UI can reflect stopped status
    this.currentState.layer2.description = 'Analysis stopped.';
    this.currentState.layer2.keywords = [];
    this.currentState.layer2.lastUpdate = Date.now();
    this.currentState.layer2.nextUpdateIn = 0;
    this.currentState.layer3.isProcessing = false;

    if (this.stateUpdateCallback) {
      this.stateUpdateCallback(this.currentState);
    }

    console.log('⏹️ Hybrid video analysis stopped');
  }

  /**
   * Layer 1: Process every frame with MediaPipe (30 FPS)
   * This runs continuously and never blocks
   */
  private processFrame = (): void => {
    if (!this.isRunning || !this.videoElement) {
      return;
    }

    // Stop cleanly if video ended (prevents "stuck" UI on short clips)
    if (this.videoElement.ended) {
      console.log('🏁 Video ended - stopping analysis');
      this.stop();
      return;
    }

    const now = performance.now();
    const elapsed = now - this.lastFrameTime;
    const targetInterval = 1000 / this.targetFps;

    // Throttle to target FPS
    if (elapsed >= targetInterval) {
      this.lastFrameTime = now;

      // Layer 1: Local detection (ultra-fast, no API cost)
      const detection = this.layer1.detectInFrame(this.videoElement);
      this.lastDetection = detection;

      // Update state
      this.currentState.layer1 = {
        hasDetection: detection.hasDetection,
        detectionCount: detection.detectionCount,
        confidence: detection.confidence,
        lastUpdate: Date.now()
      };
      this.currentState.stats.totalFramesProcessed++;

      // Draw detection overlay
      if (this.overlayCanvas && detection.landmarks && detection.landmarks.length > 0) {
        this.layer1.drawLandmarks(
          this.overlayCanvas,
          detection.landmarks,
          this.videoElement.videoWidth,
          this.videoElement.videoHeight
        );
      } else if (this.overlayCanvas) {
        // Clear overlay if no detection
        const ctx = this.overlayCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        }
      }

      // Layer 2 scheduling is handled by a dedicated 10-second cadence timer.
      // (Avoids queue buildup/backlog and ensures summaries arrive on time.)

      // Update Layer 2 countdown
      if (this.layer2) {
        const grokStats = this.layer2.getStats();
        this.currentState.layer2.nextUpdateIn = Math.ceil(grokStats.timeUntilNextCall / 1000);
      } else {
        this.currentState.layer2.nextUpdateIn = 0;
      }

      // Notify state change
      if (this.stateUpdateCallback) {
        this.stateUpdateCallback(this.currentState);
      }
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.processFrame);
  };

  /**
   * Queue Grok analysis for Layer 2
   */
  private queueLayer2Analysis(detection: DetectionResult | null): void {
    if (!this.videoElement) return;

    // Do not enqueue if one is already queued/processing (prevents backlog)
    if (this.isProcessingLayer2 || this.layer2Queue.length > 0) {
      return;
    }

    // Capture frame as base64
    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.85);

    this.layer2Queue.push({
      imageData,
      frameNumber: this.currentState.stats.totalFramesProcessed,
      detectionContext: {
        detectionCount: detection?.detectionCount ?? 0,
        confidence: detection?.confidence ?? 0,
        hasDetection: detection?.hasDetection ?? false
      }
    });

    console.log(`📋 Queued Layer 2 (Gemini) analysis (Queue size: ${this.layer2Queue.length})`);
  }

  /**
   * Layer 2: Async Grok processor
   * Runs independently without blocking Layer 1
   */
  private async startLayer2Processor(): Promise<void> {
    while (this.isRunning) {
      if (!this.layer2) {
        // No Layer 2 configured; idle
      } else if (this.layer2Queue.length > 0 && !this.isProcessingLayer2) {
        this.isProcessingLayer2 = true;
        const task = this.layer2Queue.shift()!;

        try {
          const result = await this.layer2!.analyzeFrame(
            task.imageData,
            task.frameNumber,
            task.detectionContext
          );

          // If analysis was stopped while we were awaiting, ignore late results
          if (!this.isRunning) {
            return;
          }

          // Update state
          this.currentState.layer2 = {
            description: result.description,
            keywords: result.keywords,
            lastUpdate: result.timestamp,
            nextUpdateIn: Math.ceil(this.layer2!.getStats().timeUntilNextCall / 1000)
          };

          if (result.triggerReason === 'detection_triggered') {
            this.currentState.stats.grokCallsMade++;
          }

          // Auto-trigger Layer 3 if critical keywords detected
          if (this.layer3 && this.layer3.shouldAutoTrigger(result.keywords)) {
            console.log('🚨 Auto-triggering Layer 3 (NVIDIA Specialist) due to keywords:', result.keywords);
            this.currentState.stats.autoTriggersDetected++;
            this.triggerSpecialistAnalysis(task.imageData, 'auto', 'nvidia');
          }

          // Notify state change
          if (this.stateUpdateCallback) {
            this.stateUpdateCallback(this.currentState);
          }

        } catch (error) {
          console.error('❌ Layer 2 (Gemini) processing error:', error);
        } finally {
          this.isProcessingLayer2 = false;
        }
      }

      // Wait before checking queue again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Layer 2: 10-second scheduler
   * Ensures summaries arrive on time even for short videos.
   */
  private startLayer2Scheduler(): void {
    if (!this.layer2) {
      return;
    }

    // Kick off immediately (fast first summary)
    this.tryQueueLayer2Work();

    // Then on a strict 10-second cadence
    this.layer2IntervalId = setInterval(() => {
      this.tryQueueLayer2Work();
    }, 10000);
  }

  private tryQueueLayer2Work(): void {
    if (!this.isRunning || !this.videoElement || !this.layer2) return;
    if (this.videoElement.ended) return;

    // Only queue if the rate limiter allows it
    if (!this.layer2.canMakeCall()) {
      const grokStats = this.layer2.getStats();
      this.currentState.layer2.nextUpdateIn = Math.ceil(grokStats.timeUntilNextCall / 1000);
      return;
    }

    this.queueLayer2Analysis(this.lastDetection);
  }

  /**
   * Layer 3: Trigger specialist analysis (manual or auto)
   */
  async triggerSpecialistAnalysis(
    imageData?: string, 
    trigger: 'manual' | 'auto' = 'manual',
    provider?: 'nvidia' | 'grok'
  ): Promise<void> {
    if (this.currentState.layer3.isProcessing) {
      console.warn('⚠️ Specialist analysis already in progress');
      return;
    }

    if (!this.layer3 || !this.layer3.isAvailable()) {
      console.error('❌ NVIDIA specialist API not configured');
      return;
    }

    // If no image provided, capture current frame
    if (!imageData && this.videoElement) {
      const canvas = document.createElement('canvas');
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
        imageData = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    if (!imageData) {
      console.error('❌ No image data for specialist analysis');
      return;
    }

    this.currentState.layer3.isProcessing = true;
    if (this.stateUpdateCallback) {
      this.stateUpdateCallback(this.currentState);
    }

    try {
      console.log(`🔬 Triggering Layer 3 (${trigger}) analysis...`);
      
      // Pass MediaPipe context from Layer 1 to Layer 3 for enhanced analysis
      const mediaPipeContext = {
        detectionCount: this.currentState.layer1.detectionCount,
        confidence: this.currentState.layer1.confidence
      };
      
      const result = await this.layer3!.analyzeFrame(imageData, provider, mediaPipeContext);

      this.currentState.layer3 = {
        deepAnalysis: result.deepAnalysis,
        threats: result.threats || [],
        recommendations: result.recommendations || [],
        lastUpdate: result.timestamp,
        isProcessing: false
      };

      this.currentState.stats.nvidiaCallsMade++;

      console.log(`✅ Layer 3 (NVIDIA) analysis completed`);

      if (this.stateUpdateCallback) {
        this.stateUpdateCallback(this.currentState);
      }

    } catch (error) {
      console.error('❌ NVIDIA specialist analysis error:', error);
      this.currentState.layer3.isProcessing = false;
      if (this.stateUpdateCallback) {
        this.stateUpdateCallback(this.currentState);
      }
    }
  }

  /**
   * Get current analysis state
   */
  getState(): AnalysisState {
    return this.currentState;
  }

  /**
   * Check if system is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stop();
    this.layer1.dispose();
    console.log('🧹 Hybrid analysis system disposed');
  }
}

// Singleton instance
let orchestratorInstance: HybridVideoAnalysisOrchestrator | null = null;

export function getHybridVideoAnalysisOrchestrator(): HybridVideoAnalysisOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new HybridVideoAnalysisOrchestrator();
  }
  return orchestratorInstance;
}
