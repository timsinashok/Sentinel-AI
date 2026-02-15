import React from 'react';
import { MitigationAction } from '../types';
import { CheckCircle2, Circle, Cpu, Loader2 } from 'lucide-react';

interface AgentActionPanelProps {
  actions: MitigationAction[];
}

const AgentActionPanel: React.FC<AgentActionPanelProps> = ({ actions }) => {
  const done = new Set(actions.map((a) => a.action));
  const steps: Array<{ key: string; label: string; sub?: string }> = [
    { key: 'KILL_SWITCH', label: 'Kill switch vehicle', sub: 'Trigger Kill Switch MCP' },
    { key: 'NOTIFY_SUPERVISOR', label: 'Notify supervisor', sub: 'Notify Shift Lead' },
  ];

  return (
    <div className="bg-white rounded border border-ceramic-200 shadow-tech flex flex-col h-full overflow-hidden">
      <div className="px-4 py-2 bg-ceramic-50 border-b border-ceramic-200 flex justify-between items-center">
        <span className="text-[10px] font-mono uppercase tracking-widest text-ceramic-900 font-bold flex items-center gap-2">
          <Cpu className="w-3 h-3" />
          Agent Decisions
        </span>
        <div className="w-2 h-2 rounded-full bg-tech-blue animate-pulse"></div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-ceramic-50/30">
        {actions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-ceramic-400">
            <Loader2 className="w-5 h-5 animate-spin mb-2" />
            <div className="text-xs font-mono text-center">
              Mitigation Agent deciding…
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {steps.map((s) => {
              const isDone = done.has(s.key);
              return (
                <div
                  key={s.key}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-all ${
                    isDone ? 'bg-white border-tech-green/20' : 'bg-white/60 border-ceramic-200'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-tech-green" />
                  ) : (
                    <Circle className="w-4 h-4 text-ceramic-300" />
                  )}
                  <div className="min-w-0">
                    <div className={`text-xs font-bold ${isDone ? 'text-ceramic-900' : 'text-ceramic-600'}`}>
                      {s.label}
                    </div>
                    {s.sub && <div className="text-[10px] text-ceramic-400 font-mono">{s.sub}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentActionPanel;