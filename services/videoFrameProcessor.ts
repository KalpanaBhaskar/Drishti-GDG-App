/**
 * Video Frame Processor Service
 * Extracts frames from video sources every 3 seconds for AI analysis
 */

export interface VideoFrame {
  imageData: string; // Base64 encoded image
  timestamp: number;
  frameNumber: number;
}

export class VideoFrameProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private videoElement: HTMLVideoElement | null = null;
  private processingInterval: NodeJS.Timeout | null = null;
  private frameCallback: ((frame: VideoFrame) => void) | null = null;
  private frameCount: number = 0;
  private isProcessing: boolean = false;

  constructor() {
    // Create offscreen canvas for frame extraction
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Initialize video processing from a video element
   */
  public attachVideo(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement;
    this.canvas.width = videoElement.videoWidth || 640;
    this.canvas.height = videoElement.videoHeight || 480;
  }

  /**
   * Start extracting frames every 3 seconds
   */
  public startProcessing(callback: (frame: VideoFrame) => void): void {
    if (this.isProcessing) {
      console.warn('Video processing already started');
      return;
    }

    this.frameCallback = callback;
    this.isProcessing = true;
    this.frameCount = 0;

    // Process frame immediately at 0s
    this.captureFrame();

    // OPTIMIZED: Process every 12 seconds to stay under 10 API calls/min
    // This gives 5 API calls per minute (0s, 12s, 24s, 36s, 48s)
    this.processingInterval = setInterval(() => {
      this.captureFrame();
    }, 12000);

    console.log('✅ Video frame processing started (every 12 seconds - optimized for API quota)');
  }

  /**
   * Stop frame extraction
   */
  public stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
    this.frameCallback = null;
    console.log('⏹️ Video frame processing stopped');
  }

  /**
   * Capture a single frame from the video
   */
  private captureFrame(): void {
    if (!this.videoElement || !this.frameCallback) {
      return;
    }

    // Check if video is ready
    if (this.videoElement.readyState < 2) {
      console.warn('Video not ready for frame capture');
      return;
    }

    try {
      // Update canvas size if video dimensions changed
      if (this.videoElement.videoWidth !== this.canvas.width) {
        this.canvas.width = this.videoElement.videoWidth;
        this.canvas.height = this.videoElement.videoHeight;
      }

      // Draw current video frame to canvas
      this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

      // Convert to base64 JPEG (compressed for API efficiency)
      const imageData = this.canvas.toDataURL('image/jpeg', 0.85);

      // Create frame object
      const frame: VideoFrame = {
        imageData,
        timestamp: Date.now(),
        frameNumber: this.frameCount++
      };

      // Send to callback
      this.frameCallback(frame);

      console.log(`📸 Frame ${frame.frameNumber} captured at ${new Date(frame.timestamp).toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
  }

  /**
   * Capture a single frame on demand (for testing)
   */
  public captureSingleFrame(): VideoFrame | null {
    if (!this.videoElement) {
      console.error('No video element attached');
      return null;
    }

    try {
      this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
      const imageData = this.canvas.toDataURL('image/jpeg', 0.85);
      
      return {
        imageData,
        timestamp: Date.now(),
        frameNumber: this.frameCount++
      };
    } catch (error) {
      console.error('Error capturing single frame:', error);
      return null;
    }
  }

  /**
   * Check if processing is active
   */
  public isActive(): boolean {
    return this.isProcessing;
  }

  /**
   * Get current frame count
   */
  public getFrameCount(): number {
    return this.frameCount;
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.stopProcessing();
    this.videoElement = null;
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}

// Singleton instance
let processorInstance: VideoFrameProcessor | null = null;

export function getVideoFrameProcessor(): VideoFrameProcessor {
  if (!processorInstance) {
    processorInstance = new VideoFrameProcessor();
  }
  return processorInstance;
}
