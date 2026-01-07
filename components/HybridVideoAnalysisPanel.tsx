/**
 * Hybrid Video Analysis Panel
 * UI for the 3-layer Smart Funnel analysis system
 */

import React, { useEffect, useState, useRef } from 'react';
import { 
  HybridVideoAnalysisOrchestrator, 
  getHybridVideoAnalysisOrchestrator,
  AnalysisState 
} from '../services/hybridVideoAnalysisOrchestrator';
import { Activity, Brain, Zap, AlertTriangle, TrendingUp, Eye } from 'lucide-react';

interface HybridVideoAnalysisPanelProps {
  videoElement: HTMLVideoElement | null;
  isVideoPlaying: boolean;
}

export const HybridVideoAnalysisPanel: React.FC<HybridVideoAnalysisPanelProps> = ({ 
  videoElement, 
  isVideoPlaying 
}) => {
  const [orchestrator] = useState(() => getHybridVideoAnalysisOrchestrator());
  const [analysisState, setAnalysisState] = useState<AnalysisState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAnalysisActive, setIsAnalysisActive] = useState(false);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [specialistProvider, setSpecialistProvider] = useState<'nvidia' | 'grok'>('nvidia');

  // Initialize orchestrator
  useEffect(() => {
    const init = async () => {
      try {
        await orchestrator.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize orchestrator:', error);
      }
    };
    init();

    return () => {
      orchestrator.dispose();
    };
  }, [orchestrator]);

  // Start/stop analysis based on video state
  useEffect(() => {
    if (!isInitialized || !videoElement || !overlayCanvasRef.current) {
      return;
    }

    if (isVideoPlaying && !isAnalysisActive) {
      // Start analysis
      orchestrator.start(videoElement, overlayCanvasRef.current, (state) => {
        setAnalysisState(state);
      });
      setIsAnalysisActive(true);
    } else if (!isVideoPlaying && isAnalysisActive) {
      // Stop analysis
      orchestrator.stop();
      setIsAnalysisActive(false);
    }
  }, [isInitialized, videoElement, isVideoPlaying, isAnalysisActive, orchestrator]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isAnalysisActive) return;

      if (e.key === 'g' || e.key === 'G') {
        // Trigger Grok specialist analysis
        console.log('🔬 Keyboard shortcut: Triggering Grok analysis');
        orchestrator.triggerSpecialistAnalysis(undefined, 'manual', 'grok');
      } else if (e.key === 'n' || e.key === 'N') {
        // Trigger NVIDIA specialist analysis
        console.log('🔬 Keyboard shortcut: Triggering NVIDIA analysis');
        orchestrator.triggerSpecialistAnalysis(undefined, 'manual', 'nvidia');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAnalysisActive, orchestrator]);

  // Manual specialist trigger
  const handleSpecialistTrigger = () => {
    orchestrator.triggerSpecialistAnalysis(undefined, 'manual', specialistProvider);
  };

  if (!isInitialized) {
    return (
      <div className="bg-gray-900 text-white p-6 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span>Initializing AI Analysis System...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Detection Overlay Canvas */}
      <div className="relative">
        <canvas
          ref={overlayCanvasRef}
          className="absolute top-0 left-0 pointer-events-none z-10"
          style={{ 
            width: '100%', 
            height: '100%',
            mixBlendMode: 'screen'
          }}
        />
      </div>

      {/* Analysis Status Panel */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Brain className="mr-2" size={24} />
          Hybrid AI Analysis - 3-Layer Smart Funnel
        </h3>

        {/* Layer 1: MediaPipe Detection */}
        <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold flex items-center">
              <Eye className="mr-2 text-green-400" size={20} />
              Layer 1: Local Detection (MediaPipe)
            </h4>
            <span className="text-xs bg-green-700 px-2 py-1 rounded">
              {isAnalysisActive ? '⚡ LIVE - 30 FPS' : 'IDLE'}
            </span>
          </div>
          
          {analysisState && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Status:</span>
                <span className={`ml-2 font-bold ${analysisState.layer1.hasDetection ? 'text-green-400' : 'text-gray-500'}`}>
                  {analysisState.layer1.hasDetection ? '✓ DETECTED' : '○ Empty Scene'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">People:</span>
                <span className="ml-2 font-bold text-green-400">
                  {analysisState.layer1.detectionCount}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Confidence:</span>
                <span className="ml-2 font-bold text-green-400">
                  {(analysisState.layer1.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="text-gray-400">Frames Processed:</span>
                <span className="ml-2 font-bold text-green-400">
                  {analysisState.stats.totalFramesProcessed}
                </span>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            💡 Zero API cost - runs locally on every frame
          </p>
        </div>

        {/* Layer 2: Gemini Analysis */}
        <div className="mb-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold flex items-center">
              <Zap className="mr-2 text-blue-400" size={20} />
              Layer 2: General Analysis (Gemini)
            </h4>
            <span className="text-xs bg-blue-700 px-2 py-1 rounded">
              {analysisState?.layer2.nextUpdateIn > 0 
                ? `Next in ${analysisState.layer2.nextUpdateIn}s` 
                : 'READY'}
            </span>
          </div>
          
          {analysisState && (
            <>
              <div className="bg-gray-800 p-3 rounded mb-2">
                <p className="text-sm italic">"{analysisState.layer2.description}"</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">API Calls Made:</span>
                  <span className="ml-2 font-bold text-blue-400">
                    {analysisState.stats.geminiCallsMade}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Keywords:</span>
                  <span className="ml-2 font-bold text-blue-400">
                    {analysisState.layer2.keywords.length > 0 
                      ? analysisState.layer2.keywords.join(', ') 
                      : 'None'}
                  </span>
                </div>
              </div>
            </>
          )}
          <p className="text-xs text-gray-400 mt-2">
            💡 Rate Limited: Max 8 calls/min, 7s minimum interval
          </p>
        </div>

        {/* Layer 3: Specialist Analysis */}
        <div className="mb-4 p-4 bg-purple-900/30 border border-purple-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold flex items-center">
              <AlertTriangle className="mr-2 text-purple-400" size={20} />
              Layer 3: Specialist Analysis (NVIDIA/Grok)
            </h4>
            {analysisState?.layer3.isProcessing && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                <span className="text-xs">Processing...</span>
              </div>
            )}
          </div>

          {analysisState?.layer3.deepAnalysis ? (
            <>
              <div className="bg-gray-800 p-3 rounded mb-2 max-h-32 overflow-y-auto">
                <p className="text-sm">{analysisState.layer3.deepAnalysis}</p>
              </div>
              
              {analysisState.layer3.threats.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-red-400 mb-1">⚠️ Threats Detected:</p>
                  <ul className="text-xs space-y-1">
                    {analysisState.layer3.threats.map((threat, idx) => (
                      <li key={idx} className="text-red-300">• {threat}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysisState.layer3.recommendations.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-yellow-400 mb-1">💡 Recommendations:</p>
                  <ul className="text-xs space-y-1">
                    {analysisState.layer3.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-yellow-300">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No specialist analysis yet. Trigger manually or wait for auto-trigger.
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <select 
                value={specialistProvider}
                onChange={(e) => setSpecialistProvider(e.target.value as 'nvidia' | 'grok')}
                className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600"
              >
                <option value="nvidia">NVIDIA NIM</option>
                <option value="grok">Grok (xAI)</option>
              </select>
              <button
                onClick={handleSpecialistTrigger}
                disabled={analysisState?.layer3.isProcessing || !isAnalysisActive}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white text-xs px-3 py-1 rounded transition"
              >
                Trigger Analysis
              </button>
            </div>
            <div className="text-xs text-gray-400">
              Calls: {analysisState?.stats.specialistCallsMade || 0} | 
              Auto: {analysisState?.stats.autoTriggersDetected || 0}
            </div>
          </div>
          
          <p className="text-xs text-gray-400 mt-2">
            💡 Keyboard: Press 'N' (NVIDIA) or 'G' (Grok) to trigger
          </p>
        </div>

        {/* System Stats */}
        <div className="p-3 bg-gray-800 rounded-lg">
          <h5 className="text-sm font-semibold mb-2 flex items-center">
            <TrendingUp className="mr-2" size={16} />
            Cost Efficiency Stats
          </h5>
          {analysisState && (
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="text-center">
                <p className="text-gray-400">Local Frames</p>
                <p className="text-xl font-bold text-green-400">
                  {analysisState.stats.totalFramesProcessed}
                </p>
                <p className="text-gray-500">$0.00</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Gemini Calls</p>
                <p className="text-xl font-bold text-blue-400">
                  {analysisState.stats.geminiCallsMade}
                </p>
                <p className="text-gray-500">~${(analysisState.stats.geminiCallsMade * 0.00015).toFixed(4)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Specialist</p>
                <p className="text-xl font-bold text-purple-400">
                  {analysisState.stats.specialistCallsMade}
                </p>
                <p className="text-gray-500">~${(analysisState.stats.specialistCallsMade * 0.002).toFixed(3)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className="mt-4 text-center">
          {isAnalysisActive ? (
            <div className="inline-flex items-center space-x-2 bg-green-900/50 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-400">
                Analysis Active - All Layers Running
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-2 bg-gray-700/50 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm font-semibold text-gray-400">
                Analysis Paused - Play video to start
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HybridVideoAnalysisPanel;
