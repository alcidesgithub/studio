
// src/lib/localStorageUtils.ts
"use client";
import type { Event, AwardTier, Store, Vendor, Salesperson, User, SweepstakeWinnerRecord } from '@/types';
import { MOCK_EVENT, MOCK_AWARD_TIERS, MOCK_STORES, MOCK_VENDORS, MOCK_SALESPEOPLE, MOCK_USERS } from './constants'; // Ensure MOCK_USERS is exported

const EVENT_KEY = 'hiperfarma_event_details';
const AWARD_TIERS_KEY = 'hiperfarma_award_tiers';
const STORES_KEY = 'hiperfarma_stores';
const VENDORS_KEY = 'hiperfarma_vendors';
const SALESPEOPLE_KEY = 'hiperfarma_salespeople';
const USERS_KEY = 'hiperfarma_users';
const DRAWN_WINNERS_KEY = 'hiperfarma_drawn_winners';

// Generic load function
function loadData<T>(key: string, mockData: T | (() => T)): T {
  if (typeof window === 'undefined') {
    return typeof mockData === 'function' ? (mockData as () => T)() : mockData;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      // Special handling for dates if needed, e.g., for SweepstakeWinnerRecord
      if (key === DRAWN_WINNERS_KEY) {
        const parsed = JSON.parse(item) as SweepstakeWinnerRecord[];
        return parsed.map(winner => ({...winner, drawnAt: new Date(winner.drawnAt)})) as T;
      }
      return JSON.parse(item) as T;
    } else {
      const dataToStore = typeof mockData === 'function' ? (mockData as () => T)() : mockData;
      window.localStorage.setItem(key, JSON.stringify(dataToStore));
      return dataToStore;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    const fallbackData = typeof mockData === 'function' ? (mockData as () => T)() : mockData;
    // Attempt to re-seed if load fails due to malformed data.
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(key, JSON.stringify(fallbackData));
        } catch (saveError) {
            console.error(`Error re-seeding ${key} to localStorage after load failure:`, saveError);
        }
    }
    return fallbackData; 
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
export const loadEvent = (): Event => loadData<Event>(EVENT_KEY, MOCK_EVENT);
export const saveEvent = (event: Event): void => saveData<Event>(EVENT_KEY, event);

// Award Tiers
export const loadAwardTiers = (): AwardTier[] => loadData<AwardTier[]>(AWARD_TIERS_KEY, MOCK_AWARD_TIERS);
export const saveAwardTiers = (tiers: AwardTier[]): void => saveData<AwardTier[]>(AWARD_TIERS_KEY, tiers);

// Stores
export const loadStores = (): Store[] => loadData<Store[]>(STORES_KEY, MOCK_STORES);
export const saveStores = (stores: Store[]): void => saveData<Store[]>(STORES_KEY, stores);

// Vendors
export const loadVendors = (): Vendor[] => loadData<Vendor[]>(VENDORS_KEY, MOCK_VENDORS);
export const saveVendors = (vendors: Vendor[]): void => saveData<Vendor[]>(VENDORS_KEY, vendors);

// Salespeople
export const loadSalespeople = (): Salesperson[] => loadData<Salesperson[]>(SALESPEOPLE_KEY, MOCK_SALESPEOPLE);
export const saveSalespeople = (salespeople: Salesperson[]): void => saveData<Salesperson[]>(SALESPEOPLE_KEY, salespeople);

// Users
export const loadUsers = (): User[] => loadData<User[]>(USERS_KEY, MOCK_USERS);
export const saveUsers = (users: User[]): void => saveData<User[]>(USERS_KEY, users);

// Drawn Winners
export const loadDrawnWinners = (): SweepstakeWinnerRecord[] => loadData<SweepstakeWinnerRecord[]>(DRAWN_WINNERS_KEY, []);
export const saveDrawnWinners = (winners: SweepstakeWinnerRecord[]): void => saveData<SweepstakeWinnerRecord[]>(DRAWN_WINNERS_KEY, winners);
