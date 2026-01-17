
export enum SystemStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  EXECUTING = 'EXECUTING',
  AWAITING_PERMISSION = 'AWAITING_PERMISSION'
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  JOBS = 'JOBS',
  BOOKINGS = 'BOOKINGS',
  SECURITY = 'SECURITY'
}

export interface SystemStats {
  cpu: number;
  ram: number;
  network: string;
}

export interface SecurityLog {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  time: string;
}

export interface AutomationLog {
  id: string;
  timestamp: Date;
  source: 'SYSTEM' | 'SYLVIE' | 'NETWORK';
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface ActiveTask {
  id: string;
  name: string;
  progress: number;
  status: 'running' | 'paused' | 'completed';
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
