/**
 * Video Analysis Orchestrator
 * Coordinates video frame processing, AI analysis, zone updates, incident detection, and emergency responses
 */

import { getVideoFrameProcessor, VideoFrame } from './videoFrameProcessor';
import { VideoAnalysisResult, ZoneMetrics, DetectedIncident } from './geminiService';
import { Zone, Incident } from '../types';
import { 
  saveZones, 
  addIncident, 
  addAnnouncement, 
  saveVideoMetrics 
} from './firestoreService';

// 3-LAYER SMART FUNNEL IMPORTS
import { getMediaPipeDetectionService, DetectionResult } from './mediaPipeDetectionService';
import { getRateLimitedGeminiService, GeminiAnalysisResult } from './rateLimitedGeminiService';
import { getSpecialistAnalysisService } from './specialistAnalysisService';
import { generateAutomatedUpdatesWithGrok, shouldTriggerGrokAnalysis } from './grokAutomationService';
import { analyzeVideoFrameWithNvidia } from './nvidiaVideoAnalysisService';

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
  private previousAnalysis: VideoAnalysisResult | null = null; // For Grok trend analysis
  
  // 3-LAYER SMART FUNNEL SERVICES
  private mediaPipe = getMediaPipeDetectionService();
  private geminiLayer = getRateLimitedGeminiService();
  private specialistLayer = getSpecialistAnalysisService();

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

      // Step 1: Analyze frame with NVIDIA Vision AI (replaces Gemini)
      const analysis = await analyzeVideoFrameWithNvidia(frame.imageData);

      // Step 2: Use Grok for intelligent automation (incidents, announcements, bottlenecks, attendee count)
      if (shouldTriggerGrokAnalysis(analysis)) {
        console.log('🤖 Triggering Grok for intelligent automation...');
        const grokUpdates = await generateAutomatedUpdatesWithGrok(analysis, this.previousAnalysis || undefined);
        
        // Process Grok-enhanced incidents
        if (grokUpdates.enhancedIncidents.length > 0) {
          await this.processGrokEnhancedIncidents(grokUpdates.enhancedIncidents);
        }
        
        // Create Grok-suggested announcements
        if (grokUpdates.suggestedAnnouncements.length > 0) {
          await this.createGrokAnnouncements(grokUpdates.suggestedAnnouncements);
        }
        
        // Update bottleneck predictions
        if (grokUpdates.bottleneckPredictions.length > 0) {
          await this.updateBottleneckPredictions(grokUpdates.bottleneckPredictions);
        }
        
        // Update attendee count
        if (grokUpdates.attendeeEstimate > 0) {
          console.log(`👥 Grok attendee estimate: ${grokUpdates.attendeeEstimate}`);
          // This will be passed through callbacks
        }
      }

      // Step 3: Update zones based on AI analysis
      if (analysis.zones.length > 0) {
        await this.updateZonesFromAnalysis(analysis.zones);
      }

      // Step 4: Detect and log incidents (fallback if Grok not triggered)
      if (analysis.incidents.length > 0 && !shouldTriggerGrokAnalysis(analysis)) {
        await this.processDetectedIncidents(analysis.incidents);
      }

      // Step 5: Save video metrics to database
      await this.saveMetrics(analysis);

      // Step 6: Store for next analysis (Grok trend detection)
      this.previousAnalysis = analysis;

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
   * Process Grok-enhanced incidents with intelligent classification
   */
  private async processGrokEnhancedIncidents(enhancedIncidents: any[]): Promise<void> {
    for (const enhanced of enhancedIncidents) {
      const detected = enhanced.originalIncident;
      
      // Skip low confidence detections
      if (detected.confidence < 0.6) {
        console.log(`⚠️ Skipping low-confidence incident: ${detected.description} (${detected.confidence})`);
        continue;
      }

      // Create unique incident ID
      const incidentHash = `${detected.type}-${detected.location}-${detected.description.substring(0, 30)}`;
      
      // Prevent duplicate logging
      if (this.detectedIncidentIds.has(incidentHash)) {
        console.log(`⚠️ Duplicate incident detected, skipping: ${detected.description}`);
        continue;
      }

      this.detectedIncidentIds.add(incidentHash);

      // Create incident with Grok enhancements
      const incident: Incident = {
        id: `INC-GROK-${Date.now()}`,
        type: this.mapIncidentType(detected.type),
        location: detected.location,
        status: 'reported',
        priority: this.mapGrokSeverityToPriority(enhanced.enhancedSeverity),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description: `[GROK-ENHANCED] ${detected.description}\n\nRecommended Action: ${enhanced.recommendedAction}\nAssigned Teams: ${enhanced.assignedTeams.join(', ')}\nETA: ${enhanced.estimatedResponseTime}`
      };

      // Log incident to database
      await addIncident(incident);

      // Notify callback
      if (this.callbacks) {
        this.callbacks.onIncidentDetected(incident);
      }

      console.log(`🚨 GROK-ENHANCED INCIDENT: ${incident.id} - Urgency: ${enhanced.urgency}`);

      // Create announcement if Grok recommends it
      if (enhanced.publicAnnouncement) {
        await this.createEmergencyAnnouncement(detected, incident);
      }
    }

    // Cleanup old incident IDs after 5 minutes
    setTimeout(() => {
      enhancedIncidents.forEach(enhanced => {
        const detected = enhanced.originalIncident;
        const incidentHash = `${detected.type}-${detected.location}-${detected.description.substring(0, 30)}`;
        this.detectedIncidentIds.delete(incidentHash);
      });
    }, 5 * 60 * 1000);
  }

  /**
   * Create Grok-suggested announcements
   */
  private async createGrokAnnouncements(suggestions: any[]): Promise<void> {
    for (const suggestion of suggestions) {
      const announcement = {
        id: `ANN-GROK-${Date.now()}`,
        title: suggestion.title,
        content: suggestion.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        priority: suggestion.priority
      };

      await addAnnouncement(announcement);

      // Notify callback
      if (this.callbacks) {
        this.callbacks.onAnnouncementCreated(announcement.title, announcement.content, announcement.priority);
      }

      console.log(`📢 GROK-SUGGESTED ANNOUNCEMENT: ${announcement.title} (Priority: ${suggestion.priority})`);
      console.log(`   Target Zones: ${suggestion.targetZones.join(', ')}`);
      console.log(`   Reason: ${suggestion.reason}`);
    }
  }

  /**
   * Update bottleneck predictions from Grok
   */
  private async updateBottleneckPredictions(predictions: any[]): Promise<void> {
    console.log('📊 GROK BOTTLENECK PREDICTIONS:');
    for (const pred of predictions) {
      console.log(`   - ${pred.zoneName}: ${pred.currentDensity}% → ${pred.predictedDensity}% in ${pred.timeToBottleneck}`);
      console.log(`     Confidence: ${Math.round(pred.confidence * 100)}%`);
      console.log(`     Action: ${pred.suggestedAction}`);
      if (pred.alternativeRoutes.length > 0) {
        console.log(`     Alternative Routes: ${pred.alternativeRoutes.join(', ')}`);
      }
    }
    
    // Bottleneck data is stored in zones and can be used by UI components
    // No additional database storage needed - zones already contain predictedDensity
  }

  /**
   * Map Grok severity to priority
   */
  private mapGrokSeverityToPriority(severity: string): Incident['priority'] {
    switch (severity) {
      case 'critical':
        return 'high';
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
