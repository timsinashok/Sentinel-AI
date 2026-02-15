import React from 'react';
import { RiskLevel } from '../types';
import { ShieldCheck, AlertOctagon, Activity, Zap } from 'lucide-react';

interface RiskSummaryProps {
  riskLevel: RiskLevel;
  timeToHazard: number | null;
}

const RiskSummary: React.FC<RiskSummaryProps> = ({ riskLevel, timeToHazard }) => {
  const isCritical = riskLevel === RiskLevel.CRITICAL || riskLevel === RiskLevel.COLLISION;

  return (
    <div className="bg-white rounded border border-ceramic-200 shadow-tech overflow-hidden">
      {/* Widget Header */}
      <div className="px-4 py-2 bg-ceramic-50 border-b border-ceramic-200 flex justify-between items-center">
        <span className="text-[10px] font-mono uppercase tracking-widest text-ceramic-900 font-bold">Threat Assessment</span>
        <Activity className="w-3 h-3 text-ceramic-400" />
      </div>

      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded flex items-center justify-center shrink-0 ${
            isCritical ? 'bg-tech-red/10 text-tech-red' : 'bg-tech-green/10 text-tech-green'
          }`}>
            {isCritical ? <AlertOctagon className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
          </div>
          <div>
            <div className={`text-2xl font-bold leading-none tracking-tight ${
              isCritical ? 'text-tech-red' : 'text-tech-green'
            }`}>
              {isCritical ? 'CRITICAL RISK' : 'SECURE'}
            </div>
            <div className="text-xs font-mono text-ceramic-900 mt-1 opacity-60">
              {isCritical ? 'INTERSECTION IMMINENT' : 'ZONE NOMINAL'}
            </div>
          </div>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-2 gap-px bg-ceramic-100 border border-ceramic-200 rounded overflow-hidden">
          <div className="bg-white p-3">
             <div className="text-[9px] font-mono text-ceramic-400 uppercase mb-1">Impact In</div>
             <div className={`font-mono text-lg font-bold ${isCritical ? 'text-tech-red' : 'text-ceramic-900'}`}>
                {timeToHazard ? `${timeToHazard.toFixed(1)}s` : '---'}
             </div>
          </div>
          <div className="bg-white p-3">
             <div className="text-[9px] font-mono text-ceramic-400 uppercase mb-1">Confidence</div>
             <div className="font-mono text-lg font-bold text-ceramic-900">
                {isCritical ? '99.9%' : '100%'}
             </div>
          </div>
        </div>
      </div>
      
      {/* Status Footer */}
      <div className={`h-1 w-full ${isCritical ? 'bg-tech-red animate-pulse' : 'bg-tech-green'}`}></div>
    </div>
  );
};

export default RiskSummary;