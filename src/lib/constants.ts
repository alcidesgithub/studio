
import type { Event, Store, AwardTier, User, UserRole, SweepstakeEntry, Vendor, Salesperson, PositivationDetail } from '@/types';
import { parseISO, subDays } from 'date-fns';

export const MOCK_EVENT: Event = {
  id: 'evt_1',
  name: 'Encontro Anual de Negócios Hiperfarma 2024',
  date: new Date(2024, 10, 15).toISOString(), // November 15, 2024
  time: '09:00 - 18:00',
  location: 'Expo Center Norte - São Paulo',
  address: 'R. José Bernardo Pinto, 333 - Vila Guilherme, São Paulo - SP, 02055-000, Brasil',
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3658.751125584852!2d-46.62604808502391!3d-23.50639278471017!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce58e5da7f7669%3A0x7d23f718d8d97379!2sExpo%20Center%20Norte!5e0!3m2!1sen!2sbr!4v1678886047605!5m2!1sen!2sbr'
};

export const MOCK_AWARD_TIERS: AwardTier[] = [
  { id: 'tier_1', name: 'Bronze', rewardName: 'Cartão Presente R$100', quantityAvailable: 20, positivacoesRequired: 3 },
  { id: 'tier_2', name: 'Prata', rewardName: 'Cartão Presente R$250', quantityAvailable: 10, positivacoesRequired: 7 },
  { id: 'tier_3', name: 'Ouro', rewardName: 'Cartão Presente R$500 + Destaque', quantityAvailable: 5, positivacoesRequired: 10 },
].sort((a,b) => a.positivacoesRequired - b.positivacoesRequired); // Ensure sorted for progress logic

export const MOCK_VENDORS: Vendor[] = [
  { id: 'vendor_1', name: 'Farmacoop Produtos Farmacêuticos Ltda.', cnpj: '11222333000144', address: 'Rua dos Medicamentos, 123', city: 'São Paulo', neighborhood: 'Centro', state: 'SP', logoUrl: 'https://placehold.co/120x60.png?text=Farmacoop', dataAiHint: "pharmacy logo" },
  { id: 'vendor_2', name: 'SaúdeMais Distribuidora S.A.', cnpj: '44555666000177', address: 'Av. Bem Estar, 456', city: 'Curitiba', neighborhood: 'Batel', state: 'PR', logoUrl: 'https://placehold.co/120x60.png?text=SaudeMais', dataAiHint: "health logo" },
  { id: 'vendor_3', name: 'BioMedicina Inovações Farm. EIRELI', cnpj: '77888999000100', address: 'Travessa da Ciência, 789', city: 'Florianópolis', neighborhood: 'Trindade', state: 'SC', logoUrl: 'https://placehold.co/120x60.png?text=BioMed', dataAiHint: "medical science" },
  { id: 'vendor_4', name: 'NutriBem Alimentos Funcionais Ltda.', cnpj: '12345678000191', address: 'Alameda da Nutrição, 101', city: 'Porto Alegre', neighborhood: 'Moinhos de Vento', state: 'RS', logoUrl: 'https://placehold.co/120x60.png?text=NutriBem', dataAiHint: "nutrition health" },
  { id: 'vendor_5', name: 'CuidadoTotal Cosméticos e Higiene Pessoal S.A.', cnpj: '98765432000121', address: 'Praça do Cuidado, 202', city: 'Rio de Janeiro', neighborhood: 'Copacabana', state: 'RJ', logoUrl: 'https://placehold.co/120x60.png?text=CuidadoTotal', dataAiHint: "healthcare logo" },
  { id: 'vendor_6', name: 'MediSuprimentos Hospitalares Ltda.', cnpj: '54321098000154', address: 'Rodovia dos Suprimentos, 303', city: 'Belo Horizonte', neighborhood: 'Savassi', state: 'MG', logoUrl: 'https://placehold.co/120x60.png?text=MediSupri', dataAiHint: "medical supply" },
].sort((a,b) => a.name.localeCompare(b.name)); // Sort vendors alphabetically

const today = new Date();
const positivationsStore1: PositivationDetail[] = [
  { vendorId: MOCK_VENDORS[0].id, vendorName: MOCK_VENDORS[0].name, vendorLogoUrl: MOCK_VENDORS[0].logoUrl, vendorDataAiHint: MOCK_VENDORS[0].dataAiHint, date: subDays(today, 5).toISOString() },
  { vendorId: MOCK_VENDORS[1].id, vendorName: MOCK_VENDORS[1].name, vendorLogoUrl: MOCK_VENDORS[1].logoUrl, vendorDataAiHint: MOCK_VENDORS[1].dataAiHint, date: subDays(today, 4).toISOString() },
  { vendorId: MOCK_VENDORS[2].id, vendorName: MOCK_VENDORS[2].name, vendorLogoUrl: MOCK_VENDORS[2].logoUrl, vendorDataAiHint: MOCK_VENDORS[2].dataAiHint, date: subDays(today, 3).toISOString() },
];

const positivationsStore4: PositivationDetail[] = [
  { vendorId: MOCK_VENDORS[0].id, vendorName: MOCK_VENDORS[0].name, vendorLogoUrl: MOCK_VENDORS[0].logoUrl, vendorDataAiHint: MOCK_VENDORS[0].dataAiHint, date: subDays(today, 2).toISOString() },
  { vendorId: MOCK_VENDORS[1].id, vendorName: MOCK_VENDORS[1].name, vendorLogoUrl: MOCK_VENDORS[1].logoUrl, vendorDataAiHint: MOCK_VENDORS[1].dataAiHint, date: subDays(today, 2).toISOString() },
  { vendorId: MOCK_VENDORS[2].id, vendorName: MOCK_VENDORS[2].name, vendorLogoUrl: MOCK_VENDORS[2].logoUrl, vendorDataAiHint: MOCK_VENDORS[2].dataAiHint, date: subDays(today, 1).toISOString() },
  { vendorId: MOCK_VENDORS[3].id, vendorName: MOCK_VENDORS[3].name, vendorLogoUrl: MOCK_VENDORS[3].logoUrl, vendorDataAiHint: MOCK_VENDORS[3].dataAiHint, date: subDays(today, 1).toISOString() },
  { vendorId: MOCK_VENDORS[4].id, vendorName: MOCK_VENDORS[4].name, vendorLogoUrl: MOCK_VENDORS[4].logoUrl, vendorDataAiHint: MOCK_VENDORS[4].dataAiHint, date: subDays(today, 0).toISOString() },
  { vendorId: MOCK_VENDORS[5].id, vendorName: MOCK_VENDORS[5].name, vendorLogoUrl: MOCK_VENDORS[5].logoUrl, vendorDataAiHint: MOCK_VENDORS[5].dataAiHint, date: subDays(today, 0).toISOString() },
];


export const MOCK_STORES: Store[] = [
  { 
    id: 'store_1', code: 'LJ001', name: 'Hiperfarma Matriz Ltda.', cnpj: '01234567000188', 
    participating: true, goalProgress: 75, positivationsDetails: positivationsStore1, 
    currentTier: MOCK_AWARD_TIERS.find(t => positivationsStore1.length >= t.positivacoesRequired && (!MOCK_AWARD_TIERS[MOCK_AWARD_TIERS.indexOf(t)+1] || positivationsStore1.length < MOCK_AWARD_TIERS[MOCK_AWARD_TIERS.indexOf(t)+1].positivacoesRequired)),
    address: 'Rua Principal, 123', city: 'Curitiba', neighborhood: 'Centro', state: 'PR', phone: '(41) 3333-1111',
    ownerName: 'João Silva', responsibleName: 'Maria Souza', email: 'matriz@hiperfarma.com'
  },
  { 
    id: 'store_2', code: 'LJ002', name: 'Hiperfarma Filial Centro Com. de Med. Ltda.', cnpj: '02345678000199', 
    participating: true, goalProgress: 40, positivationsDetails: [],
    address: 'Av. Comercial, 456', city: 'Londrina', neighborhood: 'Centro', state: 'PR', phone: '(43) 3333-2222',
    ownerName: 'Pedro Alves', responsibleName: 'Ana Costa', email: 'filial.centro@hiperfarma.com'
  },
  { 
    id: 'store_3', code: 'LJ003', name: 'Hiperfarma Shopping Norte Farmácia EIRELI', cnpj: '03456789000100', 
    participating: false, goalProgress: 0, positivationsDetails: [],
    address: 'Rua do Shopping, 789', city: 'Joinville', neighborhood: 'América', state: 'SC', phone: '(47) 3333-3333',
    ownerName: 'Carlos Pereira', responsibleName: 'Beatriz Santos', email: 'shopping.norte@hiperfarma.com'
  },
  { 
    id: 'store_4', code: 'LJ004', name: 'Hiperfarma Av. Brasil Medicamentos S.A.', cnpj: '04567890000111', 
    participating: true, goalProgress: 100, positivationsDetails: positivationsStore4, 
    currentTier: MOCK_AWARD_TIERS.find(t => positivationsStore4.length >= t.positivacoesRequired && (!MOCK_AWARD_TIERS[MOCK_AWARD_TIERS.indexOf(t)+1] || positivationsStore4.length < MOCK_AWARD_TIERS[MOCK_AWARD_TIERS.indexOf(t)+1].positivacoesRequired)),
    address: 'Av. Brasil, 1011', city: 'Florianópolis', neighborhood: 'Centro', state: 'SC', phone: '(48) 3333-4444',
    ownerName: 'Fernanda Lima', responsibleName: 'Ricardo Oliveira', email: 'av.brasil@hiperfarma.com'
  },
];


export const MOCK_USERS: User[] = [
  { id: 'user_admin', email: 'admin@hiperfarma.com', role: 'admin', name: 'Usuário Admin' },
  { id: 'user_alcides', email: 'alcides@redehiperfarma.com.br', role: 'admin', name: 'Alcides' },
  { id: 'user_manager', email: 'manager@hiperfarma.com', role: 'manager', name: 'Usuário Gerente' },
  { id: 'user_vendor_rep', email: 'vendor@supplier.com', role: 'vendor', name: 'Rep. Farmacoop', storeName: 'Farmacoop Produtos Farmacêuticos Ltda.' }, // storeName here implies their company for display
  { id: 'user_store_1', email: 'store1@hiperfarma.com', role: 'store', name: 'Equipe Matriz', storeName: MOCK_STORES[0].name },
  { id: 'user_store_2', email: 'store2@hiperfarma.com', role: 'store', name: 'Equipe Filial Centro', storeName: MOCK_STORES[1].name },
  { id: 'user_store_4', email: 'store4@hiperfarma.com', role: 'store', name: 'Equipe Av. Brasil', storeName: MOCK_STORES[3].name },
];

export const ROLES: UserRole[] = ['admin', 'manager', 'vendor', 'store'];
export const ROLES_TRANSLATIONS: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  vendor: 'Fornecedor',
  store: 'Loja',
};


export const STATES = [
  { value: "PR", label: "Paraná (PR)" },
  { value: "SC", label: "Santa Catarina (SC)" },
];


export const MOCK_SALESPEOPLE: Salesperson[] = [
    { id: 'sp_1', vendorId: 'vendor_1', name: 'Carlos Silva', phone: '(11) 98765-4321', email: 'carlos.silva@farmacoop.com', password: 'password123' },
    { id: 'sp_2', vendorId: 'vendor_2', name: 'Ana Pereira', phone: '(41) 91234-5678', email: 'ana.pereira@saudemais.com', password: 'password123' },
];


export const MOCK_SWEEPSTAKE_ENTRIES: SweepstakeEntry[] = MOCK_STORES
  .filter(s => s.participating && s.positivationsDetails.length > 0)
  .map(s => ({
    storeId: s.id,
    storeName: s.name,
    // Qualification rate could be percentage of max possible positivations, or just goalProgress
    qualificationRate: s.goalProgress / 100,
  }));
