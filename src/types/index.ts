export type UserRole = 'admin' | 'manager' | 'vendor' | 'store';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  storeName?: string; // For store users
}

export interface Event {
  id: string;
  name: string;
  date: string; // ISO string
  time: string; // e.g., "10:00 AM - 5:00 PM"
  location: string;
  address: string; // For map
  mapEmbedUrl: string;
}

export interface Store {
  id: string;
  name: string;
  participating: boolean;
  positivacoes: number;
  currentTier?: AwardTier;
  goalProgress: number; // Percentage towards next tier or event goal
}

export interface AwardTier {
  id: string;
  name: string;
  qualificationCriteria: string; // e.g., "5 positivacoes"
  reward: string;
}

export interface Positivacao {
  id: string;
  vendorId: string;
  storeId: string;
  eventId: string;
  timestamp: string; // ISO string
}

export interface SweepstakeEntry {
  storeId: string;
  storeName: string;
  qualificationRate: number; // e.g. 0.8 for 80%
}

export interface SweepstakeResult extends SweepstakeEntry {
  prize: string;
}

export interface Vendor {
  id: string;
  name: string;
  logoUrl: string;
  website?: string; // Optional link to vendor's website
}
