
// src/lib/localStorageUtils.ts
"use client";
import type { Event, AwardTier, Store, Vendor, Salesperson, User, SweepstakeWinnerRecord } from '@/types';
import { MOCK_EVENT, MOCK_AWARD_TIERS, MOCK_STORES, MOCK_VENDORS, MOCK_SALESPEOPLE } from './constants';

const EVENT_KEY = 'hiperfarma_event_details';
const AWARD_TIERS_KEY = 'hiperfarma_award_tiers';
const STORES_KEY = 'hiperfarma_stores';
const VENDORS_KEY = 'hiperfarma_vendors';
const SALESPEOPLE_KEY = 'hiperfarma_salespeople';
const USERS_KEY = 'hiperfarma_users';
const DRAWN_WINNERS_KEY = 'hiperfarma_drawn_winners';

// Default empty states
const defaultEvent: Event = {
  id: 'evt_default_placeholder',
  name: 'Nome do Evento (Configure na Admin)',
  date: new Date(new Date().setHours(12,0,0,0)).toISOString(), // Default to today at noon
  time: '09:00 - 18:00',
  location: 'Local a Definir',
  address: 'Endereço Completo a Definir',
  mapEmbedUrl: ''
};

// Generic load function
function loadData<T>(key: string, emptyDefault: T | (() => T), mockDataFallback?: T): T {
  if (typeof window === 'undefined') {
    return typeof emptyDefault === 'function' ? (emptyDefault as () => T)() : emptyDefault;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      if (key === DRAWN_WINNERS_KEY) {
        const parsed = JSON.parse(item) as SweepstakeWinnerRecord[];
        return parsed.map(winner => ({...winner, drawnAt: new Date(winner.drawnAt)})) as T;
      }
      return JSON.parse(item) as T;
    } else {
      // Se mockDataFallback for fornecido e o item não existir, salve e retorne o mockDataFallback.
      if (mockDataFallback !== undefined) {
        saveData(key, mockDataFallback); // Salva os mocks para que fiquem disponíveis
        return mockDataFallback;
      }
      // Caso contrário, salva e retorna o emptyDefault para garantir que a chave exista no localStorage
      const defaultValue = typeof emptyDefault === 'function' ? (emptyDefault as () => T)() : emptyDefault;
      saveData(key, defaultValue);
      return defaultValue;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    // Fallback para default ou mock em caso de erro no parse, se mockDataFallback existir
    if (mockDataFallback !== undefined) {
        // Não salvar mockDataFallback em caso de erro de parse, apenas retornar
        return mockDataFallback;
    }
    const defaultValue = typeof emptyDefault === 'function' ? (emptyDefault as () => T)() : emptyDefault;
    // Não salvar defaultValue em caso de erro de parse, apenas retornar
    return defaultValue;
  }
}

// Generic save function
function saveData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

// Event
export const loadEvent = (): Event => loadData<Event>(EVENT_KEY, defaultEvent, MOCK_EVENT);
export const saveEvent = (event: Event): void => saveData<Event>(EVENT_KEY, event);

// Award Tiers
export const loadAwardTiers = (): AwardTier[] => loadData<AwardTier[]>(AWARD_TIERS_KEY, [], MOCK_AWARD_TIERS);
export const saveAwardTiers = (tiers: AwardTier[]): void => saveData<AwardTier[]>(AWARD_TIERS_KEY, tiers);

// Stores
export const loadStores = (): Store[] => loadData<Store[]>(STORES_KEY, [], MOCK_STORES);
export const saveStores = (stores: Store[]): void => saveData<Store[]>(STORES_KEY, stores);

// Vendors
export const loadVendors = (): Vendor[] => loadData<Vendor[]>(VENDORS_KEY, [], MOCK_VENDORS);
export const saveVendors = (vendors: Vendor[]): void => saveData<Vendor[]>(VENDORS_KEY, vendors);

// Salespeople
export const loadSalespeople = (): Salesperson[] => loadData<Salesperson[]>(SALESPEOPLE_KEY, [], MOCK_SALESPEOPLE);
export const saveSalespeople = (salespeople: Salesperson[]): void => saveData<Salesperson[]>(SALESPEOPLE_KEY, salespeople);

// Users
export const loadUsers = (): User[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const alcidesUserId = 'user_admin_alcides_hiperfarma_v1'; // Consistent ID
  const alcidesEmail = 'alcides@redehiperfarma.com.br';
  const alcidesPassword = 'eitarede7889';
  let users: User[] = [];
  let updateLocalStorage = false;

  try {
    const item = window.localStorage.getItem(USERS_KEY);
    if (item) {
      users = JSON.parse(item) as User[];
    }
  } catch (error) {
    console.error(`Error parsing ${USERS_KEY} from localStorage:`, error);
    // If parsing fails, treat as if no users exist to force recreation of Alcides.
    users = [];
  }

  const alcidesUserIndex = users.findIndex(u => u.email === alcidesEmail);

  if (alcidesUserIndex !== -1) {
    // Alcides exists, ensure password and role are correct
    const alcides = users[alcidesUserIndex];
    if (alcides.password !== alcidesPassword || !alcides.password || alcides.role !== 'admin' || alcides.name !== 'Alcides' || alcides.id !== alcidesUserId) {
      users[alcidesUserIndex] = {
        // Spread existing data only if ID matches, otherwise use defaults to ensure consistency
        ...(alcides.id === alcidesUserId ? alcides : {}), 
        id: alcidesUserId,
        name: 'Alcides',
        email: alcidesEmail,
        role: 'admin',
        password: alcidesPassword,
      };
      updateLocalStorage = true;
    }
  } else {
    // Alcides does not exist, add him
    const defaultAdmin: User = {
      id: alcidesUserId,
      name: 'Alcides',
      email: alcidesEmail,
      role: 'admin',
      password: alcidesPassword,
    };
    users.push(defaultAdmin);
    updateLocalStorage = true;
  }

  if (updateLocalStorage) {
    saveData<User[]>(USERS_KEY, users);
    // Ensure other mock/default data is present if Alcides was just created/updated due to empty/corrupt state
    if (!window.localStorage.getItem(EVENT_KEY)) loadEvent();
    if (!window.localStorage.getItem(AWARD_TIERS_KEY)) loadAwardTiers();
    if (!window.localStorage.getItem(STORES_KEY)) loadStores();
    if (!window.localStorage.getItem(VENDORS_KEY)) loadVendors();
    if (!window.localStorage.getItem(SALESPEOPLE_KEY)) loadSalespeople();
  }
  
  return users;
};
export const saveUsers = (users: User[]): void => saveData<User[]>(USERS_KEY, users);

// Drawn Winners
export const loadDrawnWinners = (): SweepstakeWinnerRecord[] => loadData<SweepstakeWinnerRecord[]>(DRAWN_WINNERS_KEY, []);
export const saveDrawnWinners = (winners: SweepstakeWinnerRecord[]): void => saveData<SweepstakeWinnerRecord[]>(DRAWN_WINNERS_KEY, winners);

