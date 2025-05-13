export const SLOT_COLORS = {
  'SLOT 1': '#FF6B6B',
  'SLOT 2': '#4ECDC4',
  'SLOT 3': '#45B7D1',
  'SLOT 4': '#96CEB4',
  'SLOT 5': '#FF9000',
  'SLOT 6': '#D4A5A5',
  'SLOT 7': '#9B59B6'
} as const;

export const DEPARTMENT_COLORS = {
  'AppDev': '#FF6B6B', // Coral red
  'QA': '#4ECDC4',     // Turquoise
  'DMR': '#45B7D1',    // Sky blue
  'NOC': '#96CEB4',    // Sage green
  'Others': '#D4A5A5'  // Dusty rose
} as const;

export interface Event {
  id: string;
  title: string;
  department: keyof typeof DEPARTMENT_COLORS;
  start: Date;
  end: Date;
  timeslot: Timeslot;
  resources: Resource[];
  attendees?: number;
  createdBy: string;
}

export interface Timeslot {
  id: number;
  start: string;
  end: string;
}

export interface Resource {
  id: number;
}