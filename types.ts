export enum RiskLevel {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  COLLISION = 'COLLISION'
}

export enum EntityType {
  FORKLIFT = 'FORKLIFT',
  HUMAN = 'HUMAN',
  ROBOT = 'ROBOT'
}

export type SystemMode = 'PASSIVE' | 'ACTIVE';

export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  position: Position;
  velocity: Position; // Vector
  heading: number; // Degrees
  path: Position[]; // Future path
}

export interface MitigationAction {
  id: string;
  timestamp: number;
  action: string;
  targetId: string;
  rationale: string;
  status: 'PENDING' | 'EXECUTED';
}

export interface SimulationState {
  isPlaying: boolean;
  currentTime: number; // 0 to 100 (percentage of scenario)
  riskLevel: RiskLevel;
  timeToHazard: number | null; // Seconds
  entities: Entity[];
  actions: MitigationAction[];
}