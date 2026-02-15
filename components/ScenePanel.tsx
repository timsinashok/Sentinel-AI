import React, { useRef, useEffect, useState } from 'react';
import { Entity, EntityType, RiskLevel, SystemMode } from '../types';
import { COLORS, SENTINEL_ANALYSIS_PAUSE_AT_SEC, SENTINEL_VIDEO_START_DELAY_SEC } from '../constants';
import { Scan, AlertTriangle, Crosshair } from 'lucide-react';

interface ScenePanelProps {
  entities: Entity[];
  predictionEnabled: boolean;
  riskLevel: RiskLevel;
  timeToHazard: number | null;
  systemMode: SystemMode;
}

const ScenePanel: React.FC<ScenePanelProps> = ({ 
  entities, 
  predictionEnabled, 
  riskLevel,
  timeToHazard,
  systemMode
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [typedUser, setTypedUser] = useState('');
  const [typedVlm, setTypedVlm] = useState('');
  const [analysisPaused, setAnalysisPaused] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [acquiring, setAcquiring] = useState(false);
  
  // Must declare this before useEffect hooks that reference it
  const isSentinelActive = systemMode === 'ACTIVE';
  
  // Video served from public/ folder
  const videoSrc = '/0.0-14.0.mp4';
  // Cropping: center the frame for "Without Sentinel", slightly higher for "With Sentinel"
  const videoObjectPosition = isSentinelActive ? '50% 35%' : '50% 50%';
  
  // Chat text (Without Sentinel only)
  const userPrompt = 'what did just happen?';
  const vlmReply =
    'A man just collided in the warehouse and was almost dead. ' +
    'The forklift and pedestrian trajectories intersected without any predictive intervention.';
  
  // Coordinate scaling
  const scaleX = (val: number) => val * 8; // 0-100 -> 0-800
  const scaleY = (val: number) => val * 6; // 0-100 -> 0-600

  // Auto-play management
  useEffect(() => {
    const video = videoRef.current;
    if (video && !videoError) {
      if (predictionEnabled) {
        setVideoEnded(false);
        setTypedUser('');
        setTypedVlm('');
        setAnalysisPaused(false);
        setAnalysisStep(0);

        // With Sentinel: simulate feed acquisition delay before playback
        if (isSentinelActive) {
          setAcquiring(true);
          const t = window.setTimeout(() => {
            setAcquiring(false);
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch((error) => {
                console.log('Autoplay prevented:', error);
              });
            }
          }, SENTINEL_VIDEO_START_DELAY_SEC * 1000);
          return () => window.clearTimeout(t);
        }

        // Without Sentinel: play immediately
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log('Autoplay prevented:', error);
          });
        }
      } else {
        video.pause();
        video.currentTime = 0;
        setVideoEnded(false);
        setTypedUser('');
        setTypedVlm('');
        setAnalysisPaused(false);
        setAnalysisStep(0);
        setAcquiring(false);
      }
    }
  }, [predictionEnabled, videoError, isSentinelActive]);

  // Chat typewriter after the clip ends (Without Sentinel only)
  useEffect(() => {
    if (!videoEnded || isSentinelActive) return;

    setTypedUser('');
    setTypedVlm('');

    let userIdx = 0;
    let vlmIdx = 0;
    let phase: 'user' | 'pause' | 'vlm' = 'user';

    const id = window.setInterval(() => {
      if (phase === 'user') {
        userIdx += 1;
        setTypedUser(userPrompt.slice(0, userIdx));
        if (userIdx >= userPrompt.length) phase = 'pause';
        return;
      }

      if (phase === 'pause') {
        // brief pause before VLM starts "typing"
        phase = 'vlm';
        return;
      }

      vlmIdx += 1;
      setTypedVlm(vlmReply.slice(0, vlmIdx));
      if (vlmIdx >= vlmReply.length) window.clearInterval(id);
    }, 39); // ~10% slower typing

    return () => window.clearInterval(id);
  }, [videoEnded, isSentinelActive, userPrompt, vlmReply]);

  // Analysis steps after pausing at 3 seconds (With Sentinel only)
  useEffect(() => {
    if (!analysisPaused || !isSentinelActive) return;
    setAnalysisStep(0);
    const steps = 5;
    const id = window.setInterval(() => {
      setAnalysisStep((s) => {
        const next = s + 1;
        if (next >= steps) window.clearInterval(id);
        return next;
      });
    }, 700);
    return () => window.clearInterval(id);
  }, [analysisPaused, isSentinelActive]);

  return (
    <div className={`relative w-full h-full bg-black overflow-hidden shadow-2xl transition-all duration-500 group ${
      isSentinelActive ? 'ring-1 ring-emerald-500/30' : 'ring-1 ring-red-500/30'
    }`}>
      
      {/* -------------------------------------------------------- */}
      {/* VIDEO LAYER */}
      {/* -------------------------------------------------------- */}
      <div className="absolute inset-0 z-0">
        {!videoError ? (
          <video
            ref={videoRef}
            className={`w-full h-full object-cover transition-opacity duration-500 ${isSentinelActive ? 'opacity-80 grayscale-[30%]' : 'opacity-100 grayscale-0'}`}
            style={{ objectPosition: videoObjectPosition }}
            muted
            playsInline
            preload="auto"
            // Ensure the first frame shows even before "Initiate Scenario"
            onLoadedData={() => {
              const v = videoRef.current;
              if (v && !predictionEnabled) v.pause();
            }}
            // We want an "end" moment for the typewriter overlay
            loop={false}
            onTimeUpdate={() => {
              const v = videoRef.current;
              if (!v) return;
              if (!isSentinelActive) return;
              if (!predictionEnabled) return;
              if (analysisPaused) return;
              if (v.currentTime >= SENTINEL_ANALYSIS_PAUSE_AT_SEC) {
                v.pause();
                setAnalysisPaused(true);
              }
            }}
            onError={(e) => {
              console.error("Video error:", e);
              setVideoError(true);
            }}
            onEnded={() => {
              // Only show the incident narration after running the scenario
              if (predictionEnabled) setVideoEnded(true);
            }}
            src={videoSrc}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-500">
             <div className="w-16 h-16 border-2 border-zinc-700 border-dashed rounded-full animate-spin mb-4"></div>
             <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">Video Signal Lost</span>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------- */}
      {/* HUD: TECHNICAL OVERLAY (Always On) */}
      {/* -------------------------------------------------------- */}
      <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
        {/* Top Bar */}
        <div className="flex justify-between items-start">
           <div className="flex gap-2">
              <div className="bg-black/50 backdrop-blur-sm border border-white/10 px-2 py-1 rounded text-[10px] font-mono text-white/70 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                 LIVE FEED
              </div>
              <div className="bg-black/50 backdrop-blur-sm border border-white/10 px-2 py-1 rounded text-[10px] font-mono text-white/70">
                 CAM-04-B
              </div>
           </div>
           <div className="bg-black/50 backdrop-blur-sm border border-white/10 px-2 py-1 rounded text-[10px] font-mono text-white/70">
              1080p • 60FPS
           </div>
        </div>

        {/* Center Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
           <Crosshair className="w-12 h-12 text-white stroke-[0.5]" />
        </div>

        {/* Bottom Bar */}
        <div className="flex justify-between items-end">
           <div className="text-[10px] font-mono text-white/50">
             LAT: 34.0522 N <br/>
             LON: 118.2437 W
           </div>
           
           {/* Sentinel Badge */}
           <div className={`flex items-center gap-3 px-4 py-2 rounded border backdrop-blur-md transition-all duration-500 ${
             isSentinelActive 
               ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' 
               : 'bg-red-950/80 border-red-500/50 text-red-400'
           }`}>
              {isSentinelActive ? <Scan className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-wider leading-none">
                  {isSentinelActive ? 'SENTINEL PROTECTION' : 'UNPROTECTED MODE'}
                </span>
                <span className="text-[9px] opacity-70 leading-none mt-1">
                  {isSentinelActive ? 'PREDICTIVE MODELS ENGAGED' : 'STANDARD OBSERVATION'}
                </span>
              </div>
           </div>
        </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/* HUD: AR LAYER (With Sentinel) */}
      {/* -------------------------------------------------------- */}
      {isSentinelActive && (
        <svg viewBox="0 0 800 600" className="absolute inset-0 w-full h-full z-20 pointer-events-none">
          {/* Grid Overlay for Depth */}
          <defs>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Predictions */}
          {predictionEnabled && entities.map(entity => {
             const x = scaleX(entity.position.x);
             const y = scaleY(entity.position.y);
             const destX = scaleX(entity.path[1].x); 
             const destY = scaleY(entity.path[1].y);
             
             return (
               <g key={`path-${entity.id}`}>
                 {/* Projected Path */}
                 <line 
                   x1={x} y1={y} x2={destX} y2={destY}
                   stroke={riskLevel === RiskLevel.CRITICAL ? COLORS.hazard : COLORS.forklift}
                   strokeWidth="1"
                   strokeDasharray="4,4"
                   opacity="0.8"
                 />
                 {/* Destination Marker */}
                 <circle cx={destX} cy={destY} r="3" fill="none" stroke={COLORS.forklift} opacity="0.6" />
                 <text x={destX + 5} y={destY} fill={COLORS.forklift} fontSize="8" fontFamily="monospace" opacity="0.8">T+5s</text>
               </g>
             );
          })}

          {/* Bounding Boxes */}
          {entities.map(entity => {
              const x = scaleX(entity.position.x);
              const y = scaleY(entity.position.y);
              const isHazard = riskLevel === RiskLevel.CRITICAL;
              const color = isHazard ? '#EF4444' : '#10B981'; // Red or Tech Green
              const label =
                entity.type === EntityType.FORKLIFT ? 'F-12' : entity.type === EntityType.HUMAN ? 'H-04' : entity.id;

              return (
                <g key={`box-${entity.id}`} transform={`translate(${x}, ${y})`}>
                  {/* Bracket Corners Style */}
                  <path d="M -30 -30 L -20 -30 M -30 -30 L -30 -20" stroke={color} strokeWidth="2" fill="none" />
                  <path d="M 30 -30 L 20 -30 M 30 -30 L 30 -20" stroke={color} strokeWidth="2" fill="none" />
                  <path d="M -30 30 L -20 30 M -30 30 L -30 20" stroke={color} strokeWidth="2" fill="none" />
                  <path d="M 30 30 L 20 30 M 30 30 L 30 20" stroke={color} strokeWidth="2" fill="none" />

                  {/* Tracking Dot */}
                  <circle r="2" fill={color} className="animate-pulse" />

                  {/* Data Tag */}
                  <g transform="translate(35, -30)">
                    <rect x="0" y="0" width="60" height="24" fill="rgba(0,0,0,0.7)" stroke={color} strokeWidth="0.5" rx="2" />
                    <text x="5" y="10" fill="white" fontSize="8" fontFamily="monospace" fontWeight="bold">{label}</text>
                    <text x="5" y="20" fill={color} fontSize="7" fontFamily="monospace">
                       {entity.type === EntityType.FORKLIFT ? 'VEL: 1.5m/s' : 'VEL: 0.8m/s'}
                    </text>
                  </g>
                </g>
              );
          })}
        </svg>
      )}

      {/* -------------------------------------------------------- */}
      {/* Sentinel Analysis Pause Overlay (With Sentinel) */}
      {/* -------------------------------------------------------- */}
      {isSentinelActive && analysisPaused && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center p-6 bg-black/45 backdrop-blur-[2px]">
          <div className="max-w-3xl w-full">
            <div className="bg-black/80 border border-emerald-400/20 rounded-xl shadow-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="text-xs font-mono text-emerald-300 uppercase tracking-widest">
                  Sentinel AI • World Model Forecast
                </div>
                <div className="text-[10px] font-mono text-white/60">
                  paused @ {SENTINEL_ANALYSIS_PAUSE_AT_SEC.toFixed(1)}s
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-bold text-white">What Sentinel is doing</div>
                  <div className="text-xs text-white/70 leading-relaxed">
                    Sentinel’s world model looks into possible futures, identifies a potential hazard, and uses a Monitoring
                    Agent to decide the safest intervention.
                  </div>

                  <div className="mt-4 text-[10px] font-mono text-white/50 uppercase tracking-widest">
                    Running process
                  </div>
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 text-xs font-mono ${analysisStep >= 1 ? 'text-emerald-200' : 'text-white/40'}`}>
                      <span className="w-2 h-2 rounded-full bg-emerald-400/70 animate-pulse" />
                      World Model: forecasting trajectories (forklift + pedestrian)
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-mono ${analysisStep >= 2 ? 'text-emerald-200' : 'text-white/40'}`}>
                      <span className="w-2 h-2 rounded-full bg-emerald-400/70 animate-pulse" />
                      Threat: potential aisle intersection collision detected
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-mono ${analysisStep >= 3 ? 'text-emerald-200' : 'text-white/40'}`}>
                      <span className="w-2 h-2 rounded-full bg-emerald-400/70 animate-pulse" />
                      Monitoring Agent: evaluating mitigation options
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-mono ${analysisStep >= 4 ? 'text-emerald-200' : 'text-white/40'}`}>
                      <span className="w-2 h-2 rounded-full bg-emerald-400/70 animate-pulse" />
                      Decision: kill power to warehouse vehicle (kill switch)
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-mono ${analysisStep >= 5 ? 'text-emerald-200' : 'text-white/40'}`}>
                      <span className="w-2 h-2 rounded-full bg-emerald-400/70 animate-pulse" />
                      Action: inform supervisor + log incident context
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-bold text-white">Recommended actions</div>
                  <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="text-xs font-mono text-white/60 uppercase tracking-widest">Primary</div>
                    <div className="text-sm font-bold text-emerald-200 mt-1">Kill switch for vehicle (F-12)</div>
                    <div className="text-xs text-white/70 mt-1">
                      Immediately disable power to eliminate kinetic energy in the shared aisle.
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="text-xs font-mono text-white/60 uppercase tracking-widest">Secondary</div>
                    <div className="text-sm font-bold text-emerald-200 mt-1">Inform supervisor</div>
                    <div className="text-xs text-white/70 mt-1">
                      Notify shift lead with location, context, and recommended safety protocol.
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-white/50">
                    Dashboard updates are shown on the right.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acquiring overlay (With Sentinel) */}
      {isSentinelActive && acquiring && (
        <div className="absolute inset-0 z-[40] flex items-center justify-center bg-black/35 backdrop-blur-[1px]">
          <div className="px-4 py-2 rounded border border-white/10 bg-black/70 text-[10px] font-mono text-white/70 uppercase tracking-widest">
            Acquiring feed… ({SENTINEL_VIDEO_START_DELAY_SEC.toFixed(2)}s)
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* BIG RED WARNING (Collision) - ONLY in With Sentinel mode */}
      {/* -------------------------------------------------------- */}
      {isSentinelActive && riskLevel === RiskLevel.COLLISION && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-500/20 backdrop-blur-[2px]">
           <div className="bg-red-600 text-white px-8 py-6 rounded border-4 border-white shadow-2xl animate-bounce flex flex-col items-center">
             <AlertTriangle className="w-12 h-12 mb-2" />
             <div className="text-3xl font-black font-sans tracking-tighter">IMPACT DETECTED</div>
             <div className="font-mono text-sm uppercase mt-1">System Failure • Manual Override Required</div>
           </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* VLM CONVERSATION (After video ends - Without Sentinel only) */}
      {/* -------------------------------------------------------- */}
      {videoEnded && !isSentinelActive && (
        <div className="absolute inset-0 z-[60] flex items-end justify-start p-6 bg-black/40 backdrop-blur-[2px]">
          <div className="max-w-2xl w-full">
            <div className="bg-black/80 border border-white/20 rounded-lg p-5 shadow-2xl">
              <div className="text-[10px] font-mono text-white/50 uppercase tracking-widest mb-3">
                Vision Language Model • Analysis
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white/10 border border-white/10 px-4 py-3">
                    <div className="text-[10px] font-mono text-white/50 mb-1">User</div>
                    <div className="text-sm font-mono text-white/95">
                      {typedUser}
                      {!typedVlm && (
                        <span className="inline-block w-2 h-4 bg-white/80 align-baseline animate-pulse ml-0.5">▌</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-emerald-500/10 border border-emerald-400/20 px-4 py-3">
                    <div className="text-[10px] font-mono text-emerald-200/70 mb-1">VLM</div>
                    <div className="text-sm font-mono text-white/95 leading-relaxed">
                      {typedVlm}
                      <span className="inline-block w-2 h-4 bg-white/80 align-baseline animate-pulse ml-0.5">▌</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenePanel;