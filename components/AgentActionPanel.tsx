import React from 'react';
import { MitigationAction } from '../types';
import { Terminal, Check, ChevronRight, Cpu } from 'lucide-react';

interface AgentActionPanelProps {
  actions: MitigationAction[];
}

const AgentActionPanel: React.FC<AgentActionPanelProps> = ({ actions }) => {
  return (
    <div className="bg-white rounded border border-ceramic-200 shadow-tech flex flex-col h-full overflow-hidden">
      <div className="px-4 py-2 bg-ceramic-50 border-b border-ceramic-200 flex justify-between items-center">
        <span className="text-[10px] font-mono uppercase tracking-widest text-ceramic-900 font-bold flex items-center gap-2">
          <Cpu className="w-3 h-3" />
          Agent Decisions
        </span>
        <div className="w-2 h-2 rounded-full bg-tech-blue animate-pulse"></div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-0 bg-ceramic-50/30">
        {actions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-ceramic-300 p-6">
            <Terminal className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs font-mono">Awaiting Triggers...</span>
          </div>
        ) : (
          <div className="divide-y divide-ceramic-100">
            {actions.map((action, idx) => (
              <div key={action.id} className="p-3 bg-white hover:bg-blue-50/50 transition-colors animate-in slide-in-from-left-2 duration-300">
                 <div className="flex items-center gap-2 mb-1">
                   <span className="font-mono text-[9px] text-ceramic-400">
                     {`00:00:0${Math.floor(action.timestamp)}`}
                   </span>
                   <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-tech-blue/10 text-tech-blue uppercase">
                     {action.action.replace('_', ' ')}
                   </span>
                 </div>
                 <div className="pl-4 border-l-2 border-ceramic-200 ml-1">
                    <p className="text-xs font-medium text-ceramic-800 leading-snug">
                      {action.rationale}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[9px] text-ceramic-400 font-mono">Target: {action.targetId}</span>
                      <span className="flex items-center gap-1 text-[9px] text-tech-green font-bold font-mono uppercase">
                        <Check className="w-3 h-3" /> Executed
                      </span>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentActionPanel;