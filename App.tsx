import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Zap, LayoutDashboard, Settings, Video as VideoIcon } from 'lucide-react';
import ScenePanel from './components/ScenePanel';
import RiskSummary from './components/RiskSummary';
import AgentActionPanel from './components/AgentActionPanel';
import { RiskLevel, MitigationAction, SystemMode } from './types';
import { INITIAL_ENTITIES, SENTINEL_ANALYSIS_PAUSE_AT_SEC, SENTINEL_VIDEO_START_DELAY_SEC } from './constants';

const App: React.FC = () => {
  // --- State ---
  const [simulationActive, setSimulationActive] = useState(false);
  // Default to "Without Sentinel" per demo flow
  const [systemMode, setSystemMode] = useState<SystemMode>('PASSIVE');
  const [elapsedTime, setElapsedTime] = useState(0); 
  const scenarioDurationSec = systemMode === 'PASSIVE' ? 14 : 6;
  const sentinelHoldAtSec = SENTINEL_VIDEO_START_DELAY_SEC + SENTINEL_ANALYSIS_PAUSE_AT_SEC;
  
  // UI State
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.SAFE);
  const [timeToHazard, setTimeToHazard] = useState<number | null>(null);
  const [actions, setActions] = useState<MitigationAction[]>([]);
  
  const startTimeRef = useRef<number>();
  const requestRef = useRef<number>();

  // --- Logic Loop ---
  useEffect(() => {
    if (!simulationActive) {
        setRiskLevel(RiskLevel.SAFE);
        setTimeToHazard(null);
        return;
    }

    const videoTimeSec =
      systemMode === 'ACTIVE' ? Math.max(0, elapsedTime - SENTINEL_VIDEO_START_DELAY_SEC) : elapsedTime;

    const predictedCollisionTimeSec = systemMode === 'ACTIVE' ? 7.0 : 3.2;
    const remainingTime = predictedCollisionTimeSec - videoTimeSec;

    // "Without Sentinel" Logic
    if (systemMode === 'PASSIVE') {
      if (remainingTime <= 0.5 && remainingTime > -2.0) {
        setRiskLevel(RiskLevel.COLLISION);
        setTimeToHazard(0);
      } else {
         setRiskLevel(RiskLevel.SAFE);
         setTimeToHazard(null);
      }
    } 
    // "With Sentinel" Logic
    else {
      if (remainingTime > 0 && remainingTime < 6) {
        setRiskLevel(RiskLevel.CRITICAL);
        setTimeToHazard(remainingTime);
        
        // Sequenced Actions
        if (elapsedTime > 0.8 && actions.length === 0) {
          setActions([{
              id: 'a1', timestamp: 0.8, action: 'WORLD_MODEL_FORECAST', targetId: 'ZONE-B',
              rationale: 'Sentinel world model forecasting 5s ahead across forklift + pedestrian trajectories.', status: 'EXECUTED'
          }]);
        }
        if (elapsedTime > 1.6 && actions.length === 1) {
            setActions(prev => [...prev, {
                  id: 'a2', timestamp: 1.6, action: 'HAZARD_DETECTED', targetId: 'F-12',
                  rationale: 'Potential collision identified in forecasted intersection corridor. Escalating to monitoring agent.', status: 'EXECUTED'
            }]);
        }
        if (elapsedTime >= sentinelHoldAtSec && actions.length === 2) {
          setActions(prev => [
            ...prev,
            {
              id: 'a3',
              timestamp: sentinelHoldAtSec,
              action: 'KILL_SWITCH',
              targetId: 'F-12',
              rationale: 'Monitoring Agent recommendation: immediately disable vehicle power to eliminate kinetic energy in shared aisle.',
              status: 'EXECUTED',
            },
            {
              id: 'a4',
              timestamp: sentinelHoldAtSec + 0.1,
              action: 'NOTIFY_SUPERVISOR',
              targetId: 'SHIFT-LEAD',
              rationale: 'Notify supervisor with incident context, location, and recommended safety protocol.',
              status: 'EXECUTED',
            },
          ]);
        }
      } else if (remainingTime <= 0) {
        setRiskLevel(RiskLevel.SAFE); 
        setTimeToHazard(null);
      }
    }
  }, [elapsedTime, simulationActive, actions, systemMode]);

  // --- Animation/Timer Loop ---
  const animate = (time: number) => {
    if (startTimeRef.current === undefined) startTimeRef.current = time;
    const delta = (time - startTimeRef.current) / 1000;
    
    // Without Sentinel: play full 14s clip
    // With Sentinel: pause at requested analysis time (video time 3s, with 0.75s acquisition delay)
    const stopAtSec = systemMode === 'ACTIVE' ? sentinelHoldAtSec : scenarioDurationSec;
    if (delta >= stopAtSec) {
      setElapsedTime(stopAtSec);
      return;
    }
    
    setElapsedTime(delta);
    if (simulationActive) requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (simulationActive) requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [simulationActive]);

  // --- Handlers ---
  const handleToggle = (mode: SystemMode) => {
    setSystemMode(mode);
    resetSimulation();
  };

  const runPrediction = () => {
    setSimulationActive(true);
    startTimeRef.current = undefined;
  };

  const resetSimulation = () => {
    setSimulationActive(false);
    setElapsedTime(0);
    setActions([]);
    setRiskLevel(RiskLevel.SAFE);
    setTimeToHazard(null);
  };

  return (
    <div className="min-h-screen font-sans flex flex-col">
      
      {/* --- COMMAND BAR (Header) --- */}
      <header className="h-14 bg-white border-b border-ceramic-200 px-6 flex items-center justify-between shadow-sm z-50 relative">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-ceramic-900 rounded flex items-center justify-center shadow-lg ring-1 ring-black/10 overflow-hidden">
            <img
              src="/logo.png"
              alt="Sentinel"
              className="w-8 h-8 object-contain"
              draggable={false}
            />
          </div>
          <div className="flex flex-col">
             <h1 className="text-lg font-bold tracking-tight text-ceramic-900 leading-none font-sans">Sentinel.ai</h1>
             <span className="text-[9px] font-mono text-ceramic-400 uppercase tracking-widest">Autonomous Safety OS v2.4</span>
          </div>
        </div>

        {/* Global Tools */}
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1 bg-ceramic-50 rounded border border-ceramic-200">
              <div className="w-2 h-2 rounded-full bg-tech-green animate-pulse"></div>
              <span className="text-xs font-mono font-medium text-ceramic-600">SYSTEM ONLINE</span>
           </div>
        </div>
      </header>

      {/* --- WORKSPACE --- */}
      <main className="flex-1 p-6 grid grid-cols-12 gap-6 bg-transparent">
        
        {/* LEFT COLUMN: VISUALS (8 cols) */}
        <div className={`${systemMode === 'ACTIVE' ? 'col-span-12 lg:col-span-8' : 'col-span-12'} flex flex-col gap-4`}>
           
           {/* Toolbar & Controls */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              
              {/* Left: Feed Info */}
              <div className="flex items-center gap-2">
                 <VideoIcon className="w-4 h-4 text-ceramic-400" />
                 <span className="text-xs font-bold text-ceramic-600 uppercase">Live Feed // Bay B</span>
              </div>

              {/* Center: Mode Switcher (Moved Here) */}
              <div className="bg-ceramic-200 p-1 rounded-full border border-ceramic-300 shadow-inner flex relative">
                  {/* Background slider */}
                  <div className={`absolute top-1 bottom-1 w-[140px] rounded-full shadow-sm transition-all duration-300 ease-out ${
                     systemMode === 'PASSIVE' ? 'left-1 bg-white border border-tech-red/20' : 'left-[148px] bg-white border border-tech-green/20'
                  }`}></div>

                  <button 
                    onClick={() => handleToggle('PASSIVE')}
                    className={`relative z-10 px-6 py-1.5 w-[140px] rounded-full text-xs font-bold font-mono uppercase tracking-wide transition-colors duration-300 ${
                      systemMode === 'PASSIVE' ? 'text-tech-red' : 'text-ceramic-500 hover:text-ceramic-700'
                    }`}
                  >
                    Without Sentinel
                  </button>
                  <button 
                    onClick={() => handleToggle('ACTIVE')}
                    className={`relative z-10 px-6 py-1.5 w-[140px] rounded-full text-xs font-bold font-mono uppercase tracking-wide transition-colors duration-300 ${
                      systemMode === 'ACTIVE' ? 'text-tech-green' : 'text-ceramic-500 hover:text-ceramic-700'
                    }`}
                  >
                    With Sentinel
                  </button>
              </div>

              {/* Right: Action Button */}
              <button 
                onClick={simulationActive ? resetSimulation : runPrediction}
                className={`px-6 py-2 rounded font-mono text-xs font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center gap-2 ${
                  simulationActive 
                    ? 'bg-ceramic-200 text-ceramic-600 hover:bg-ceramic-300' 
                    : 'bg-ceramic-900 text-white hover:bg-black hover:shadow-xl'
                }`}
              >
                {simulationActive ? <RotateCcw className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {simulationActive ? 'Restart' : 'Run'}
              </button>
           </div>

           {/* Video Stage */}
           <div className="flex-1 min-h-[500px] relative">
              <ScenePanel 
                  entities={INITIAL_ENTITIES} 
                  predictionEnabled={simulationActive}
                  riskLevel={riskLevel}
                  timeToHazard={timeToHazard}
                  systemMode={systemMode}
              />
           </div>

           {/* Timeline Strip */}
           <div className="h-12 bg-white border border-ceramic-200 rounded p-2 flex items-center gap-4 shadow-sm">
              <span className="text-[10px] font-mono text-ceramic-400 whitespace-nowrap">TIMELINE</span>
              <div className="flex-1 h-2 bg-ceramic-100 rounded-full overflow-hidden relative">
                 {/* Ticks */}
                 <div className="absolute inset-0 flex justify-between px-2">
                    {[0,1,2,3,4,5].map(t => <div key={t} className="w-px h-full bg-ceramic-300"></div>)}
                 </div>
                 {/* Progress */}
                 <div 
                   className={`h-full transition-all duration-100 ease-linear ${systemMode === 'ACTIVE' ? 'bg-tech-green' : 'bg-tech-red'}`}
                   style={{ width: `${Math.min(100, (elapsedTime / scenarioDurationSec) * 100)}%` }}
                 />
              </div>
              <span className="text-[10px] font-mono text-ceramic-900 font-bold w-8 text-right">
                {elapsedTime.toFixed(1)}s
              </span>
           </div>
        </div>

        {/* RIGHT COLUMN: DATA (4 cols) */}
        {systemMode === 'ACTIVE' && (
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
           
           {/* Header for Panel */}
           <div className="flex items-center justify-between mb-2 pt-1">
              <div className="flex items-center gap-2">
                 <LayoutDashboard className="w-4 h-4 text-ceramic-400" />
                 <span className="text-xs font-bold text-ceramic-600 uppercase">Intelligence Stream</span>
              </div>
              <Settings className="w-4 h-4 text-ceramic-300 cursor-pointer hover:text-ceramic-600" />
           </div>

           {/* Cards */}
           <div className="flex flex-col gap-4 h-full">
              {/* Context */}
              <div className="p-4 bg-white border border-ceramic-200 rounded shadow-sm">
                 <div className="flex justify-between items-start mb-2">
                   <div className="text-[10px] font-mono text-ceramic-400 uppercase">Operational Zone</div>
                   <div className="w-1.5 h-1.5 rounded-full bg-tech-blue"></div>
                 </div>
                 <div className="text-sm font-bold text-ceramic-900">Loading Bay B-South</div>
                 <div className="text-xs text-ceramic-500 mt-1">Mixed Traffic Environment</div>
              </div>

              {/* Dynamic Logic */}
              <div className={`flex flex-col gap-4 transition-all duration-500 ${
                  systemMode === 'ACTIVE' ? 'opacity-100' : 'opacity-60 grayscale-[80%]'
              }`}>
                  <RiskSummary riskLevel={riskLevel} timeToHazard={timeToHazard} />
                  <div className="flex-1 min-h-[250px]">
                    <AgentActionPanel actions={actions} />
                  </div>
              </div>
           </div>

        </div>
        )}

      </main>

    </div>
  );
};

export default App;