
// src/lib/localStorageUtils.ssr.ts
// This version is for Server Components or environments where localStorage might not be available.
// It will fall back to empty/default data if window is undefined or no data is found.

import type { Event, AwardTier, Store, Vendor, Salesperson, User, SweepstakeWinnerRecord } from '@/types';

const EVENT_KEY = 'hiperfarma_event_details';
const AWARD_TIERS_KEY = 'hiperfarma_award_tiers';
const STORES_KEY = 'hiperfarma_stores';
const VENDORS_KEY = 'hiperfarma_vendors';
const USERS_KEY = 'hiperfarma_users';
const DRAWN_WINNERS_KEY = 'hiperfarma_drawn_winners';

// Default empty/static states for SSR fallbacks
// Ensures no dynamic calculations (like new Date()) are done during server-side processing or build time for these defaults.
const defaultEventSSR: Event = {
  id: 'evt_ssr_default',
  name: 'Detalhes do Evento (Carregando...)',
  date: '2024-01-01T12:00:00.000Z', // Static placeholder date
  time: '--:-- - --:--',
  location: 'Local (Carregando...)',
  address: 'Endereço (Carregando...)',
  mapEmbedUrl: '',
  vendorGuideUrl: '',
  associateGuideUrl: '',
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

export const loadEvent = (): Event => loadDataSSR<Event>(EVENT_KEY, defaultEventSSR);
export const loadVendors = (): Vendor[] => loadDataSSR<Vendor[]>(VENDORS_KEY, []);
export const loadAwardTiers = (): AwardTier[] => loadDataSSR<AwardTier[]>(AWARD_TIERS_KEY, []);
export const loadStores = (): Store[] => loadDataSSR<Store[]>(STORES_KEY, []);
export const loadUsers = (): User[] => loadDataSSR<User[]>(USERS_KEY, []);
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

