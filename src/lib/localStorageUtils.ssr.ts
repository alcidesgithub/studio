
// src/lib/localStorageUtils.ssr.ts
// This version is for Server Components or environments where localStorage might not be available.
// It will fall back to empty/default data if window is undefined or no data is found.

import type { Event, AwardTier, Store, Vendor, Salesperson, User, SweepstakeWinnerRecord } from '@/types';
// MOCKs from constants.ts are no longer used for seeding runtime data.

const EVENT_KEY = 'hiperfarma_event_details';
const AWARD_TIERS_KEY = 'hiperfarma_award_tiers';
const STORES_KEY = 'hiperfarma_stores';
const VENDORS_KEY = 'hiperfarma_vendors';
const USERS_KEY = 'hiperfarma_users'; // Added for consistency, though loadUsers SSR might not be common
const DRAWN_WINNERS_KEY = 'hiperfarma_drawn_winners'; // Added for consistency

// Default empty states
const defaultEvent: Event = {
  id: 'evt_default_placeholder_ssr',
  name: 'Nome do Evento (Configure na Admin)',
  date: new Date(new Date().setHours(12,0,0,0)).toISOString(),
  time: '09:00 - 18:00',
  location: 'Local a Definir',
  address: 'Endereço Completo a Definir',
  mapEmbedUrl: ''
};

// SSR-safe load function
function loadDataSSR<T>(key: string, emptyDefault: T): T {
  if (typeof window === 'undefined') {
    return emptyDefault; // Return empty default if on server
  }
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
        if (key === DRAWN_WINNERS_KEY) { // Special handling for dates
            const parsed = JSON.parse(item) as SweepstakeWinnerRecord[];
            return parsed.map(winner => ({...winner, drawnAt: new Date(winner.drawnAt)})) as T;
        }
      return JSON.parse(item) as T;
    } else {
      // Don't seed, just return the empty default if on client but no data
      return emptyDefault;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage (SSR context, but window exists):`, error);
    return emptyDefault; // Fallback to empty default on error
  }
}

export const loadEvent = (): Event => loadDataSSR<Event>(EVENT_KEY, defaultEvent);
export const loadVendors = (): Vendor[] => loadDataSSR<Vendor[]>(VENDORS_KEY, []);
export const loadAwardTiers = (): AwardTier[] => loadDataSSR<AwardTier[]>(AWARD_TIERS_KEY, []);
export const loadStores = (): Store[] => loadDataSSR<Store[]>(STORES_KEY, []);
export const loadUsers = (): User[] => loadDataSSR<User[]>(USERS_KEY, []); // For SSR usage if needed
export const loadDrawnWinners = (): SweepstakeWinnerRecord[] => loadDataSSR<SweepstakeWinnerRecord[]>(DRAWN_WINNERS_KEY, []);

// Save functions are not typically used in SSR context for localStorage,
// but can be included if there's a client-side component also using this file.
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
