import type { Event, Store, AwardTier, User, UserRole, SweepstakeEntry, Vendor } from '@/types';

export const MOCK_EVENT: Event = {
  id: 'evt_1',
  name: 'Hiperfarma Annual Business Meeting 2024',
  date: new Date(2024, 10, 15).toISOString(), // November 15, 2024
  time: '09:00 AM - 06:00 PM',
  location: 'Expo Center Norte - São Paulo',
  address: 'R. José Bernardo Pinto, 333 - Vila Guilherme, São Paulo - SP, 02055-000, Brazil',
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3658.751125584852!2d-46.62604808502391!3d-23.50639278471017!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce58e5da7f7669%3A0x7d23f718d8d97379!2sExpo%20Center%20Norte!5e0!3m2!1sen!2sbr!4v1678886047605!5m2!1sen!2sbr'
};

export const MOCK_STORES: Store[] = [
  { id: 'store_1', name: 'Hiperfarma Matriz', participating: true, positivacoes: 5, goalProgress: 75, currentTier: {id: 'tier_1', name: 'Bronze', qualificationCriteria: '3 positivacoes', reward: 'R$100 Voucher'} },
  { id: 'store_2', name: 'Hiperfarma Filial Centro', participating: true, positivacoes: 2, goalProgress: 40 },
  { id: 'store_3', name: 'Hiperfarma Shopping Norte', participating: false, positivacoes: 0, goalProgress: 0 },
  { id: 'store_4', name: 'Hiperfarma Av. Paulista', participating: true, positivacoes: 8, goalProgress: 100, currentTier: {id: 'tier_2', name: 'Silver', qualificationCriteria: '7 positivacoes', reward: 'R$250 Voucher'} },
];

export const MOCK_AWARD_TIERS: AwardTier[] = [
  { id: 'tier_1', name: 'Bronze', qualificationCriteria: '3+ Positivações', reward: 'R$100 Gift Card' },
  { id: 'tier_2', name: 'Silver', qualificationCriteria: '7+ Positivações', reward: 'R$250 Gift Card' },
  { id: 'tier_3', name: 'Gold', qualificationCriteria: '10+ Positivações & 90% Success Rate', reward: 'R$500 Gift Card + Feature' },
];

export const MOCK_USERS: User[] = [
  { id: 'user_admin', email: 'admin@hiperfarma.com', role: 'admin', name: 'Admin User' },
  { id: 'user_manager', email: 'manager@hiperfarma.com', role: 'manager', name: 'Manager User' },
  { id: 'user_vendor', email: 'vendor@supplier.com', role: 'vendor', name: 'Vendor Rep' },
  { id: 'user_store', email: 'store1@hiperfarma.com', role: 'store', name: 'Store Staff Matriz', storeName: 'Hiperfarma Matriz' },
];

export const MOCK_SWEEPSTAKE_ENTRIES: SweepstakeEntry[] = MOCK_STORES
  .filter(s => s.participating && s.positivacoes > 0)
  .map(s => ({
    storeId: s.id,
    storeName: s.name,
    qualificationRate: s.goalProgress / 100,
  }));

export const ROLES: UserRole[] = ['admin', 'manager', 'vendor', 'store'];

export const MOCK_VENDORS: Vendor[] = [
  { id: 'vendor_1', name: 'PharmaCorp', logoUrl: 'https://placehold.co/200x100.png?text=PharmaCorp', dataAiHint: "pharmacy logo" },
  { id: 'vendor_2', name: 'HealthPlus', logoUrl: 'https://placehold.co/200x100.png?text=HealthPlus', dataAiHint: "health logo" },
  { id: 'vendor_3', name: 'BioMed', logoUrl: 'https://placehold.co/200x100.png?text=BioMed', dataAiHint: "medical science" },
  { id: 'vendor_4', name: 'NutriWell', logoUrl: 'https://placehold.co/200x100.png?text=NutriWell', dataAiHint: "nutrition health" },
  { id: 'vendor_5', name: 'CareFirst', logoUrl: 'https://placehold.co/200x100.png?text=CareFirst', dataAiHint: "healthcare logo" },
  { id: 'vendor_6', name: 'MediSupply', logoUrl: 'https://placehold.co/200x100.png?text=MediSupply', dataAiHint: "medical supply" },
];
