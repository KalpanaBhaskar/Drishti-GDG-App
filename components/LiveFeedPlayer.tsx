import React, { useRef, useEffect, useState } from 'react';
import { Video, Youtube, Upload, Loader2, Play, Pause, Brain, Activity } from 'lucide-react';
import { getHybridVideoAnalysisOrchestrator, AnalysisState } from '../services/hybridVideoAnalysisOrchestrator';
import { Zone, Incident } from '../types';

interface LiveFeedPlayerProps {
  videoSource: {
    type: 'youtube' | 'local';
    url: string;
    fileName?: string;
  } | null;
  onZonesUpdated?: (zones: Zone[]) => void;
  onIncidentDetected?: (incident: Incident) => void;
  onAnnouncementCreated?: (title: string, content: string, priority: 'normal' | 'urgent') => void;
  onAnalysisStatusChange?: (isActive: boolean) => void;
  onAttendeeCountUpdate?: (count: number) => void;
  onAiSummaryUpdate?: (summary: string, timestamp: string) => void;
}

const LiveFeedPlayer: React.FC<LiveFeedPlayerProps> = ({ 
  videoSource, 
  onZonesUpdated,
  onIncidentDetected,
  onAnnouncementCreated,
  onAnalysisStatusChange,
  onAttendeeCountUpdate,
  onAiSummaryUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisState, setAnalysisState] = useState<AnalysisState | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('Waiting for AI analysis to begin...');
  const [summaryUpdateTime, setSummaryUpdateTime] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the hybrid orchestrator (fast initialization)
  useEffect(() => {
    const orchestrator = getHybridVideoAnalysisOrchestrator();
    orchestrator.initialize().then(() => {
      setIsInitialized(true);
      console.log('✅ Hybrid orchestrator core initialized for LiveFeedPlayer');
    }).catch(err => {
      console.error('❌ Failed to initialize orchestrator:', err);
      // Still allow the user to try - Layer 1 might work even if others fail
      setIsInitialized(true);
    });

    return () => {
      if (isAnalyzing) {
        orchestrator.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (videoSource?.type === 'local' && videoRef.current) {
      const video = videoRef.current;
      
      // Reset video state and trigger load
      video.load();
      
      // Add metadata loaded listener for debugging
      const handleMetadataLoaded = () => {
        console.log(`📹 Video metadata loaded: ${video.videoWidth}x${video.videoHeight}, duration: ${video.duration}s, readyState: ${video.readyState}`);
      };
      
      const handleCanPlay = () => {
        console.log(`▶️ Video can play: readyState ${video.readyState}`);
      };
      
      video.addEventListener('loadedmetadata', handleMetadataLoaded, { once: true });
      video.addEventListener('canplay', handleCanPlay, { once: true });
      
      // Cleanup
      return () => {
        video.removeEventListener('loadedmetadata', handleMetadataLoaded);
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [videoSource]);

  // Start video analysis with hybrid orchestrator
  const startAnalysis = () => {
    if (!videoRef.current || !overlayCanvasRef.current) {
      alert('Video not ready. Please wait for video to load.');
      return;
    }

    if (!isInitialized) {
      alert('MediaPipe is still loading. Please wait a moment and try again.');
      return;
    }

    // Different readiness checks for YouTube vs local videos
    if (videoSource?.type === 'youtube') {
      // YouTube videos in iframe cannot be analyzed directly due to CORS restrictions
      alert('AI Analysis is currently only available for local video uploads. YouTube analysis coming soon!');
      return;
    } 

    // For local videos - more robust readiness check
    if (videoSource?.type === 'local') {
      const video = videoRef.current;
      
      // Check if the video element has basic properties
      if (!video.src && !video.currentSrc) {
        alert('Video source not loaded. Please try again in a moment.');
        return;
      }

      // If metadata isn't ready yet, wait for it
      if (video.readyState < 2) {
        console.log('Waiting for video metadata to load...');
        
        const waitForMetadata = () => {
          if (video.readyState >= 2) {
            console.log('✅ Video metadata loaded, starting analysis');
            startAnalysisInternal();
          } else {
            alert('Video is still loading. Please wait a moment and try again.');
          }
        };

        // Listen for metadata load event
        video.addEventListener('loadedmetadata', waitForMetadata, { once: true });
        
        // Also try after a short delay (fallback)
        setTimeout(() => {
          if (video.readyState >= 2) {
            waitForMetadata();
          }
        }, 500);
        
        return;
      }
    }

    // If we reach here, video should be ready
    startAnalysisInternal();
  };

  const startAnalysisInternal = () => {
    if (!videoRef.current || !overlayCanvasRef.current) return;

    const video = videoRef.current;
    
    // Final safety check - ensure we can get video dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      // Try to trigger metadata load
      video.load();
      alert('Video dimensions not available yet. Please wait a moment and try again.');
      return;
    }

    // Ensure overlay canvas has proper dimensions
    overlayCanvasRef.current.width = video.videoWidth;
    overlayCanvasRef.current.height = video.videoHeight;
    
    console.log(`🎬 Starting analysis - Video: ${video.videoWidth}x${video.videoHeight}, Canvas: ${overlayCanvasRef.current.width}x${overlayCanvasRef.current.height}`);

    const orchestrator = getHybridVideoAnalysisOrchestrator();
    
    const handleEnded = () => {
      // Stop analysis automatically when the clip ends (common for short test videos)
      stopAnalysis();
    };

    videoRef.current.addEventListener('ended', handleEnded, { once: true });

    orchestrator.start(videoRef.current, overlayCanvasRef.current, (state: AnalysisState) => {
      setAnalysisState(state);
      
      // Update AI summary from Layer 2 (Gemini)
      if (state.layer2.description) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setAiSummary(state.layer2.description);
        setSummaryUpdateTime(timestamp);
        onAiSummaryUpdate?.(state.layer2.description, timestamp);
      }
      
      // Update attendee count from Layer 1 detections
      if (state.layer1.detectionCount > 0) {
        // Simulate attendee count based on detections (multiply by zone factor)
        const estimatedCount = state.layer1.detectionCount * 1000; // Each detection represents ~1000 people in venue
        onAttendeeCountUpdate?.(estimatedCount);
      }
    });

    setIsAnalyzing(true);
    onAnalysisStatusChange?.(true);
    console.log('▶️ Hybrid video analysis started');
  };

  // Stop video analysis
  const stopAnalysis = () => {
    if (!isAnalyzing) return;
    const orchestrator = getHybridVideoAnalysisOrchestrator();
    orchestrator.stop();
    setIsAnalyzing(false);
    onAnalysisStatusChange?.(false);
    console.log('⏹️ Hybrid video analysis stopped');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isAnalyzing) {
        stopAnalysis();
      }
    };
  }, [isAnalyzing]);

  if (!videoSource) {
    return (
      <div className="w-full h-full bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-12">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Video size={40} className="text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-300 mb-2">No Video Source</h3>
        <p className="text-sm text-slate-500 text-center max-w-md">
          Admin needs to upload a video or provide a YouTube link to enable live feed monitoring.
        </p>
      </div>
    );
  }

  if (videoSource.type === 'youtube') {
    // Extract YouTube video ID from various URL formats
    const getYouTubeId = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
    };

    const videoId = getYouTubeId(videoSource.url);

    if (!videoId) {
      return (
        <div className="w-full h-full bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-12">
          <Youtube size={40} className="text-red-500 mb-4" />
          <p className="text-sm text-red-400">Invalid YouTube URL</p>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Top Bar with Info */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-800">
          <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-white uppercase">Live Feed</span>
          </div>
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-300 font-medium">YouTube Source</p>
          </div>
        </div>

        {/* AI Summary Display - Prominent Section Above Video */}
        <div className="px-4 py-4 bg-gradient-to-r from-blue-950/60 to-slate-900/60 border-b border-blue-800/30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-600/30">
              <Brain className="text-blue-400" size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wide">Live AI Analysis Summary</h4>
                {summaryUpdateTime && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-400">Updated: {summaryUpdateTime}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{aiSummary}</p>
              {analysisState && analysisState.layer1.hasDetection && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-1 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 text-[10px] font-bold rounded">
                    👥 {analysisState.layer1.detectionCount} PERSON(S) DETECTED
                  </span>
                  <span className="px-2 py-1 bg-blue-600/20 border border-blue-600/30 text-blue-400 text-[10px] font-bold rounded">
                    CONFIDENCE: {(analysisState.layer1.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              {analysisState && analysisState.layer2.keywords.length > 0 && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold">KEYWORDS:</span>
                  {analysisState.layer2.keywords.slice(0, 5).map((keyword, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-blue-600/20 border border-blue-600/30 text-blue-400 text-[9px] font-bold rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
              {analysisState && analysisState.layer3.deepAnalysis && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-1 bg-purple-600/20 border border-purple-600/30 text-purple-400 text-[10px] font-bold rounded">
                    🔬 SPECIALIST ANALYSIS AVAILABLE
                  </span>
                </div>
              )}
              <p className="text-[10px] text-slate-500 mt-2 italic">
                3-Layer Smart Funnel: MediaPipe (30 FPS) → Gemini (Rate Limited) → NVIDIA/Grok (On-Demand)
              </p>
            </div>
          </div>
        </div>

        {/* AI Analysis Control Panel */}
        <div className="px-4 py-3 bg-slate-900/95 border-b border-slate-800">
          <div className="flex items-center justify-between gap-4">
            {/* Analysis Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={isAnalyzing ? stopAnalysis : startAnalysis}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg ${
                  isAnalyzing
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Pause size={16} />
                    Stop Analysis
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Start AI Analysis
                  </>
                )}
              </button>

              {isAnalyzing && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 border border-blue-600/30 rounded-lg">
                  <Brain className="text-blue-400 animate-pulse" size={16} />
                  <span className="text-xs font-bold text-blue-400">AI ANALYZING</span>
                </div>
              )}
            </div>

            {/* Stats Display */}
            {analysisState && (
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Frames Processed</p>
                  <p className="text-lg font-black text-white">{analysisState.stats.totalFramesProcessed}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Grok Calls</p>
                  <p className="text-lg font-black text-white">{analysisState.stats.grokCallsMade}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">NVIDIA Calls</p>
                  <p className="text-lg font-black text-white">{analysisState.stats.nvidiaCallsMade}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Auto Triggers</p>
                  <p className="text-lg font-black text-emerald-400">{analysisState.stats.autoTriggersDetected}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* YouTube Video Player */}
        <div className="flex-1 min-h-0 bg-black relative">
          <iframe
            ref={videoRef as any}
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&enablejsapi=1`}
            title="Live Video Feed"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    );
  }

  // Local video
  return (
    <div className="w-full h-full flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Top Bar with Info and Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-800">
        {/* Live Badge */}
        <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-white uppercase">Live Feed</span>
        </div>

        {/* File Name */}
        {videoSource.fileName && (
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-300 font-medium">{videoSource.fileName}</p>
          </div>
        )}
      </div>

      {/* AI Summary Display - Prominent Section Above Video */}
      <div className="px-4 py-4 bg-gradient-to-r from-blue-950/60 to-slate-900/60 border-b border-blue-800/30">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-600/30">
            <Brain className="text-blue-400" size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wide">Live AI Analysis Summary</h4>
              {summaryUpdateTime && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-slate-400">Updated: {summaryUpdateTime}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{aiSummary}</p>
            {analysisState && analysisState.layer1.hasDetection && (
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-1 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 text-[10px] font-bold rounded">
                  👥 {analysisState.layer1.detectionCount} PERSON(S) DETECTED
                </span>
                <span className="px-2 py-1 bg-blue-600/20 border border-blue-600/30 text-blue-400 text-[10px] font-bold rounded">
                  CONFIDENCE: {(analysisState.layer1.confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}
            {analysisState && analysisState.layer2.keywords.length > 0 && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold">KEYWORDS:</span>
                {analysisState.layer2.keywords.slice(0, 5).map((keyword, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-blue-600/20 border border-blue-600/30 text-blue-400 text-[9px] font-bold rounded">
                    {keyword}
                  </span>
                ))}
              </div>
            )}
            {analysisState && analysisState.layer3.deepAnalysis && (
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-1 bg-purple-600/20 border border-purple-600/30 text-purple-400 text-[10px] font-bold rounded">
                  🔬 SPECIALIST ANALYSIS AVAILABLE
                </span>
              </div>
            )}
            <p className="text-[10px] text-slate-500 mt-2 italic">
              3-Layer Smart Funnel: MediaPipe (30 FPS) → Gemini (Rate Limited) → NVIDIA/Grok (On-Demand)
            </p>
          </div>
        </div>
      </div>

      {/* AI Analysis Control Panel */}
      <div className="px-4 py-3 bg-slate-900/95 border-b border-slate-800">
        <div className="flex items-center justify-between gap-4">
          {/* Analysis Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={isAnalyzing ? stopAnalysis : startAnalysis}
              disabled={videoSource?.type === 'youtube'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg ${
                videoSource?.type === 'youtube'
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : isAnalyzing
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {videoSource?.type === 'youtube' ? (
                <>
                  <Brain size={16} />
                  Analysis Unavailable
                </>
              ) : isAnalyzing ? (
                <>
                  <Pause size={16} />
                  Stop Analysis
                </>
              ) : (
                <>
                  <Play size={16} />
                  Start AI Analysis
                </>
              )}
            </button>

            {videoSource?.type === 'youtube' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-600/20 border border-amber-600/30 rounded-lg">
                <span className="text-xs font-bold text-amber-400">🚧 Upload local video for AI analysis</span>
              </div>
            )}
            {isAnalyzing && videoSource?.type === 'local' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 border border-blue-600/30 rounded-lg">
                <Brain className="text-blue-400 animate-pulse" size={16} />
                <span className="text-xs font-bold text-blue-400">AI ANALYZING</span>
              </div>
            )}
          </div>

          {/* Stats Display */}
          {analysisState && (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Frames Processed</p>
                <p className="text-lg font-black text-white">{analysisState.stats.totalFramesProcessed}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Grok Calls</p>
                <p className="text-lg font-black text-white">{analysisState.stats.grokCallsMade}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">NVIDIA Calls</p>
                <p className="text-lg font-black text-white">{analysisState.stats.nvidiaCallsMade}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Auto Triggers</p>
                <p className="text-lg font-black text-emerald-400">{analysisState.stats.autoTriggersDetected}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Player with Detection Overlay */}
      <div className="flex-1 min-h-0 bg-black relative">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          autoPlay
          loop
          muted
        >
          <source src={videoSource.url} type="video/mp4" />
          <source src={videoSource.url} type="video/webm" />
          <source src={videoSource.url} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
        {/* MediaPipe Detection Overlay Canvas */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: 'screen' }}
        />
      </div>
    </div>
  );
};

export default LiveFeedPlayer;
