
import React from 'react';
import { SystemStats, SecurityLog } from '../types';

interface DashboardProps {
  stats: SystemStats;
  securityLogs: SecurityLog[];
  novaSummary: string;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, securityLogs, novaSummary }) => {
  const StatCard = ({ label, value, sub, color }: any) => (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-colors">
      <div className="text-slate-400 text-sm font-medium mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-slate-500 text-xs mt-2 uppercase tracking-wider">{sub}</div>
    </div>
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2">Systems Operational</h1>
        <p className="text-slate-400">{novaSummary || 'Optimizing your workspace for peak performance.'}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="CPU Utilization" value={`${stats.cpu}%`} sub="8 Cores active" color="text-blue-400" />
        <StatCard label="Memory Usage" value={`${stats.ram}GB`} sub="16GB Total" color="text-purple-400" />
        <StatCard label="Disk Health" value="Healthy" sub="1.2TB Available" color="text-emerald-400" />
        <StatCard label="Network Load" value={stats.network} sub="Gigabit Fiber" color="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-slate-800/30 rounded-3xl p-8 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-6">Security & Process Monitor</h2>
            <div className="space-y-4">
              {securityLogs.slice(0, 5).map(log => (
                <div key={log.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                  <div className={`w-2 h-2 rounded-full ${
                    log.type === 'critical' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 
                    log.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-200 font-medium">{log.message}</p>
                    <p className="text-xs text-slate-500">{log.time}</p>
                  </div>
                  <button className="text-xs font-bold text-blue-400 hover:text-blue-300">INVESTIGATE</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-900/20">
            <h3 className="text-lg font-bold mb-2">Proactive Insight</h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              "Your meeting with the Engineering team starts in 15 minutes. I've prepared the relevant documentation and closed high-RAM background tasks to ensure a smooth call."
            </p>
            <button className="bg-white/20 hover:bg-white/30 transition-colors py-2 px-4 rounded-lg text-sm font-semibold backdrop-blur-md">
              View Prep Notes
            </button>
          </section>

          <section className="bg-slate-800/30 rounded-3xl p-8 border border-slate-700/50">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {['Scan PC', 'Clear Cache', 'Focus Mode', 'Backups'].map(action => (
                <button key={action} className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-colors">
                  {action}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
