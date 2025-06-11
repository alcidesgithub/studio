
// src/lib/localStorageUtils.ssr.ts
// This version is for Server Components or environments where localStorage might not be available.
// It will fall back to mock data if window is undefined.
// For true SSR with persisted data, you'd fetch from a database.

import type { Event, AwardTier, Store, Vendor, Salesperson, User, SweepstakeWinnerRecord } from '@/types';
import { MOCK_EVENT, MOCK_AWARD_TIERS, MOCK_STORES, MOCK_VENDORS, MOCK_SALESPEOPLE, MOCK_USERS } from './constants';

const EVENT_KEY = 'hiperfarma_event_details';
const AWARD_TIERS_KEY = 'hiperfarma_award_tiers';
const STORES_KEY = 'hiperfarma_stores';
const VENDORS_KEY = 'hiperfarma_vendors';
// ... other keys if needed by server components

// SSR-safe load function
function loadDataSSR<T>(key: string, mockData: T): T {
  if (typeof window === 'undefined') {
    return mockData; // Return mock data if on server
  }
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
        if (key === 'hiperfarma_drawn_winners') { // Special handling for dates
            const parsed = JSON.parse(item) as SweepstakeWinnerRecord[];
            return parsed.map(winner => ({...winner, drawnAt: new Date(winner.drawnAt)})) as T;
        }
      return JSON.parse(item) as T;
    } else {
      // Seed local storage with mock data if it's empty on client
      window.localStorage.setItem(key, JSON.stringify(mockData));
      return mockData;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage (SSR context, but window exists):`, error);
    return mockData; // Fallback to mock data on error
  }
}

export const loadEvent = (): Event => loadDataSSR<Event>(EVENT_KEY, MOCK_EVENT);
export const loadVendors = (): Vendor[] => loadDataSSR<Vendor[]>(VENDORS_KEY, MOCK_VENDORS);
export const loadAwardTiers = (): AwardTier[] => loadDataSSR<AwardTier[]>(AWARD_TIERS_KEY, MOCK_AWARD_TIERS);
export const loadStores = (): Store[] => loadDataSSR<Store[]>(STORES_KEY, MOCK_STORES);
export const loadUsers = (): User[] => loadDataSSR<User[]>(USERS_KEY, MOCK_USERS);
export const loadDrawnWinners = (): SweepstakeWinnerRecord[] => loadDataSSR<SweepstakeWinnerRecord[]>(DRAWN_WINNERS_KEY, []);

// Save functions are not typically used in SSR context for localStorage,
// but can be included if there's a client-side component also using this file.
// For now, they mirror the client-side ones.
function saveDataSSR<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage (SSR context, but window exists):`, error);
  }
}
export const saveEvent = (event: Event): void => saveDataSSR<Event>(EVENT_KEY, event);
export const saveAwardTiers = (tiers: AwardTier[]): void => saveDataSSR<AwardTier[]>(AWARD_TIERS_KEY, tiers);
export const saveStores = (stores: Store[]): void => saveDataSSR<Store[]>(STORES_KEY, stores);
export const saveVendors = (vendors: Vendor[]): void => saveDataSSR<Vendor[]>(VENDORS_KEY, vendors);
export const saveUsers = (users: User[]): void => saveDataSSR<User[]>(USERS_KEY, users);
export const saveDrawnWinners = (winners: SweepstakeWinnerRecord[]): void => saveDataSSR<SweepstakeWinnerRecord[]>(DRAWN_WINNERS_KEY, winners);

