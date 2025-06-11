
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

export interface PositivationDetail {
  vendorId: string;
  vendorName: string;
  vendorLogoUrl: string;
  vendorDataAiHint?: string;
  date: string; // ISO string
  // salespersonName?: string; // Future enhancement
  // salespersonEmail?: string; // Future enhancement
}

export interface Store {
  id: string;
  code: string; // Código da loja
  name: string; // Razão Social
  cnpj: string; // CNPJ da loja
  participating: boolean;
  // positivacoes: number; // This will be derived from positivationsDetails.length
  currentTier?: AwardTier; // This might need to be re-evaluated
  goalProgress: number; // General progress, might be different from tier progress
  positivationsDetails: PositivationDetail[];
}

export interface AwardTier {
  id: string;
  name: string; // Nome da faixa
  rewardName: string; // Nome do prêmio
  quantityAvailable: number; // Quantidade de prêmios disponíveis
  positivacoesRequired: number; // Meta de positivações exigida (número inteiro)
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
  name: string; // Empresa
  cnpj: string;
  address: string;
  city: string;
  neighborhood: string;
  state: string; // e.g., "PR" or "SC"
  logoUrl: string;
  dataAiHint?: string;
  website?: string; // Optional link to vendor's website
}

export interface Salesperson {
  id: string;
  vendorId: string;
  name: string;
  phone: string;
  email: string;
  password?: string; // For login (mock)
}

// Added for sweepstakes-by-tier page state persistence
export interface SweepstakeWinnerRecord {
  tierId: string;
  tierName: string;
  prizeName: string;
  storeId: string;
  storeName: string;
  drawnAt: Date | string; // Allow string for JSON, convert to Date on load
}
