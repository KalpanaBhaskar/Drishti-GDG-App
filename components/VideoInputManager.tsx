import React, { useState, useRef } from 'react';
import { Youtube, Upload, Link as LinkIcon, X, Loader2, CheckCircle, Video, Trash2, Edit } from 'lucide-react';

interface VideoInputManagerProps {
  onSave: (videoData: { type: 'youtube' | 'local'; url: string; fileName?: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  currentVideo: { type: 'youtube' | 'local'; url: string; fileName?: string } | null;
}

const VideoInputManager: React.FC<VideoInputManagerProps> = ({ onSave, onDelete, currentVideo }) => {
  const [inputType, setInputType] = useState<'youtube' | 'local'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [showChangeConfirm, setShowChangeConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteVideo = async () => {
    if (!onDelete) return;
    
    if (confirm('Are you sure you want to delete the current video source? This will stop any ongoing analysis.')) {
      setUploading(true);
      try {
        await onDelete();
        setShowChangeConfirm(false);
      } catch (err: any) {
        setError(err.message || 'Failed to delete video source');
      } finally {
        setUploading(false);
      }
    }
  };

  const validateYouTubeUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11;
  };

  const handleYouTubeSave = async () => {
    setError('');
    
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(youtubeUrl)) {
      setError('Invalid YouTube URL. Please use a valid YouTube video link.');
      return;
    }

    setUploading(true);
    try {
      await onSave({
        type: 'youtube',
        url: youtubeUrl.trim()
      });
      setYoutubeUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to save YouTube link');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid video file (MP4, WebM, OGG, MOV)');
      return;
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      setError('File size must be less than 500MB');
      return;
    }

    setError('');
    setUploadedFile(file);
  };

  const handleLocalVideoUpload = async () => {
    if (!uploadedFile) {
      setError('Please select a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create a local URL for the video
      const videoUrl = URL.createObjectURL(uploadedFile);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onSave({
        type: 'local',
        url: videoUrl,
        fileName: uploadedFile.name
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploadedFile(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to upload video');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Video size={20} className="text-blue-500" />
            Video Input Source
          </h3>
          <p className="text-xs text-slate-500 mt-1">Upload a local video or provide a YouTube link for live monitoring</p>
        </div>
      </div>

      {/* Current Video Status */}
      {currentVideo && !showChangeConfirm && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {currentVideo.type === 'youtube' ? (
                <Youtube size={20} className="text-red-500" />
              ) : (
                <Video size={20} className="text-blue-500" />
              )}
              <div>
                <p className="text-xs font-bold text-blue-400 uppercase">Current Source</p>
                <p className="text-sm text-white mt-1">
                  {currentVideo.type === 'youtube' ? 'YouTube Video' : currentVideo.fileName || 'Local Video'}
                </p>
                {currentVideo.type === 'youtube' && (
                  <p className="text-xs text-slate-500 mt-1 truncate max-w-md">{currentVideo.url}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-500" />
              <button
                onClick={() => setShowChangeConfirm(true)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-blue-400"
                title="Change video source"
              >
                <Edit size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Confirmation */}
      {currentVideo && showChangeConfirm && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Edit size={18} className="text-yellow-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-yellow-400">Change Video Source?</p>
              <p className="text-xs text-slate-400 mt-1">
                This will replace the current video source. Any ongoing analysis will be stopped.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Current: <span className="text-white">{currentVideo.type === 'youtube' ? 'YouTube Video' : currentVideo.fileName}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowChangeConfirm(false)}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-sm transition-all"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteVideo}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Remove & Upload New
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tab Selection - Only show if no current video or changing */}
      {(!currentVideo || showChangeConfirm) && (
      <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
        <button
          onClick={() => setInputType('youtube')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all text-sm font-bold ${
            inputType === 'youtube'
              ? 'bg-blue-600 text-white'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Youtube size={18} />
          YouTube Link
        </button>
        <button
          onClick={() => setInputType('local')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all text-sm font-bold ${
            inputType === 'local'
              ? 'bg-blue-600 text-white'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Upload size={18} />
          Local Upload
        </button>
      </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* YouTube Input */}
      {(!currentVideo || showChangeConfirm) && inputType === 'youtube' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">YouTube Video URL</label>
            <div className="relative">
              <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                disabled={uploading}
              />
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Paste any YouTube video URL (supports watch, share, embed formats)
            </p>
          </div>
          <button
            onClick={handleYouTubeSave}
            disabled={uploading || !youtubeUrl.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Set as Video Source
              </>
            )}
          </button>
        </div>
      )}

      {/* Local File Upload */}
      {(!currentVideo || showChangeConfirm) && inputType === 'local' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Upload Video File</label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-slate-800 rounded-xl p-8 hover:border-blue-500/50 hover:bg-slate-900/40 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center">
                  <Upload size={40} className="text-slate-700 group-hover:text-blue-500 mb-3 transition-colors" />
                  <p className="text-sm font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                    {uploadedFile ? uploadedFile.name : 'Click to select video file'}
                  </p>
                  <p className="text-xs text-slate-600 mt-2">
                    Supports MP4, WebM, OGG, MOV (max 500MB)
                  </p>
                </div>
              </button>
            </div>
          </div>

          {uploadedFile && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Video size={18} className="text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{uploadedFile.name}</p>
                    <p className="text-xs text-slate-500">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-slate-500 hover:text-red-500 p-1"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              
              {uploading && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-center text-slate-500">{uploadProgress}% uploaded</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleLocalVideoUpload}
            disabled={uploading || !uploadedFile}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Uploading {uploadProgress}%
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Set as Video Source
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoInputManager;
