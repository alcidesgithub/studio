
// src/lib/localStorageUtils.ts
"use client";
import type { Event, AwardTier, Store, Vendor, Salesperson, User, SweepstakeWinnerRecord } from '@/types';
import { MOCK_USERS } from './constants'; // Adicionada importação de MOCK_USERS

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
export const loadEvent = (): Event => loadData<Event>(EVENT_KEY, defaultEvent);
export const saveEvent = (event: Event): void => saveData<Event>(EVENT_KEY, event);

// Award Tiers
export const loadAwardTiers = (): AwardTier[] => loadData<AwardTier[]>(AWARD_TIERS_KEY, []);
export const saveAwardTiers = (tiers: AwardTier[]): void => saveData<AwardTier[]>(AWARD_TIERS_KEY, tiers);

// Stores
export const loadStores = (): Store[] => loadData<Store[]>(STORES_KEY, []);
export const saveStores = (stores: Store[]): void => saveData<Store[]>(STORES_KEY, stores);

// Vendors
export const loadVendors = (): Vendor[] => loadData<Vendor[]>(VENDORS_KEY, []);
export const saveVendors = (vendors: Vendor[]): void => saveData<Vendor[]>(VENDORS_KEY, vendors);

// Salespeople
export const loadSalespeople = (): Salesperson[] => loadData<Salesperson[]>(SALESPEOPLE_KEY, []);
export const saveSalespeople = (salespeople: Salesperson[]): void => saveData<Salesperson[]>(SALESPEOPLE_KEY, salespeople);

// Users
// Alterado para não usar MOCK_USERS como fallback na inicialização.
export const loadUsers = (): User[] => loadData<User[]>(USERS_KEY, []);
export const saveUsers = (users: User[]): void => saveData<User[]>(USERS_KEY, users);

// Drawn Winners
export const loadDrawnWinners = (): SweepstakeWinnerRecord[] => loadData<SweepstakeWinnerRecord[]>(DRAWN_WINNERS_KEY, []);
export const saveDrawnWinners = (winners: SweepstakeWinnerRecord[]): void => saveData<SweepstakeWinnerRecord[]>(DRAWN_WINNERS_KEY, winners);
