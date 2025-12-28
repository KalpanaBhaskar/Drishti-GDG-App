/**
 * Video Analysis Orchestrator
 * Coordinates video frame processing, AI analysis, zone updates, incident detection, and emergency responses
 */

import { getVideoFrameProcessor, VideoFrame } from './videoFrameProcessor';
import { analyzeVideoFrame, VideoAnalysisResult, ZoneMetrics, DetectedIncident } from './geminiService';
import { Zone, Incident } from '../types';
import { 
  saveZones, 
  addIncident, 
  addAnnouncement, 
  saveVideoMetrics 
} from './firestoreService';

export interface VideoAnalysisCallbacks {
  onZonesUpdated: (zones: Zone[]) => void;
  onIncidentDetected: (incident: Incident) => void;
  onAnnouncementCreated: (title: string, content: string, priority: 'normal' | 'urgent') => void;
  onAnalysisComplete: (result: VideoAnalysisResult) => void;
}

export class VideoAnalysisOrchestrator {
  private frameProcessor = getVideoFrameProcessor();
  private callbacks: VideoAnalysisCallbacks | null = null;
  private isRunning = false;
  private lastAnalysisTime = 0;
  private analysisCount = 0;
  private detectedIncidentIds = new Set<string>(); // Prevent duplicate incidents

  /**
   * Start the complete video analysis pipeline
   */
  public start(videoElement: HTMLVideoElement, callbacks: VideoAnalysisCallbacks): void {
    if (this.isRunning) {
      console.warn('Video analysis already running');
      return;
    }

    this.callbacks = callbacks;
    this.isRunning = true;
    this.analysisCount = 0;
    this.detectedIncidentIds.clear();

    // Attach video to frame processor
    this.frameProcessor.attachVideo(videoElement);

    // Start processing frames every 3 seconds
    this.frameProcessor.startProcessing(async (frame: VideoFrame) => {
      await this.processFrame(frame);
    });

    console.log('🚀 Video Analysis Orchestrator started');
  }

  /**
   * Stop the video analysis pipeline
   */
  public stop(): void {
    this.frameProcessor.stopProcessing();
    this.isRunning = false;
    this.callbacks = null;
    console.log('⏹️ Video Analysis Orchestrator stopped');
  }

  /**
   * Process a single video frame through the AI pipeline
   */
  private async processFrame(frame: VideoFrame): Promise<void> {
    if (!this.callbacks) return;

    try {
      this.analysisCount++;
      this.lastAnalysisTime = frame.timestamp;

      console.log(`\n🔍 Analyzing frame ${frame.frameNumber} (Analysis #${this.analysisCount})...`);

      // Step 1: Analyze frame with Gemini Vision AI
      const analysis = await analyzeVideoFrame(frame.imageData);

      // Step 2: Update zones based on AI analysis
      if (analysis.zones.length > 0) {
        await this.updateZonesFromAnalysis(analysis.zones);
      }

      // Step 3: Detect and log incidents automatically (only if abnormality observed)
      if (analysis.incidents.length > 0) {
        await this.processDetectedIncidents(analysis.incidents);
      }

      // Step 4: Update bottleneck graphs from AI analysis
      await this.updateBottleneckGraphs(analysis);

      // Step 5: Auto-create announcements if critical info needs public dispatch
      await this.createAutoAnnouncement(analysis);

      // Step 6: Save video metrics to database
      await this.saveMetrics(analysis);

      // Step 7: Notify callbacks
      this.callbacks.onAnalysisComplete(analysis);

      console.log(`✅ Frame ${frame.frameNumber} analysis complete`);
      console.log(`   - Zones analyzed: ${analysis.zones.length}`);
      console.log(`   - Incidents detected: ${analysis.incidents.length}`);
      console.log(`   - Overall crowd density: ${analysis.crowdDensity}%`);

    } catch (error) {
      console.error('Error processing frame:', error);
    }
  }

  /**
   * Update zones based on AI analysis
   */
  private async updateZonesFromAnalysis(zoneMetrics: ZoneMetrics[]): Promise<void> {
    const updatedZones: Zone[] = zoneMetrics.map(zm => ({
      id: zm.zoneId,
      name: zm.zoneName,
      density: zm.crowdDensity,
      predictedDensity: zm.predictedDensity,
      status: zm.congestionLevel
    }));

    // Save to Firestore
    await saveZones(updatedZones);

    // Notify callback
    if (this.callbacks) {
      this.callbacks.onZonesUpdated(updatedZones);
    }

    console.log('📍 Zones updated from video analysis');
  }

  /**
   * Process AI analysis results to update bottleneck graphs
   */
  private async updateBottleneckGraphs(analysis: VideoAnalysisResult): Promise<void> {
    // The zones from analysis already contain current density and predicted density
    // These are automatically saved to Firebase via saveZones()
    // Bottleneck graphs will read from zones state which is updated via Firebase listener
    
    console.log('📊 Bottleneck data updated from AI analysis');
  }

  /**
   * Auto-create announcements based on critical information from AI
   */
  private async createAutoAnnouncement(analysis: VideoAnalysisResult): Promise<void> {
    // Check if there's critical information that needs public announcement
    const criticalZones = analysis.zones.filter(z => z.crowdDensity >= 85 || z.congestionLevel === 'bottleneck');
    const highRiskFactors = analysis.zones.filter(z => z.riskFactors.length > 0);
    
    if (criticalZones.length > 0) {
      const zoneNames = criticalZones.map(z => z.zoneName).join(', ');
      const announcement = {
        id: `ANN-AI-${Date.now()}`,
        title: '⚠️ Crowd Alert',
        content: `High crowd density detected in ${zoneNames}. Please use alternative routes and follow crowd control measures for your safety.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        priority: 'urgent' as const
      };
      
      await addAnnouncement(announcement);
      console.log('📢 AUTO-ANNOUNCEMENT: Critical crowd density alert');
    }
    
    // Check for general safety information that needs announcement
    if (analysis.anomalies.length > 0 && !analysis.incidents.some(i => i.requiresImmediate)) {
      const announcement = {
        id: `ANN-AI-${Date.now()}`,
        title: 'ℹ️ Safety Update',
        content: `${analysis.anomalies[0]}. Please stay alert and follow staff guidance.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        priority: 'normal' as const
      };
      
      await addAnnouncement(announcement);
      console.log('📢 AUTO-ANNOUNCEMENT: Safety information dispatched');
    }
  }

  /**
   * Process detected incidents and create automatic logs
   */
  private async processDetectedIncidents(detectedIncidents: DetectedIncident[]): Promise<void> {
    for (const detected of detectedIncidents) {
      // Skip low confidence detections
      if (detected.confidence < 0.6) {
        console.log(`⚠️ Skipping low-confidence incident: ${detected.description} (${detected.confidence})`);
        continue;
      }

      // Create unique incident ID based on type and location
      const incidentHash = `${detected.type}-${detected.location}-${detected.description.substring(0, 30)}`;
      
      // Prevent duplicate logging within short time window
      if (this.detectedIncidentIds.has(incidentHash)) {
        console.log(`⚠️ Duplicate incident detected, skipping: ${detected.description}`);
        continue;
      }

      this.detectedIncidentIds.add(incidentHash);

      // Create incident object
      const incident: Incident = {
        id: `INC-AUTO-${Date.now()}`,
        type: this.mapIncidentType(detected.type),
        location: detected.location,
        status: 'reported',
        priority: this.mapSeverityToPriority(detected.severity),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description: `[AUTO-DETECTED] ${detected.description} (Confidence: ${Math.round(detected.confidence * 100)}%)`
      };

      // Log incident to database
      await addIncident(incident);

      // Notify callback
      if (this.callbacks) {
        this.callbacks.onIncidentDetected(incident);
      }

      console.log(`🚨 AUTO-LOGGED INCIDENT: ${incident.id} - ${detected.type} at ${detected.location}`);

      // Step: Create automatic emergency announcement for critical incidents
      if (detected.requiresImmediate || detected.severity === 'critical') {
        await this.createEmergencyAnnouncement(detected, incident);
      }
    }

    // Clean up old incident IDs after 5 minutes to allow re-detection
    setTimeout(() => {
      detectedIncidents.forEach(detected => {
        const incidentHash = `${detected.type}-${detected.location}-${detected.description.substring(0, 30)}`;
        this.detectedIncidentIds.delete(incidentHash);
      });
    }, 5 * 60 * 1000);
  }

  /**
   * Create automatic emergency announcement for critical incidents
   */
  private async createEmergencyAnnouncement(detected: DetectedIncident, incident: Incident): Promise<void> {
    let title = '';
    let content = '';
    const priority: 'urgent' = 'urgent';

    switch (detected.type) {
      case 'fire':
        title = '🔥 EMERGENCY: Fire Detected';
        content = `Fire detected in ${detected.location}. Please evacuate the area immediately and follow staff instructions. Emergency services have been notified.`;
        break;

      case 'smoke':
        title = '⚠️ ALERT: Smoke Detected';
        content = `Smoke detected in ${detected.location}. Please remain calm and be prepared to evacuate if instructed. Safety teams are investigating.`;
        break;

      case 'medical':
        title = '🚑 Medical Emergency';
        content = `Medical emergency in ${detected.location}. Medical teams are responding. Please give way to emergency personnel.`;
        break;

      case 'congestion':
        title = '⚠️ Crowd Alert';
        content = `Critical congestion detected in ${detected.location}. Please use alternative routes and follow crowd control measures.`;
        break;

      case 'security':
        title = '🔒 Security Alert';
        content = `Security incident in ${detected.location}. Please remain calm and follow instructions from security personnel.`;
        break;

      default:
        title = '⚠️ Safety Alert';
        content = `Anomaly detected in ${detected.location}. ${detected.description}. Please stay alert and follow staff guidance.`;
    }

    // Add incident reference
    content += ` [Incident ID: ${incident.id}]`;

    // Create announcement
    const announcement = {
      id: `ANN-AUTO-${Date.now()}`,
      title,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority
    };

    await addAnnouncement(announcement);

    // Notify callback
    if (this.callbacks) {
      this.callbacks.onAnnouncementCreated(title, content, priority);
    }

    console.log(`📢 AUTOMATIC ANNOUNCEMENT CREATED: ${title}`);
  }

  /**
   * Save video metrics to database
   */
  private async saveMetrics(analysis: VideoAnalysisResult): Promise<void> {
    const metrics = {
      timestamp: new Date().toISOString(),
      totalPeople: analysis.zones.reduce((sum, z) => sum + z.peopleCount, 0),
      crowdDensity: analysis.crowdDensity,
      avgMovementSpeed: 1.5, // Placeholder - can be enhanced
      anomalyDetections: analysis.incidents.length,
      zoneId: 'all'
    };

    await saveVideoMetrics(metrics);
  }

  /**
   * Map detected incident type to app incident type
   */
  private mapIncidentType(type: DetectedIncident['type']): Incident['type'] {
    switch (type) {
      case 'medical':
        return 'medical';
      case 'fire':
      case 'smoke':
        return 'fire';
      case 'security':
      case 'congestion':
        return 'security';
      default:
        return 'anomaly';
    }
  }

  /**
   * Map severity to priority
   */
  private mapSeverityToPriority(severity: DetectedIncident['severity']): Incident['priority'] {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
      default:
        return 'low';
    }
  }

  /**
   * Get statistics
   */
  public getStats() {
    return {
      isRunning: this.isRunning,
      analysisCount: this.analysisCount,
      lastAnalysisTime: this.lastAnalysisTime,
      frameCount: this.frameProcessor.getFrameCount()
    };
  }
}

// Singleton instance
let orchestratorInstance: VideoAnalysisOrchestrator | null = null;

export function getVideoAnalysisOrchestrator(): VideoAnalysisOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new VideoAnalysisOrchestrator();
  }
  return orchestratorInstance;
}
