
import React, { useState, useEffect, useRef } from 'react';
import { LiveAssistantSession } from '../services/liveApi';
import { ICONS } from '../constants';

const LiveAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<{ text: string; isUser: boolean }[]>([]);
  const sessionRef = useRef<LiveAssistantSession | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionRef.current = new LiveAssistantSession(
      (text, isUser) => {
        setTranscript(prev => {
          // Simplistic merging for live updates
          if (prev.length > 0 && prev[prev.length - 1].isUser === isUser) {
             const last = prev[prev.length - 1];
             return [...prev.slice(0, -1), { ...last, text: last.text + text }];
          }
          return [...prev, { text, isUser }];
        });
      },
      (active) => setIsActive(active),
      async (id, name, args) => {
        console.log(`Live Tool Call: ${name}`, args);
        return "Acknowledged by Sylvie Assistant.";
      },
      (errorMsg) => {
        console.error('Sylvie Live Error:', errorMsg);
      }
    );

    return () => {
      sessionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [transcript]);

  const toggleSession = async () => {
    if (isActive) {
      await sessionRef.current?.stop();
    } else {
      setTranscript([]);
      await sessionRef.current?.start();
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      {isActive && (
        <div className="w-80 h-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live with Sylvie</span>
            </div>
            <button onClick={toggleSession} className="text-slate-500 hover:text-white transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent">
             {transcript.map((t, i) => (
               <div key={i} className={`flex flex-col ${t.isUser ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-500 mb-1 uppercase font-bold">{t.isUser ? 'You' : 'Sylvie'}</span>
                  <p className={`p-3 rounded-2xl ${t.isUser ? 'bg-blue-600/20 text-blue-100 rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                    {t.text}
                  </p>
               </div>
             ))}
             {transcript.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-50">
                  <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center animate-ping">
                    <ICONS.Voice />
                  </div>
                  <p className="text-slate-400 text-xs">Sylvie is listening... Speak whenever you're ready.</p>
               </div>
             )}
          </div>

          <div className="p-4 bg-slate-900 border-t border-slate-800">
             <div className="flex justify-center items-center gap-1 h-8">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-blue-500 rounded-full animate-wave" 
                    style={{ 
                      height: `${Math.random() * 100}%`,
                      animationDelay: `${i * 50}ms`,
                      animationDuration: '0.5s'
                    }} 
                  />
                ))}
             </div>
          </div>
        </div>
      )}

      <button
        onClick={toggleSession}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${
          isActive 
            ? 'bg-red-500 text-white rotate-90 shadow-red-500/20' 
            : 'bg-blue-600 text-white shadow-blue-600/20'
        }`}
      >
        <ICONS.Voice />
      </button>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        .animate-wave {
          animation: wave infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LiveAssistant;
