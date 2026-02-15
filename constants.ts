import { Entity, EntityType } from './types';

// Simulation Constants
export const SIMULATION_DURATION_SEC = 10;
export const HAZARD_THRESHOLD_SEC = 3.2; 
export const PREDICTION_WINDOW_SEC = 5; 

// Demo timing (With Sentinel)
export const SENTINEL_VIDEO_START_DELAY_SEC = 0.75;
// Story beats (relative to video time, after the start delay)
export const SENTINEL_OBSERVE_OVERLAY_AT_SEC = 3.0;
export const SENTINEL_DETECT_AT_SEC = 3.6;
export const SENTINEL_MITIGATE_AT_SEC = 4.1;

// Decision timings (relative to video time)
export const SENTINEL_KILL_SWITCH_AT_SEC = 4.5;
export const SENTINEL_NOTIFY_SUPERVISOR_AT_SEC = 4.9;

// Colors - Redesigned for Light Mode / High Visibility overlay
export const COLORS = {
  bg: '#ffffff',
  grid: '#e5e7eb', // Light gray grid
  text: '#111827', // Black text
  textHighlight: '#111827',
  
  // High contrast bounding box colors
  forklift: '#2563EB', // Bright Blue
  human: '#ffffff', // White
  
  path: '#94a3b8',
  prediction: '#F59E0B', // Amber
  hazard: '#DC2626', // Deep Red
  safe: '#10B981', // Emerald
};

// Initial Entities State (Static positions for now as requested)
export const INITIAL_ENTITIES: Entity[] = [
  {
    id: 'Trigger Kill Switch MCP',
    type: EntityType.FORKLIFT,
    position: { x: 30, y: 55 },
    velocity: { x: 1.5, y: 0 },
    heading: 90,
    path: [{ x: 30, y: 55 }, { x: 90, y: 55 }],
  },
  {
    id: 'H-04',
    type: EntityType.HUMAN,
    position: { x: 65, y: 20 },
    velocity: { x: 0, y: 1.2 },
    heading: 180,
    path: [{ x: 65, y: 20 }, { x: 65, y: 90 }],
  }
];