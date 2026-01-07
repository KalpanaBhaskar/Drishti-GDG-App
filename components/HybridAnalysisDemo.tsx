/**
 * Hybrid Analysis Demo Page
 * Complete example of using the 3-Layer Smart Funnel system
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Upload, Video, Info } from 'lucide-react';
import { HybridVideoAnalysisPanel } from './HybridVideoAnalysisPanel';

export const HybridAnalysisDemo: React.FC = () => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle video upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsPlaying(false);
    }
  };

  // Handle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Use webcam
  const useWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 1280, 
          height: 720,
          facingMode: 'user'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Could not access webcam. Please check permissions.');
    }
  };

  // Load sample video
  const loadSampleVideo = () => {
    // You can replace this with your sample video URL
    setVideoSrc('https://www.w3schools.com/html/mov_bbb.mp4');
    setIsPlaying(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoSrc]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎯 Hybrid Video Analysis System
          </h1>
          <p className="text-xl text-blue-200">
            3-Layer Smart Funnel: MediaPipe + Gemini + NVIDIA/Grok
          </p>
        </div>

        {/* Info Panel */}
        <div className="bg-blue-900/40 border border-blue-500 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Info className="text-blue-300 mt-1" size={24} />
            <div className="text-white text-sm space-y-2">
              <p className="font-semibold">How it works:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-100">
                <li><strong>Layer 1 (Local):</strong> MediaPipe runs at 30 FPS, detecting people instantly - Zero cost</li>
                <li><strong>Layer 2 (Cloud):</strong> Gemini analyzes when people detected - Rate limited to &lt;10 calls/min</li>
                <li><strong>Layer 3 (Specialist):</strong> NVIDIA/Grok deep analysis - Manual trigger or auto on keywords</li>
              </ul>
              <p className="text-xs text-blue-200 mt-2">
                💡 Press 'N' for NVIDIA or 'G' for Grok specialist analysis during playback
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Source Selection */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Video className="mr-2" size={20} />
                Video Source
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                >
                  <Upload size={18} />
                  <span>Upload Video</span>
                </button>
                <button
                  onClick={useWebcam}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
                >
                  <Video size={18} />
                  <span>Use Webcam</span>
                </button>
                <button
                  onClick={loadSampleVideo}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition"
                >
                  <Play size={18} />
                  <span>Load Sample</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden relative">
              {videoSrc || videoRef.current?.srcObject ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={videoSrc || undefined}
                    className="w-full h-auto"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    loop
                  />
                  
                  {/* Play/Pause Overlay */}
                  <button
                    onClick={togglePlayPause}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-6 transition"
                  >
                    {isPlaying ? <Pause size={48} /> : <Play size={48} />}
                  </button>

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {isPlaying ? '🔴 LIVE' : '⏸️ PAUSED'}
                  </div>
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Video size={64} className="mx-auto mb-4 opacity-50" />
                    <p>No video loaded</p>
                    <p className="text-sm mt-2">Upload a video or use webcam to start</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Controls */}
            {(videoSrc || videoRef.current?.srcObject) && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={togglePlayPause}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition ${
                      isPlaying 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white font-semibold`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause size={20} />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play size={20} />
                        <span>Play</span>
                      </>
                    )}
                  </button>

                  {videoRef.current && !videoRef.current.srcObject && (
                    <input
                      type="range"
                      min="0"
                      max={videoRef.current.duration || 100}
                      value={videoRef.current.currentTime || 0}
                      onChange={(e) => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = parseFloat(e.target.value);
                        }
                      }}
                      className="flex-1 mx-4"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Analysis Panel */}
          <div className="lg:col-span-1">
            <HybridVideoAnalysisPanel 
              videoElement={videoRef.current}
              isVideoPlaying={isPlaying}
            />
          </div>
        </div>

        {/* Architecture Diagram */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-white font-bold text-xl mb-4">System Architecture</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-4">
              <div className="text-center">
                <div className="text-4xl mb-2">🚪</div>
                <h4 className="text-green-400 font-bold mb-2">Layer 1: Gatekeeper</h4>
                <p className="text-sm text-gray-300 mb-3">MediaPipe Pose Detection</p>
                <div className="space-y-1 text-xs text-gray-400">
                  <p>✓ Runs at 30 FPS</p>
                  <p>✓ 100% Local</p>
                  <p>✓ Zero API Cost</p>
                  <p>✓ Real-time Detection</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/30 border-2 border-blue-500 rounded-lg p-4">
              <div className="text-center">
                <div className="text-4xl mb-2">🤖</div>
                <h4 className="text-blue-400 font-bold mb-2">Layer 2: Analyst</h4>
                <p className="text-sm text-gray-300 mb-3">Gemini 2.0 Flash</p>
                <div className="space-y-1 text-xs text-gray-400">
                  <p>✓ &lt;10 calls/minute</p>
                  <p>✓ 7s minimum interval</p>
                  <p>✓ Low cost (~$0.00015/call)</p>
                  <p>✓ Scene description</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-900/30 border-2 border-purple-500 rounded-lg p-4">
              <div className="text-center">
                <div className="text-4xl mb-2">🔬</div>
                <h4 className="text-purple-400 font-bold mb-2">Layer 3: Specialist</h4>
                <p className="text-sm text-gray-300 mb-3">NVIDIA NIM / Grok</p>
                <div className="space-y-1 text-xs text-gray-400">
                  <p>✓ On-demand only</p>
                  <p>✓ Manual or auto-trigger</p>
                  <p>✓ Higher cost (~$0.002/call)</p>
                  <p>✓ Deep analysis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HybridAnalysisDemo;
