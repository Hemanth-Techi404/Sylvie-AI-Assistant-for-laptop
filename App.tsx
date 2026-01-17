
import React, { useState, useEffect, useRef } from 'react';
import { LiveAssistantSession } from './services/liveApi';
import { AutomationLog, SystemStatus, ActiveTask } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus>(SystemStatus.IDLE);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isNovaTyping, setIsNovaTyping] = useState(false);
  const [pendingAction, setPendingAction] = useState<{id: string, name: string, args: any} | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [currentTranscription, setCurrentTranscription] = useState('');
  
  // Simulated Desktop State
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [mailView, setMailView] = useState<{from: string, subject: string, body: string}[] | null>(null);
  const [codePreview, setCodePreview] = useState<{filename: string, code: string} | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['Sylvie Kernel 2.1-live', 'Direct Control Enabled']);
  const [securityStatus, setSecurityStatus] = useState<'SECURE' | 'SCANNING' | 'THREAT_FOUND' | 'THREAT_REMOVED'>('SECURE');

  const logContainerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<LiveAssistantSession | null>(null);

  const addLog = (message: string, type: AutomationLog['type'] = 'info', source: AutomationLog['source'] = 'SYSTEM') => {
    setLogs(prev => [...prev.slice(-40), { id: Math.random().toString(), timestamp: new Date(), message, type, source }]);
  };

  const addTerminal = (line: string) => {
    setTerminalOutput(prev => [...prev.slice(-20), `> ${line}`]);
  };

  useEffect(() => {
    addLog('Sylvie OS Control Layer initialized.', 'success');
    
    sessionRef.current = new LiveAssistantSession(
      (text, isUser, isFinal) => { 
        if (!isUser) {
          setIsNovaTyping(!isFinal);
          setCurrentTranscription(prev => isFinal ? '' : prev + text);
          if (!isFinal) setStatus(SystemStatus.THINKING);
          else setStatus(SystemStatus.IDLE);
        } else {
           // User transcription
           setStatus(SystemStatus.IDLE);
        }
      },
      (active) => {
        setIsLive(active);
        if (active) {
          addLog('Neural Link: STABLE', 'success', 'SYLVIE');
          addTerminal('LINK ESTABLISHED: GEMINI-LIVE-2.5');
        } else {
          addLog('Neural Link: SEVERED', 'error', 'SYSTEM');
          setIsNovaTyping(false);
          setStatus(SystemStatus.IDLE);
          addTerminal('LINK SEVERED');
        }
      },
      async (id, name, args) => {
        setPendingAction({ id, name, args });
        setStatus(SystemStatus.AWAITING_PERMISSION);
        addLog(`INTERCEPTED: ${name.toUpperCase()}`, 'warning', 'SYLVIE');
        
        return new Promise((resolve) => {
           (window as any).resolveNovaAction = (approved: boolean) => {
              setPendingAction(null);
              if (approved) {
                executeAction(name, args);
                resolve('Authorization granted. Executing protocol.');
              } else {
                addLog(`Action ${name} blocked by user policy.`, 'error', 'SYSTEM');
                resolve('Authorization denied by system administrator.');
              }
           };
        });
      },
      (errorMsg) => {
        addLog(errorMsg, 'error', 'SYSTEM');
        addTerminal(`FATAL ERROR: ${errorMsg}`);
        setIsLive(false);
      }
    );

    return () => { sessionRef.current?.stop(); };
  }, []);

  const moveCursor = async (targetX: number, targetY: number) => {
    setCursorPos({ x: targetX, y: targetY });
    await new Promise(r => setTimeout(r, 600));
  };

  const executeAction = async (name: string, args: any) => {
    setStatus(SystemStatus.EXECUTING);
    const taskId = Math.random().toString();
    setActiveTasks(prev => [...prev, { id: taskId, name, progress: 0, status: 'running' }]);
    addTerminal(`INITIATING: ${name}`);

    if (name === 'scan_system_security') {
      setSecurityStatus('SCANNING');
      await moveCursor(90, 10); // Move to hypothetical security icon
      addTerminal('Scanning system kernel and memory...');
      for (let i = 0; i <= 100; i += 10) {
        addTerminal(`Checking sector 0x${Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase()}...`);
        setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: i } : t));
        await new Promise(r => setTimeout(r, 300));
      }
      setSecurityStatus('SECURE');
      addLog('Zero-day threat scan complete. System integrity: 100%', 'success', 'SYSTEM');
    } else if (name === 'read_file_content') {
      await moveCursor(25, 60); // Move to code editor window
      setActiveApp('VS Code');
      addTerminal(`Reading file: ${args.filepath}`);
      const mockContent = `/**\n * Source: ${args.filepath}\n * Analyzed by Sylvie OS\n */\n\nexport const systemConfig = {\n  optimization: "maximum",\n  security: "sovereign",\n  status: "ONLINE"\n};`;
      setCodePreview({ filename: args.filepath, code: mockContent });
      addLog(`File analysis complete for ${args.filepath}`, 'info', 'SYLVIE');
    } else if (name === 'read_emails') {
      await moveCursor(80, 20); // Move to mail window
      setActiveApp('Outlook');
      setMailView([
        { from: 'Dev Ops', subject: 'System Upgrade Successful', body: 'Sylvie OS v2.1 has been deployed successfully to all nodes.' },
        { from: 'Cortex AI', subject: 'Memory Optimization', body: 'We have reclaimed 4GB of unused system memory.' }
      ]);
    } else if (name === 'send_email') {
      await moveCursor(80, 40); // Move to send button
      addTerminal(`SMTP: Sending secure relay to ${args.to}`);
    } else if (name === 'control_app') {
      await moveCursor(50, 95); // Move to taskbar
      setActiveApp(args.app_name);
      addTerminal(`SYSTEM: ${args.action} ${args.app_name}`);
    }

    setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 100 } : t));
    addTerminal(`TASK COMPLETED: ${name}`);
    setStatus(SystemStatus.IDLE);
    setTimeout(() => {
      setActiveTasks(prev => prev.filter(t => t.id !== taskId));
    }, 1500);
  };

  return (
    <div className="h-screen w-full bg-[#020617] text-slate-400 font-mono overflow-hidden relative flex selection:bg-blue-600/30">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_rgba(30,58,138,0.1)_0%,_transparent_50%)]" />
        <div className="w-full h-full bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:60px_60px] opacity-[0.03]" />
      </div>

      {/* AI CURSOR - Real-time Interaction Indicator */}
      <div 
        className="absolute w-12 h-12 z-[100] pointer-events-none transition-all duration-700 ease-in-out"
        style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%`, transform: 'translate(-50%, -50%)' }}
      >
        <div className={`w-full h-full rounded-full blur-2xl transition-all duration-500 ${
          status === SystemStatus.EXECUTING ? 'bg-emerald-500/40' : 
          status === SystemStatus.AWAITING_PERMISSION ? 'bg-amber-500/40' : 'bg-blue-500/10'
        }`} />
        <div className="absolute inset-4 rounded-full border border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.4)] flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full bg-white ${status === SystemStatus.EXECUTING ? 'animate-ping' : ''}`} />
        </div>
      </div>

      {/* LEFT: System Feed */}
      <div className="w-80 h-full border-r border-white/5 bg-slate-900/60 backdrop-blur-3xl z-20 flex flex-col">
        <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`} />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Telemetry</span>
          </div>
          <span className="text-[8px] text-slate-700 font-bold">STABLE // 2.1.0</span>
        </div>
        
        <div ref={logContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-[9px] font-mono leading-tight scrollbar-hide">
          {logs.map(log => (
            <div key={log.id} className="flex gap-2">
              <span className="text-slate-800">[{log.timestamp.toLocaleTimeString([], {hour12:false})}]</span>
              <span className={`${
                log.type === 'success' ? 'text-emerald-500' : 
                log.type === 'warning' ? 'text-amber-500' : 
                log.type === 'error' ? 'text-red-500' : 'text-blue-600'
              } font-bold`}>{log.source}»</span>
              <span className="text-slate-500">{log.message}</span>
            </div>
          ))}
        </div>

        {/* Console Window */}
        <div className="h-64 border-t border-white/5 bg-black/40 p-5 font-mono text-[9px] text-blue-400/70">
          <div className="flex justify-between items-center mb-3 opacity-50">
            <span className="text-[8px] font-bold uppercase tracking-widest text-blue-300">Sylvie Console</span>
            <div className="w-16 h-1 bg-slate-800 rounded-full" />
          </div>
          <div className="space-y-1 overflow-y-auto h-full scrollbar-hide">
            {terminalOutput.map((line, i) => (
              <div key={i} className="animate-in slide-in-from-left-2 duration-300">{line}</div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER: Workstation View */}
      <div className="flex-1 relative z-10 p-10 flex flex-col items-center">
        
        {/* Workspace Header */}
        <div className="w-full flex justify-between items-center mb-16">
           <div>
              <h1 className="text-4xl font-black text-white tracking-tighter">SYLVIE<span className="text-blue-600">AGENT</span></h1>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.4em] mt-2">Sovereign Automation Interface</p>
           </div>
           
           <div className="flex gap-6">
              <div className="px-6 py-3 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl flex items-center gap-4">
                 <div className={`w-2 h-2 rounded-full ${securityStatus === 'SECURE' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : securityStatus === 'SCANNING' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SECURE: {securityStatus}</span>
              </div>
              <div 
                onClick={() => isLive ? sessionRef.current?.stop() : sessionRef.current?.start()}
                className={`px-6 py-3 rounded-2xl border cursor-pointer transition-all duration-700 flex items-center gap-4 ${
                isLive ? 'bg-blue-600/10 border-blue-600/50 shadow-[0_0_30px_rgba(37,99,235,0.2)]' : 'bg-slate-900 border-white/5'
              }`}>
                 <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]' : 'bg-slate-700'}`} />
                 <span className={`text-[10px] font-black tracking-widest ${isLive ? 'text-blue-400' : 'text-slate-600'}`}>
                   {isLive ? 'NEURAL LINK ACTIVE' : 'ESTABLISH LINK'}
                 </span>
              </div>
           </div>
        </div>

        {/* Central Neural Hub */}
        <div className="relative mb-24 group">
          {/* Sylvie Typing Indicator (Waveform) */}
          <div className={`absolute -top-16 left-1/2 -translate-x-1/2 flex items-end gap-1.5 h-16 transition-all duration-500 ${isNovaTyping ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
             {[...Array(12)].map((_, i) => (
               <div 
                 key={i} 
                 className="w-1.5 bg-blue-500 rounded-full animate-wave" 
                 style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 80}ms`, animationDuration: '0.6s' }} 
               />
             ))}
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-blue-400 uppercase tracking-widest whitespace-nowrap">
                Sylvie is responding...
             </div>
          </div>

          <div className={`absolute inset-0 blur-[120px] transition-all duration-1000 ${
            status === SystemStatus.EXECUTING ? 'bg-emerald-500/25' :
            status === SystemStatus.THINKING ? 'bg-blue-500/25' : 
            status === SystemStatus.AWAITING_PERMISSION ? 'bg-amber-500/25' : 'bg-slate-800/10'
          }`} />
          
          <div className={`w-72 h-72 rounded-full border transition-all duration-1000 flex items-center justify-center relative ${
            isLive ? 'border-blue-500/30 bg-blue-900/5' : 'border-white/5 bg-slate-950 opacity-40'
          }`}>
             {/* Orbital Components */}
             <div className={`absolute inset-3 rounded-full border border-dashed border-blue-500/10 ${isLive ? 'animate-[spin_45s_linear_infinite]' : ''}`} />
             <div className={`absolute inset-12 rounded-full border-2 border-t-blue-500/40 border-r-transparent border-b-blue-500/10 border-l-transparent ${isLive ? 'animate-[spin_20s_linear_infinite]' : ''}`} />
             
             {/* The Heart of Sylvie */}
             <div className="relative w-40 h-40 rounded-full flex items-center justify-center overflow-hidden">
                <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_#3b82f633_0%,_transparent_70%)] transition-opacity duration-1000 ${isLive ? 'opacity-100' : 'opacity-0'}`} />
                <div className={`w-6 h-6 rounded-full bg-white transition-all duration-1000 ${isLive ? 'shadow-[0_0_50px_#fff] scale-100' : 'scale-0 opacity-0'}`} />
             </div>
          </div>
        </div>

        {/* Live Window Projections */}
        <div className="grid grid-cols-2 gap-10 w-full max-w-6xl">
          
          {/* Outlook Projection */}
          <div className={`bg-slate-900/40 border transition-all duration-700 rounded-[3rem] overflow-hidden backdrop-blur-3xl group ${
            activeApp === 'Outlook' ? 'border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.1)] scale-100 opacity-100' : 'border-white/5 opacity-25 scale-95'
          }`}>
            <div className="px-8 py-5 border-b border-white/5 bg-black/20 flex items-center justify-between">
               <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Outlook Client // Active</span>
               <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500/10" />
               </div>
            </div>
            <div className="p-10 h-64 overflow-y-auto space-y-5 scrollbar-hide">
               {mailView ? mailView.map((mail, i) => (
                 <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-[2rem] animate-in fade-in slide-in-from-bottom-2 transition-all hover:bg-white/10">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{mail.from}</span>
                       <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                    </div>
                    <div className="text-[13px] text-white font-bold mb-2 tracking-tight">{mail.subject}</div>
                    <div className="text-[11px] text-slate-500 leading-relaxed truncate">{mail.body}</div>
                 </div>
               )) : (
                 <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Mail Protocol Idle</p>
                 </div>
               )}
            </div>
          </div>

          {/* IDE Projection */}
          <div className={`bg-[#050505] border transition-all duration-700 rounded-[3rem] overflow-hidden backdrop-blur-3xl group ${
            codePreview || activeApp === 'VS Code' ? 'border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.1)] scale-100 opacity-100' : 'border-white/5 opacity-25 scale-95'
          }`}>
            <div className="px-8 py-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Editor // {codePreview?.filename || 'system.ts'}</span>
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981]" />
            </div>
            <div className="p-10 h-64 text-[11px] font-mono text-emerald-400/90 overflow-y-auto whitespace-pre leading-loose scrollbar-hide">
               {codePreview ? codePreview.code : '// Initializing direct system interface...\n// Sylvie agent awaiting file access...'}
            </div>
          </div>
        </div>

        {/* Dynamic Task Dock */}
        <div className="fixed bottom-12 flex gap-6 w-full max-w-2xl px-12">
          {activeTasks.map(task => (
            <div key={task.id} className="flex-1 bg-slate-900/80 border border-blue-500/40 p-6 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-12 backdrop-blur-3xl ring-8 ring-blue-500/5">
              <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{task.name}</span>
                 </div>
                 <span className="text-[11px] text-blue-500 font-black">{task.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_10px_#3b82f6]" style={{ width: `${task.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PROTOCOL AUTHORIZATION OVERLAY */}
      {pendingAction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="w-[560px] bg-slate-900 border border-white/5 p-14 rounded-[4rem] shadow-[0_0_120px_rgba(37,99,235,0.15)] text-center transform scale-110">
            <div className="w-28 h-28 rounded-[2.5rem] bg-blue-600/10 flex items-center justify-center mx-auto mb-10 border border-blue-500/20 shadow-inner">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
               </svg>
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Protocol Gate</h2>
            <p className="text-slate-500 text-[11px] mb-12 leading-relaxed uppercase tracking-[0.3em] font-bold px-4">
              Sylvie Agent is requesting <span className="text-blue-500">Elevated Privilege</span> to execute:
              <span className="block mt-8 text-blue-400 font-mono bg-black/60 p-8 rounded-[2.5rem] normal-case text-left text-[11px] border border-white/5 shadow-2xl">
                <span className="text-slate-700 block mb-2 font-black uppercase text-[9px] tracking-widest">Execution Stream:</span>
                IDENT: {pendingAction.name.toUpperCase()}
                <br/>ARGTS: {JSON.stringify(pendingAction.args, null, 2)}
              </span>
            </p>
            <div className="grid grid-cols-2 gap-8">
              <button 
                onClick={() => (window as any).resolveNovaAction(false)}
                className="py-6 bg-slate-800 hover:bg-slate-700 text-slate-500 rounded-[2rem] font-black text-[12px] tracking-[0.2em] transition-all uppercase"
              >
                Deny
              </button>
              <button 
                onClick={() => (window as any).resolveNovaAction(true)}
                className="py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-[12px] tracking-[0.2em] shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all uppercase"
              >
                Authorize
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.3); opacity: 0.4; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        .animate-wave {
          animation: wave infinite ease-in-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default App;
