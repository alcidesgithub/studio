
import type { Event, Store, AwardTier, User, UserRole, SweepstakeEntry, Vendor, Salesperson } from '@/types';

export const MOCK_EVENT: Event = {
  id: 'evt_1',
  name: 'Hiperfarma Annual Business Meeting 2024',
  date: new Date(2024, 10, 15).toISOString(), // November 15, 2024
  time: '09:00 AM - 06:00 PM',
  location: 'Expo Center Norte - São Paulo',
  address: 'R. José Bernardo Pinto, 333 - Vila Guilherme, São Paulo - SP, 02055-000, Brazil',
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3658.751125584852!2d-46.62604808502391!3d-23.50639278471017!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce58e5da7f7669%3A0x7d23f718d8d97379!2sExpo%20Center%20Norte!5e0!3m2!1sen!2sbr!4v1678886047605!5m2!1sen!2sbr'
};

export const MOCK_AWARD_TIERS: AwardTier[] = [
  { id: 'tier_1', name: 'Bronze', rewardName: 'R$100 Gift Card', quantityAvailable: 20, positivacoesRequired: 3 },
  { id: 'tier_2', name: 'Silver', rewardName: 'R$250 Gift Card', quantityAvailable: 10, positivacoesRequired: 7 },
  { id: 'tier_3', name: 'Gold', rewardName: 'R$500 Gift Card + Destaque', quantityAvailable: 5, positivacoesRequired: 10 },
];

export const MOCK_STORES: Store[] = [
  { id: 'store_1', name: 'Hiperfarma Matriz', participating: true, positivacoes: 5, goalProgress: 75, currentTier: MOCK_AWARD_TIERS[0] },
  { id: 'store_2', name: 'Hiperfarma Filial Centro', participating: true, positivacoes: 2, goalProgress: 40 },
  { id: 'store_3', name: 'Hiperfarma Shopping Norte', participating: false, positivacoes: 0, goalProgress: 0 },
  { id: 'store_4', name: 'Hiperfarma Av. Paulista', participating: true, positivacoes: 8, goalProgress: 100, currentTier: MOCK_AWARD_TIERS[1] },
];


export const MOCK_USERS: User[] = [
  { id: 'user_admin', email: 'admin@hiperfarma.com', role: 'admin', name: 'Admin User' },
  { id: 'user_manager', email: 'manager@hiperfarma.com', role: 'manager', name: 'Manager User' },
  { id: 'user_vendor_rep', email: 'vendor@supplier.com', role: 'vendor', name: 'Vendor Rep', storeName: 'PharmaCorp Rep' }, // storeName here implies their company for display
  { id: 'user_store', email: 'store1@hiperfarma.com', role: 'store', name: 'Store Staff Matriz', storeName: 'Hiperfarma Matriz' },
];

export const ROLES: UserRole[] = ['admin', 'manager', 'vendor', 'store'];

export const STATES = [
  { value: "AC", label: "Acre (AC)" },
  { value: "AL", label: "Alagoas (AL)" },
  { value: "AP", label: "Amapá (AP)" },
  { value: "AM", label: "Amazonas (AM)" },
  { value: "BA", label: "Bahia (BA)" },
  { value: "CE", label: "Ceará (CE)" },
  { value: "DF", label: "Distrito Federal (DF)" },
  { value: "ES", label: "Espírito Santo (ES)" },
  { value: "GO", label: "Goiás (GO)" },
  { value: "MA", label: "Maranhão (MA)" },
  { value: "MT", label: "Mato Grosso (MT)" },
  { value: "MS", label: "Mato Grosso do Sul (MS)" },
  { value: "MG", label: "Minas Gerais (MG)" },
  { value: "PA", label: "Pará (PA)" },
  { value: "PB", label: "Paraíba (PB)" },
  { value: "PR", label: "Paraná (PR)" },
  { value: "PE", label: "Pernambuco (PE)" },
  { value: "PI", label: "Piauí (PI)" },
  { value: "RJ", label: "Rio de Janeiro (RJ)" },
  { value: "RN", label: "Rio Grande do Norte (RN)" },
  { value: "RS", label: "Rio Grande do Sul (RS)" },
  { value: "RO", label: "Rondônia (RO)" },
  { value: "RR", label: "Roraima (RR)" },
  { value: "SC", label: "Santa Catarina (SC)" },
  { value: "SP", label: "São Paulo (SP)" },
  { value: "SE", label: "Sergipe (SE)" },
  { value: "TO", label: "Tocantins (TO)" },
];


export const MOCK_VENDORS: Vendor[] = [
  { id: 'vendor_1', name: 'PharmaCorp', cnpj: '11222333000144', address: 'Rua dos Medicamentos, 123', city: 'São Paulo', neighborhood: 'Centro', state: 'SP', logoUrl: 'https://placehold.co/200x100.png?text=PharmaCorp', dataAiHint: "pharmacy logo" },
  { id: 'vendor_2', name: 'HealthPlus', cnpj: '44555666000177', address: 'Av. Bem Estar, 456', city: 'Curitiba', neighborhood: 'Batel', state: 'PR', logoUrl: 'https://placehold.co/200x100.png?text=HealthPlus', dataAiHint: "health logo" },
  { id: 'vendor_3', name: 'BioMed', cnpj: '77888999000100', address: 'Travessa da Ciência, 789', city: 'Florianópolis', neighborhood: 'Trindade', state: 'SC', logoUrl: 'https://placehold.co/200x100.png?text=BioMed', dataAiHint: "medical science" },
  { id: 'vendor_4', name: 'NutriWell', cnpj: '12345678000191', address: 'Alameda da Nutrição, 101', city: 'Porto Alegre', neighborhood: 'Moinhos de Vento', state: 'RS', logoUrl: 'https://placehold.co/200x100.png?text=NutriWell', dataAiHint: "nutrition health" },
  { id: 'vendor_5', name: 'CareFirst', cnpj: '98765432000121', address: 'Praça do Cuidado, 202', city: 'Rio de Janeiro', neighborhood: 'Copacabana', state: 'RJ', logoUrl: 'https://placehold.co/200x100.png?text=CareFirst', dataAiHint: "healthcare logo" },
  { id: 'vendor_6', name: 'MediSupply', cnpj: '54321098000154', address: 'Rodovia dos Suprimentos, 303', city: 'Belo Horizonte', neighborhood: 'Savassi', state: 'MG', logoUrl: 'https://placehold.co/200x100.png?text=MediSupply', dataAiHint: "medical supply" },
];

export const MOCK_SALESPEOPLE: Salesperson[] = [
    { id: 'sp_1', vendorId: 'vendor_1', name: 'Carlos Silva', phone: '(11) 98765-4321', email: 'carlos.silva@pharmacorp.com', password: 'password123' },
    { id: 'sp_2', vendorId: 'vendor_2', name: 'Ana Pereira', phone: '(41) 91234-5678', email: 'ana.pereira@healthplus.com', password: 'password123' },
];


export const MOCK_SWEEPSTAKE_ENTRIES: SweepstakeEntry[] = MOCK_STORES
  .filter(s => s.participating && s.positivacoes > 0)
  .map(s => ({
    storeId: s.id,
    storeName: s.name,
    qualificationRate: s.goalProgress / 100, // This might need adjustment based on how qualification for sweepstakes is defined
  }));

