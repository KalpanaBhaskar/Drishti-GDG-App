import React, { useRef, useEffect, useState } from 'react';
import { Video, Youtube, Upload, Loader2, Play, Pause, Brain, Activity } from 'lucide-react';
import { getVideoAnalysisOrchestrator } from '../services/videoAnalysisOrchestrator';
import { VideoAnalysisResult } from '../services/geminiService';
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
}

const LiveFeedPlayer: React.FC<LiveFeedPlayerProps> = ({ 
  videoSource, 
  onZonesUpdated,
  onIncidentDetected,
  onAnnouncementCreated,
  onAnalysisStatusChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStats, setAnalysisStats] = useState({
    analysisCount: 0,
    frameCount: 0,
    lastAnalysis: ''
  });
  const [latestAnalysis, setLatestAnalysis] = useState<VideoAnalysisResult | null>(null);

  useEffect(() => {
    if (videoSource?.type === 'local' && videoRef.current) {
      videoRef.current.load();
    }
  }, [videoSource]);

  // Start video analysis
  const startAnalysis = () => {
    if (!videoRef.current) {
      alert('Video not ready. Please wait for video to load.');
      return;
    }

    const orchestrator = getVideoAnalysisOrchestrator();
    
    orchestrator.start(videoRef.current, {
      onZonesUpdated: (zones) => {
        console.log('✅ Zones updated:', zones);
        onZonesUpdated?.(zones);
      },
      onIncidentDetected: (incident) => {
        console.log('🚨 Incident detected:', incident);
        onIncidentDetected?.(incident);
      },
      onAnnouncementCreated: (title, content, priority) => {
        console.log('📢 Announcement created:', title);
        onAnnouncementCreated?.(title, content, priority);
      },
      onAnalysisComplete: (result) => {
        setLatestAnalysis(result);
        const stats = orchestrator.getStats();
        setAnalysisStats({
          analysisCount: stats.analysisCount,
          frameCount: stats.frameCount,
          lastAnalysis: new Date(stats.lastAnalysisTime).toLocaleTimeString()
        });
      }
    });

    setIsAnalyzing(true);
    onAnalysisStatusChange?.(true);
  };

  // Stop video analysis
  const stopAnalysis = () => {
    const orchestrator = getVideoAnalysisOrchestrator();
    orchestrator.stop();
    setIsAnalyzing(false);
    onAnalysisStatusChange?.(false);
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
      <div className="w-full h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative">
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-white uppercase">Live Feed</span>
        </div>
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`}
          title="Live Video Feed"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
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
          {analysisStats.analysisCount > 0 && (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Frames Analyzed</p>
                <p className="text-lg font-black text-white">{analysisStats.frameCount}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">AI Cycles</p>
                <p className="text-lg font-black text-white">{analysisStats.analysisCount}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Last Update</p>
                <p className="text-sm font-bold text-emerald-400">{analysisStats.lastAnalysis || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Latest Analysis Summary */}
        {latestAnalysis && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            <div className="flex items-start gap-3">
              <Activity className="text-blue-400 mt-0.5" size={16} />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 mb-1">Latest AI Summary:</p>
                <p className="text-xs text-slate-300 leading-relaxed">{latestAnalysis.summary}</p>
                {latestAnalysis.incidents.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-red-600/20 border border-red-600/30 text-red-400 text-[10px] font-bold rounded">
                      {latestAnalysis.incidents.length} INCIDENT(S) DETECTED
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Player */}
      <div className="flex-1 min-h-0 bg-black">
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
      </div>
    </div>
  );
};

export default LiveFeedPlayer;
