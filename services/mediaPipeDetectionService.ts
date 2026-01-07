/**
 * Layer 1: MediaPipe Local Detection Service (The Gatekeeper)
 * Runs on EVERY frame (30 FPS) to detect people/activity
 * Zero API cost - all processing happens locally
 */

import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

export interface DetectionResult {
  hasDetection: boolean;
  confidence: number;
  detectionCount: number;
  landmarks?: any[];
  timestamp: number;
}

export class MediaPipeDetectionService {
  private poseLandmarker: PoseLandmarker | null = null;
  private isInitialized: boolean = false;
  private detectionThreshold: number = 0.5; // Confidence threshold
  private lastDetectionTime: number = 0;

  /**
   * Initialize MediaPipe Pose Landmarker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚡ MediaPipe already initialized');
      return;
    }

    try {
      console.log('🔄 Initializing MediaPipe Pose Landmarker...');
      
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'
      );

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numPoses: 5, // Detect up to 5 people
        minPoseDetectionConfidence: this.detectionThreshold,
        minPosePresenceConfidence: this.detectionThreshold,
        minTrackingConfidence: this.detectionThreshold
      });

      this.isInitialized = true;
      console.log('✅ MediaPipe Pose Landmarker initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MediaPipe:', error);
      throw error;
    }
  }

  /**
   * Detect people/activity in a video frame
   * This runs on EVERY frame (30 FPS) - ultra fast, no API cost
   */
  detectInFrame(videoElement: HTMLVideoElement): DetectionResult {
    if (!this.isInitialized || !this.poseLandmarker) {
      console.warn('⚠️ MediaPipe not initialized');
      return {
        hasDetection: false,
        confidence: 0,
        detectionCount: 0,
        timestamp: Date.now()
      };
    }

    try {
      const timestamp = performance.now();
      const result = this.poseLandmarker.detectForVideo(videoElement, timestamp);

      const hasDetection = result.landmarks && result.landmarks.length > 0;
      const detectionCount = result.landmarks?.length || 0;
      
      // Calculate average confidence from world landmarks
      let avgConfidence = 0;
      if (result.worldLandmarks && result.worldLandmarks.length > 0) {
        const allLandmarks = result.worldLandmarks.flat();
        const visibleLandmarks = allLandmarks.filter((lm: any) => lm.visibility && lm.visibility > this.detectionThreshold);
        avgConfidence = visibleLandmarks.length > 0 
          ? visibleLandmarks.reduce((sum: number, lm: any) => sum + lm.visibility, 0) / visibleLandmarks.length 
          : 0;
      }

      if (hasDetection) {
        this.lastDetectionTime = Date.now();
      }

      return {
        hasDetection,
        confidence: avgConfidence,
        detectionCount,
        landmarks: result.landmarks,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ MediaPipe detection error:', error);
      return {
        hasDetection: false,
        confidence: 0,
        detectionCount: 0,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Draw detection landmarks on canvas (for visualization)
   */
  drawLandmarks(
    canvas: HTMLCanvasElement, 
    landmarks: any[], 
    videoWidth: number, 
    videoHeight: number
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || !landmarks || landmarks.length === 0) return;

    // Set canvas size to match video
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Draw each detected person
    landmarks.forEach((personLandmarks, index) => {
      // Draw skeleton connections
      ctx.strokeStyle = `hsl(${index * 60}, 100%, 50%)`;
      ctx.lineWidth = 2;

      // MediaPipe pose connections (simplified)
      const connections = [
        [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
        [11, 23], [12, 24], [23, 24], // Torso
        [23, 25], [25, 27], [24, 26], [26, 28] // Legs
      ];

      connections.forEach(([startIdx, endIdx]) => {
        const start = personLandmarks[startIdx];
        const end = personLandmarks[endIdx];
        if (start && end) {
          ctx.beginPath();
          ctx.moveTo(start.x * videoWidth, start.y * videoHeight);
          ctx.lineTo(end.x * videoWidth, end.y * videoHeight);
          ctx.stroke();
        }
      });

      // Draw key points
      ctx.fillStyle = `hsl(${index * 60}, 100%, 50%)`;
      personLandmarks.forEach((landmark: any) => {
        ctx.beginPath();
        ctx.arc(
          landmark.x * videoWidth,
          landmark.y * videoHeight,
          5,
          0,
          2 * Math.PI
        );
        ctx.fill();
      });
    });
  }

  /**
   * Get time since last detection (for throttling Layer 2)
   */
  getTimeSinceLastDetection(): number {
    return Date.now() - this.lastDetectionTime;
  }

  /**
   * Update detection threshold
   */
  setThreshold(threshold: number): void {
    this.detectionThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
    this.isInitialized = false;
    console.log('🧹 MediaPipe resources cleaned up');
  }
}

// Singleton instance
let detectionServiceInstance: MediaPipeDetectionService | null = null;

export function getMediaPipeDetectionService(): MediaPipeDetectionService {
  if (!detectionServiceInstance) {
    detectionServiceInstance = new MediaPipeDetectionService();
  }
  return detectionServiceInstance;
}
