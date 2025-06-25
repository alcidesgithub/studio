
// This User type is for our application's representation, specific to localStorage auth.
export type UserRole = 'admin' | 'manager' | 'vendor' | 'store' | 'equipe';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  password?: string; // Only present in localStorage version for mock auth
  storeName?: string; // For 'store' or 'vendor' roles, can represent the company/store name
}

export interface Event {
  id: string;
  name: string;
  date: string; // ISO string
  time: string; // e.g., "10:00 AM - 5:00 PM"
  location: string;
  address: string; // For map
  mapEmbedUrl: string;
  vendorGuideUrl?: string; // Data URL for vendor PDF guide
  associateGuideUrl?: string; // Data URL for associate PDF guide
}

export interface PositivationDetail {
  vendorId: string; // ID of the Vendor company
  vendorName: string; // Name of the Vendor company
  vendorLogoUrl: string; // Logo of the Vendor company
  date: string; // ISO string
  salespersonId?: string; // ID of the Salesperson User who performed the positivation
  salespersonName?: string; // Name of the Salesperson User who performed the positivation
}

export interface Store {
  id: string;
  code: string; // Código da loja
  name: string; // Razão Social
  cnpj: string; // CNPJ da loja
  participating: boolean;
  goalProgress: number; // Percentage 0-100
  positivationsDetails: PositivationDetail[];
  currentTier?: AwardTier; // Dynamic based on positivations
  isCheckedIn: boolean;
  address?: string;
  city?: string;
  neighborhood?: string;
  state?: string; // e.g., "PR" or "SC"
  phone?: string;
  ownerName?: string;
  responsibleName?: string; // Name of the person responsible for the store's system login
  email?: string; // Contact email for the store, not necessarily the login email
  isMatrix: boolean;
  matrixStoreId?: string; // ID of the matrix store, if this is a branch
}

export interface AwardTier {
  id: string;
  name: string; // Nome da faixa
  rewardName: string; // Nome do prêmio
  quantityAvailable: number; // Quantidade de prêmios disponíveis
  positivacoesRequired: {
    PR: number;
    SC: number;
  };
  sortOrder: number; // For display and sweepstake order
}


export interface SweepstakeEntry { // For sweepstake logic
  storeId: string;
  storeName: string;
  qualificationRate: number; // e.g., how many "tickets" or how much "weight"
}

export interface SweepstakeResult extends SweepstakeEntry { // For sweepstake logic
  prize: string;
}

export interface Vendor { // Represents the Vendor Company
  id: string;
  name: string;
  cnpj: string;
  address: string;
  city: string;
  neighborhood: string;
  state: string;
  logoUrl: string;
  website?: string;
}

export interface Salesperson { // Represents an individual salesperson linked to a Vendor
  id: string; // Corresponds to a User ID with role 'vendor'
  vendorId: string; // FK to Vendor.id
  name: string;
  phone: string;
  email: string; // Login email
  password?: string; // For localStorage mock auth
}

export interface SweepstakeWinnerRecord {
  id: string; // Unique ID for this specific win
  tierId: string;
  tierName: string;
  prizeName: string;
  storeId: string;
  storeName: string; // Denormalized for easy display (Code, Name, CNPJ, State)
  drawnAt: Date | string; // Timestamp of when the draw occurred
}
