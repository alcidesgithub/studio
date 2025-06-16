
export type UserRole = 'admin' | 'manager' | 'vendor' | 'store';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  storeName?: string; // For store users (vendor's company name) or store's own name
  password?: string; // Added password field
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
  currentTier?: AwardTier;
  goalProgress: number;
  positivationsDetails: PositivationDetail[];
  address?: string;
  city?: string;
  neighborhood?: string;
  state?: string; // e.g., "PR" or "SC"
  phone?: string;
  ownerName?: string;
  responsibleName?: string;
  email?: string;
  isCheckedIn: boolean; // Added for check-in status
}

export interface AwardTier {
  id: string;
  name: string; // Nome da faixa
  rewardName: string; // Nome do prêmio
  quantityAvailable: number; // Quantidade de prêmios disponíveis
  positivacoesRequired: {
    PR: number; // Positivações necessárias para lojas do Paraná
    SC: number; // Positivações necessárias para lojas de Santa Catarina
  };
  sortOrder: number; // Ordem de exibição definida pelo usuário
}

export interface Positivacao {
  id:string;
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

export interface Salesperson { // Represents the individual salesperson User
  id: string; // This would be the User ID
  vendorId: string; // ID of the Vendor company they work for
  name: string;
  phone: string;
  email: string;
}

export interface SweepstakeWinnerRecord {
  id: string; // Unique ID for this specific win
  tierId: string;
  tierName: string;
  prizeName: string;
  storeId: string;
  storeName: string; // Includes Code, Name, CNPJ, State for easy display
  drawnAt: Date | string;
}
