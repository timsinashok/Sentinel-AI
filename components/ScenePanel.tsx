import React, { useRef, useEffect, useState } from 'react';
import { Entity, EntityType, RiskLevel, SystemMode } from '../types';
import {
  COLORS,
  SENTINEL_DETECT_AT_SEC,
  SENTINEL_KILL_SWITCH_AT_SEC,
  SENTINEL_NOTIFY_SUPERVISOR_AT_SEC,
  SENTINEL_MITIGATE_AT_SEC,
  SENTINEL_OBSERVE_OVERLAY_AT_SEC,
  SENTINEL_VIDEO_START_DELAY_SEC,
} from '../constants';
import { Scan, AlertTriangle, Crosshair, ChevronRight, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

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
  const [acquiring, setAcquiring] = useState(false);
  const [videoTimeSec, setVideoTimeSec] = useState(0);
  const [sentinelDetected, setSentinelDetected] = useState(false);
  const [sentinelDetectedAtMs, setSentinelDetectedAtMs] = useState<number | null>(null);
  const [sentinelNowMs, setSentinelNowMs] = useState(0);
  
  // Must declare this before useEffect hooks that reference it
  const isSentinelActive = systemMode === 'ACTIVE';
  
  // Video served from public/ folder
  const videoSrc = '/0.0-14.0.mp4';
  // Cropping: center the frame for "Without Sentinel", slightly higher for "With Sentinel"
  const videoObjectPosition = isSentinelActive ? '50% 35%' : '50% 50%';
  
  // Chat text (Without Sentinel only)
  const userPrompt = 'what did just happen?';
  const vlmReply =
    'A drowsy forklift driver collided with items rack in the warehouse and was almost buried by the falling debris.';
  
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
        setVideoTimeSec(0);

        // With Sentinel: simulate feed acquisition delay before playback
        if (isSentinelActive) {
          setAcquiring(true);
          const t = window.setTimeout(() => {
            setAcquiring(false);
            setSentinelDetected(false);
            setSentinelDetectedAtMs(null);
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
        setAcquiring(false);
        setVideoTimeSec(0);
        setSentinelDetected(false);
        setSentinelDetectedAtMs(null);
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

  const showObserve =
    isSentinelActive && predictionEnabled && !videoEnded;
  const showDetect = isSentinelActive && predictionEnabled && sentinelDetected;
  const showMitigate = isSentinelActive && predictionEnabled && sentinelDetected;
  const showAr =
    isSentinelActive && predictionEnabled && !acquiring && videoTimeSec >= SENTINEL_DETECT_AT_SEC;

  // Smooth timer for post-detect UI (even though video is paused)
  useEffect(() => {
    if (!sentinelDetectedAtMs) return;
    let raf = 0;
    const tick = () => {
      setSentinelNowMs(performance.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sentinelDetectedAtMs]);

  const postDetectMs = sentinelDetectedAtMs ? Math.max(0, sentinelNowMs - sentinelDetectedAtMs) : 0;
  const showDeciding = showDetect && postDetectMs < 700;
  const showKillChecked = showDetect && postDetectMs >= 900;
  const showNotifyChecked = showDetect && postDetectMs >= 1250;

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
            className={`w-full h-full object-cover transition-opacity duration-500 ${isSentinelActive ? 'opacity-90 grayscale-[15%]' : 'opacity-100 grayscale-0'}`}
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
              setVideoTimeSec(v.currentTime);
              if (!isSentinelActive) return;
              if (!predictionEnabled) return;
              if (sentinelDetected) return;
              if (v.currentTime >= SENTINEL_DETECT_AT_SEC) {
                // Pause the video and hold on the detected frame
                v.pause();
                setSentinelDetected(true);
                const now = performance.now();
                setSentinelDetectedAtMs(now);
                setSentinelNowMs(now);
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
      {showAr && (
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

              return (
                <g key={`box-${entity.id}`} transform={`translate(${x}, ${y})`}>
                  {/* Bracket Corners Style */}
                  <path d="M -30 -30 L -20 -30 M -30 -30 L -30 -20" stroke={color} strokeWidth="2" fill="none" />
                  <path d="M 30 -30 L 20 -30 M 30 -30 L 30 -20" stroke={color} strokeWidth="2" fill="none" />
                  <path d="M -30 30 L -20 30 M -30 30 L -30 20" stroke={color} strokeWidth="2" fill="none" />
                  <path d="M 30 30 L 20 30 M 30 30 L 30 20" stroke={color} strokeWidth="2" fill="none" />

                  {/* Tracking Dot */}
                  <circle r="2" fill={color} className="animate-pulse" />
                </g>
              );
          })}
        </svg>
      )}

      {/* -------------------------------------------------------- */}
      {/* Sentinel Story Overlay (With Sentinel) */}
      {/* -------------------------------------------------------- */}
      {/* Subtle red tint when a future hazard is detected */}
      {showDetect && (
        <div className="absolute inset-0 z-[22] pointer-events-none transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/25 via-red-600/10 to-black/40" />
          <div className="absolute inset-0 bg-black/15" />
        </div>
      )}

      {/* Observing pill (always, With Sentinel) */}
      {showObserve && isSentinelActive && (
        <div className="absolute top-20 left-6 z-[30] pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/70 border border-white/10 backdrop-blur text-[11px] font-mono text-white/80">
            <span className="w-2 h-2 rounded-full bg-emerald-300/70 animate-pulse" />
            Sentinel AI observing…
          </div>
        </div>
      )}

      {/* Detection + mitigation headline */}
      {showDetect && (
        <div className="absolute inset-0 z-[35] flex items-center justify-center pointer-events-none px-6">
          <div className="w-full max-w-2xl">
            <div className="rounded-2xl bg-black/75 border border-white/10 backdrop-blur px-6 py-5 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <div className="text-[10px] font-mono text-emerald-200/80 uppercase tracking-widest">
                      Sentinel AI
                    </div>
                  </div>
                  <div className="mt-1 text-2xl font-black tracking-tight text-white">
                    Potential hazard detected
                  </div>
                  <div className="mt-1 text-xs text-white/70">
                    Sentinel AI predicts the future and detects what can go wrong.
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  {showDeciding ? (
                    <>
                      <Loader2 className="w-4 h-4 text-white/70 animate-spin" />
                      <div className="text-[10px] font-mono text-white/70 uppercase tracking-widest">
                        Mitigation Agent deciding
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <div className="text-[10px] font-mono text-emerald-200/80 uppercase tracking-widest">
                        Mitigation executing
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-white/75">
                <span className={`px-2 py-1 rounded-full border ${videoTimeSec >= SENTINEL_OBSERVE_OVERLAY_AT_SEC ? 'border-emerald-300/30 bg-white/5' : 'border-white/10 bg-white/0 opacity-60'}`}>
                  Observe
                </span>
                <ChevronRight className="w-4 h-4 text-white/30" />
                <span className={`px-2 py-1 rounded-full border ${videoTimeSec >= SENTINEL_OBSERVE_OVERLAY_AT_SEC + 0.3 ? 'border-emerald-300/30 bg-white/5' : 'border-white/10 bg-white/0 opacity-60'}`}>
                  Predict
                </span>
                <ChevronRight className="w-4 h-4 text-white/30" />
                <span className={`px-2 py-1 rounded-full border ${videoTimeSec >= SENTINEL_DETECT_AT_SEC ? 'border-red-300/30 bg-red-500/10' : 'border-white/10 bg-white/0 opacity-60'}`}>
                  Detect
                </span>
                <ChevronRight className="w-4 h-4 text-white/30" />
                <span className={`px-2 py-1 rounded-full border ${showMitigate ? 'border-emerald-300/30 bg-emerald-500/10' : 'border-white/10 bg-white/0 opacity-60'}`}>
                  Mitigate
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Arrow pointing to the right panel when mitigation starts */}
      {showMitigate && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-[36] pointer-events-none hidden lg:block">
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-mono text-white/70 uppercase tracking-widest">
              Actions
            </div>
            <div className="w-20 h-px bg-gradient-to-r from-white/10 to-emerald-300/60" />
            <div className="w-0 h-0 border-l-[10px] border-l-emerald-300/60 border-y-[6px] border-y-transparent" />
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