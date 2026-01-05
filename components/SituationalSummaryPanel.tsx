
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, BrainCircuit, MessageSquare, BarChart3 } from 'lucide-react';
import { getSituationalSummary, chatWithDrishti } from '../services/geminiService';
import { Zone, Incident, ChatMessage, Announcement } from '../types';

interface SummaryPanelProps {
  zones: Zone[];
  incidents: Incident[];
  announcements?: Announcement[];
  riskScore?: number;
  attendeeCount?: number;
  sosActive?: boolean;
}

const SituationalSummaryPanel: React.FC<SummaryPanelProps> = ({ 
  zones, 
  incidents, 
  announcements = [], 
  riskScore = 0, 
  attendeeCount = 0,
  sosActive = false 
}) => {
  // Chat state - removed summary mode, chatbot only
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
      
      // Enhance the prompt with contextual data
      const enhancedPrompt = `${chatInput}
      
Context Data:
- Risk Score: ${riskScore.toFixed(1)}/100
- Total Attendees: ${attendeeCount.toLocaleString()}
- Active Incidents: ${incidents.filter(i => i.status !== 'resolved').length}
- Total Zones: ${zones.length}
- Recent Announcements: ${announcements.length}
- SOS Emergency Active: ${sosActive ? 'Yes' : 'No'}

Zone Metrics:
${zones.map(z => `- ${z.name}: ${Math.round(z.density)}% density, Status: ${z.status}`).join('\n')}

Active Incidents:
${incidents.filter(i => i.status !== 'resolved').map(i => `- ${i.id}: ${i.type}, Priority: ${i.priority}, Status: ${i.status}`).join('\n')}

Recent Announcements:
${announcements.slice(0, 3).map(a => `- ${a.title}: ${a.content}`).join('\n')}`;

      const response = await chatWithDrishti(enhancedPrompt, zones, incidents, conversationHistory);

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        message: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        message: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header - Chatbot Only */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
             <MessageSquare className="text-blue-500" size={20} />
             <h3 className="font-bold text-sm tracking-tight">Drishti AI Chatbot</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-blue-500 uppercase">Live</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 mt-2">Ask about metrics, incidents, announcements, risk score, and SOS details</p>
      </div>

      {/* Chat Mode - Always Active */}
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
                    onClick={() => setChatInput("What's the current risk score and what does it mean?")}
                    className="px-3 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-xs text-slate-300 text-left border border-slate-700/50 transition-all"
                  >
                    📊 What's the current risk score?
                  </button>
                  <button
                    onClick={() => setChatInput("Tell me about active incidents and their status")}
                    className="px-3 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-xs text-slate-300 text-left border border-slate-700/50 transition-all"
                  >
                    🚨 Active incidents and status
                  </button>
                  <button
                    onClick={() => setChatInput("What are the latest announcements?")}
                    className="px-3 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-xs text-slate-300 text-left border border-slate-700/50 transition-all"
                  >
                    📢 Latest announcements
                  </button>
                  <button
                    onClick={() => setChatInput("Show me crowd density metrics by zone")}
                    className="px-3 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-xs text-slate-300 text-left border border-slate-700/50 transition-all"
                  >
                    👥 Crowd density by zone
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
                placeholder="Ask about metrics, incidents, announcements, risk score..."
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
    </div>
  );
};

export default SituationalSummaryPanel;
