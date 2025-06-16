
import type { Event, Store, AwardTier, UserRole, SweepstakeEntry, Vendor, Salesperson, PositivationDetail } from '@/types';
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
  { id: 'tier_1', name: 'Bronze', rewardName: 'Cartão Presente R$100', quantityAvailable: 20, positivacoesRequired: { PR: 3, SC: 4 }, sortOrder: 0 },
  { id: 'tier_2', name: 'Prata', rewardName: 'Cartão Presente R$250', quantityAvailable: 10, positivacoesRequired: { PR: 7, SC: 8 }, sortOrder: 1 },
  { id: 'tier_3', name: 'Ouro', rewardName: 'Cartão Presente R$500 + Destaque', quantityAvailable: 5, positivacoesRequired: { PR: 10, SC: 12 }, sortOrder: 2 },
].sort((a,b) => a.sortOrder - b.sortOrder);

export const MOCK_VENDORS: Vendor[] = [
  { id: 'vendor_1', name: 'Farmacoop Produtos Farmacêuticos Ltda.', cnpj: '11222333000144', address: 'Rua dos Medicamentos, 123', city: 'São Paulo', neighborhood: 'Centro', state: 'SP', logoUrl: 'https://placehold.co/120x60.png?text=Farmacoop' },
  { id: 'vendor_2', name: 'SaúdeMais Distribuidora S.A.', cnpj: '44555666000177', address: 'Av. Bem Estar, 456', city: 'Curitiba', neighborhood: 'Batel', state: 'PR', logoUrl: 'https://placehold.co/120x60.png?text=SaudeMais' },
  { id: 'vendor_3', name: 'BioMedicina Inovações Farm. EIRELI', cnpj: '77888999000100', address: 'Travessa da Ciência, 789', city: 'Florianópolis', neighborhood: 'Trindade', state: 'SC', logoUrl: 'https://placehold.co/120x60.png?text=BioMed' },
  { id: 'vendor_4', name: 'NutriBem Alimentos Funcionais Ltda.', cnpj: '12345678000191', address: 'Alameda da Nutrição, 101', city: 'Porto Alegre', neighborhood: 'Moinhos de Vento', state: 'RS', logoUrl: 'https://placehold.co/120x60.png?text=NutriBem' },
  { id: 'vendor_5', name: 'CuidadoTotal Cosméticos e Higiene Pessoal S.A.', cnpj: '98765432000121', address: 'Praça do Cuidado, 202', city: 'Rio de Janeiro', neighborhood: 'Copacabana', state: 'RJ', logoUrl: 'https://placehold.co/120x60.png?text=CuidadoTotal' },
  { id: 'vendor_6', name: 'MediSuprimentos Hospitalares Ltda.', cnpj: '54321098000154', address: 'Rodovia dos Suprimentos, 303', city: 'Belo Horizonte', neighborhood: 'Savassi', state: 'MG', logoUrl: 'https://placehold.co/120x60.png?text=MediSupri' },
].sort((a,b) => a.name.localeCompare(b.name)); // Sort vendors alphabetically

export const MOCK_SALESPEOPLE: Salesperson[] = [
    { id: 'user_vendor_cs', vendorId: 'vendor_1', name: 'Carlos Silva', phone: '(11) 98765-4321', email: 'carlos.silva@farmacoop.com', password: 'password123' },
    { id: 'user_vendor_ap', vendorId: 'vendor_2', name: 'Ana Pereira', phone: '(41) 91234-5678', email: 'ana.pereira@saudemais.com', password: 'password123' },
    { id: 'user_vendor_bio', vendorId: 'vendor_3', name: 'Beatriz BioMed', phone: '(48) 99999-0003', email: 'beatriz.biomed@example.com', password: 'password123' },
    { id: 'user_vendor_nutri', vendorId: 'vendor_4', name: 'Nicolas Nutri', phone: '(51) 99999-0004', email: 'nicolas.nutri@example.com', password: 'password123' },
];


const today = new Date();
const positivationsStore1: PositivationDetail[] = [
  { vendorId: MOCK_VENDORS[0].id, vendorName: MOCK_VENDORS[0].name, vendorLogoUrl: MOCK_VENDORS[0].logoUrl, date: subDays(today, 5).toISOString(), salespersonId: 'user_vendor_cs', salespersonName: 'Carlos Silva' },
  { vendorId: MOCK_VENDORS[1].id, vendorName: MOCK_VENDORS[1].name, vendorLogoUrl: MOCK_VENDORS[1].logoUrl, date: subDays(today, 4).toISOString(), salespersonId: 'user_vendor_ap', salespersonName: 'Ana Pereira' },
  { vendorId: MOCK_VENDORS[2].id, vendorName: MOCK_VENDORS[2].name, vendorLogoUrl: MOCK_VENDORS[2].logoUrl, date: subDays(today, 3).toISOString(), salespersonId: 'user_vendor_bio', salespersonName: 'Beatriz BioMed' },
];

const positivationsStore4: PositivationDetail[] = [
  { vendorId: MOCK_VENDORS[0].id, vendorName: MOCK_VENDORS[0].name, vendorLogoUrl: MOCK_VENDORS[0].logoUrl, date: subDays(today, 2).toISOString(), salespersonId: 'user_vendor_cs', salespersonName: 'Carlos Silva' },
  { vendorId: MOCK_VENDORS[1].id, vendorName: MOCK_VENDORS[1].name, vendorLogoUrl: MOCK_VENDORS[1].logoUrl, date: subDays(today, 2).toISOString(), salespersonId: 'user_vendor_ap', salespersonName: 'Ana Pereira' },
  { vendorId: MOCK_VENDORS[2].id, vendorName: MOCK_VENDORS[2].name, vendorLogoUrl: MOCK_VENDORS[2].logoUrl, date: subDays(today, 1).toISOString(), salespersonId: 'user_vendor_bio', salespersonName: 'Beatriz BioMed' },
  { vendorId: MOCK_VENDORS[3].id, vendorName: MOCK_VENDORS[3].name, vendorLogoUrl: MOCK_VENDORS[3].logoUrl, date: subDays(today, 1).toISOString(), salespersonId: 'user_vendor_nutri', salespersonName: 'Nicolas Nutri' },
  { vendorId: MOCK_VENDORS[4].id, vendorName: MOCK_VENDORS[4].name, vendorLogoUrl: MOCK_VENDORS[4].logoUrl, date: subDays(today, 0).toISOString(), salespersonName: 'Vendedor CuidadoTotal' },
  { vendorId: MOCK_VENDORS[5].id, vendorName: MOCK_VENDORS[5].name, vendorLogoUrl: MOCK_VENDORS[5].logoUrl, date: subDays(today, 0).toISOString(), salespersonName: 'Vendedor MediSupri' },
];


export const MOCK_STORES: Store[] = [
  {
    id: 'store_1', code: 'LJ001', name: 'Hiperfarma Matriz Ltda.', cnpj: '01234567000188',
    participating: true, goalProgress: 75, positivationsDetails: positivationsStore1, isCheckedIn: true,
    currentTier: MOCK_AWARD_TIERS.find(t => positivationsStore1.length >= t.positivacoesRequired.PR && (!MOCK_AWARD_TIERS[MOCK_AWARD_TIERS.indexOf(t)+1] || positivationsStore1.length < MOCK_AWARD_TIERS[MOCK_AWARD_TIERS.indexOf(t)+1].positivacoesRequired.PR)),
    address: 'Rua Principal, 123', city: 'Curitiba', neighborhood: 'Centro', state: 'PR', phone: '(41) 3333-1111',
    ownerName: 'João Silva', responsibleName: 'Maria Souza', email: 'matriz@hiperfarma.com'
  },
  {
    id: 'store_2', code: 'LJ002', name: 'Hiperfarma Filial Centro Com. de Med. Ltda.', cnpj: '02345678000199',
    participating: true, goalProgress: 40, positivationsDetails: [], isCheckedIn: false,
    address: 'Av. Comercial, 456', city: 'Londrina', neighborhood: 'Centro', state: 'PR', phone: '(43) 3333-2222',
    ownerName: 'Pedro Alves', responsibleName: 'Ana Costa', email: 'filial.centro@hiperfarma.com'
  },
  {
    id: 'store_3', code: 'LJ003', name: 'Hiperfarma Shopping Norte Farmácia EIRELI', cnpj: '03456789000100',
    participating: false, goalProgress: 0, positivationsDetails: [], isCheckedIn: false,
    address: 'Rua do Shopping, 789', city: 'Joinville', neighborhood: 'América', state: 'SC', phone: '(47) 3333-3333',
    ownerName: 'Carlos Pereira', responsibleName: 'Beatriz Santos', email: 'shopping.norte@hiperfarma.com'
  },
  {
    id: 'store_4', code: 'LJ004', name: 'Hiperfarma Av. Brasil Medicamentos S.A.', cnpj: '04567890000111',
    participating: true, goalProgress: 100, positivationsDetails: positivationsStore4, isCheckedIn: true,
    currentTier: MOCK_AWARD_TIERS.find(t => positivationsStore4.length >= t.positivacoesRequired.SC && (!MOCK_AWARD_TIERS[MOCK_AWARD_TIERS.indexOf(t)+1] || positivationsStore4.length < MOCK_AWARD_TIERS[MOCK_AWARD_TIERS.indexOf(t)+1].positivacoesRequired.SC)),
    address: 'Av. Brasil, 1011', city: 'Florianópolis', neighborhood: 'Centro', state: 'SC', phone: '(48) 3333-4444',
    ownerName: 'Fernanda Lima', responsibleName: 'Ricardo Oliveira', email: 'av.brasil@hiperfarma.com'
  },
];


export const ROLES: UserRole[] = ['admin', 'manager', 'vendor', 'store'];
export const ROLES_TRANSLATIONS: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  vendor: 'Vendedor',
  store: 'Loja',
};


export const STATES = [
  { value: "PR", label: "Paraná (PR)" },
  { value: "SC", label: "Santa Catarina (SC)" },
];

export const ALL_BRAZILIAN_STATES = [
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
  { value: "TO", label: "Tocantins (TO)" }
];


export const MOCK_SWEEPSTAKE_ENTRIES: SweepstakeEntry[] = MOCK_STORES
  .filter(s => s.participating && s.positivationsDetails.length > 0)
  .map(s => ({
    storeId: s.id,
    storeName: s.name,
    qualificationRate: s.goalProgress / 100,
  }));
