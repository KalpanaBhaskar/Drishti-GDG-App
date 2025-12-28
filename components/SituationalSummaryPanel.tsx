
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, BrainCircuit, MessageSquare, BarChart3 } from 'lucide-react';
import { getSituationalSummary, chatWithDrishti } from '../services/geminiService';
import { Zone, Incident, ChatMessage } from '../types';

interface SummaryPanelProps {
  zones: Zone[];
  incidents: Incident[];
}

const SituationalSummaryPanel: React.FC<SummaryPanelProps> = ({ zones, incidents }) => {
  const [activeMode, setActiveMode] = useState<'summary' | 'chat'>('summary');
  const [summary, setSummary] = useState<string>('');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-refresh summary every 5 seconds
  useEffect(() => {
    if (activeMode === 'summary') {
      fetchSummary();
      const interval = setInterval(() => {
        fetchSummary();
      }, 5000); // Update every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [activeMode, zones, incidents]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchSummary = async (q?: string) => {
    setIsLoading(true);
    const result = await getSituationalSummary(zones, incidents, q);
    setSummary(result);
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    fetchSummary(query);
    setQuery('');
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      message: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const conversationHistory = chatMessages.map(m => ({ role: m.role, message: m.message }));
      const response = await chatWithDrishti(chatInput, zones, incidents, conversationHistory);

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        message: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header with Mode Toggle */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
             <BrainCircuit className="text-blue-500" size={20} />
             <h3 className="font-bold text-sm tracking-tight">Drishti AI Agent</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-blue-500 uppercase">Live</span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 rounded-lg p-1 border border-slate-800">
          <button
            onClick={() => setActiveMode('summary')}
            className={`flex-1 px-4 py-2 rounded-md text-xs font-bold transition-all ${
              activeMode === 'summary'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BarChart3 size={14} />
              Summary
            </div>
          </button>
          <button
            onClick={() => setActiveMode('chat')}
            className={`flex-1 px-4 py-2 rounded-md text-xs font-bold transition-all ${
              activeMode === 'chat'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageSquare size={14} />
              Chatbot
            </div>
          </button>
        </div>
      </div>

      {/* Summary Mode */}
      {activeMode === 'summary' && (
        <>
          <div className="flex-1 overflow-auto p-5 scrollbar-thin scrollbar-thumb-slate-800">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                <Loader2 className="animate-spin text-blue-500" size={24} />
                <p className="text-[11px] font-medium text-slate-400">Analyzing video feeds & generating live summary...</p>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                {summary.split('\n').map((line, i) => (
                  <p key={i} className="mb-3 leading-relaxed text-sm">
                    {line.startsWith('-') || line.startsWith('*') ? (
                      <span className="block pl-4 relative">
                        <span className="absolute left-0">•</span>
                        {line.replace(/^[-*]\s*/, '')}
                      </span>
                    ) : line}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-900/60 border-t border-slate-800">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Query system (e.g. 'Bottleneck risks?')"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50"
                disabled={isLoading || !query.trim()}
              >
                <Send size={16} />
              </button>
            </form>
            <p className="mt-2 text-[10px] text-slate-600 text-center italic">
              Auto-updating every 5 seconds from video analysis
            </p>
          </div>
        </>
      )}

      {/* Chat Mode */}
      {activeMode === 'chat' && (
        <>
          <div className="flex-1 overflow-auto p-5 scrollbar-thin scrollbar-thumb-slate-800 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                <MessageSquare className="text-blue-500" size={40} />
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-300 mb-2">Ask Drishti Anything</p>
                  <p className="text-xs text-slate-500">Questions about crowds, safety, or event status</p>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-4 w-full max-w-xs">
                  <button
                    onClick={() => setChatInput("What's the current crowd situation?")}
                    className="px-3 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-xs text-slate-300 text-left border border-slate-700/50 transition-all"
                  >
                    💬 What's the current crowd situation?
                  </button>
                  <button
                    onClick={() => setChatInput("Which zones are safest right now?")}
                    className="px-3 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-xs text-slate-300 text-left border border-slate-700/50 transition-all"
                  >
                    🛡️ Which zones are safest right now?
                  </button>
                  <button
                    onClick={() => setChatInput("Are there any active incidents?")}
                    className="px-3 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-xs text-slate-300 text-left border border-slate-700/50 transition-all"
                  >
                    🚨 Are there any active incidents?
                  </button>
                </div>
              </div>
            ) : (
              <>
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      <span className="text-[10px] opacity-60 mt-1 block">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3">
                      <Loader2 className="animate-spin text-blue-500" size={16} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          <div className="p-4 bg-slate-900/60 border-t border-slate-800">
            <form onSubmit={handleChatSubmit} className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about crowds, safety, incidents..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                disabled={isChatLoading}
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50"
                disabled={isChatLoading || !chatInput.trim()}
              >
                <Send size={16} />
              </button>
            </form>
            <p className="mt-2 text-[10px] text-slate-600 text-center italic">
              Powered by Gemini 2.5 Flash with real-time event data
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default SituationalSummaryPanel;
