
// src/lib/localStorageUtils.ts
"use client";
import type { Event, AwardTier, Store, Vendor, Salesperson, User, SweepstakeWinnerRecord } from '@/types';

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
  mapEmbedUrl: '',
  vendorGuideUrl: '',
  associateGuideUrl: '',
};

// Generic load function - removed mockDataFallback parameter
function loadData<T>(key: string, emptyDefault: T | (() => T)): T {
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
      // If item doesn't exist, save and return the emptyDefault to ensure the key exists in localStorage
      const defaultValue = typeof emptyDefault === 'function' ? (emptyDefault as () => T)() : emptyDefault;
      saveData(key, defaultValue);
      return defaultValue;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    // Fallback to empty default in case of error
    const defaultValue = typeof emptyDefault === 'function' ? (emptyDefault as () => T)() : emptyDefault;
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
export const loadStores = (): Store[] => {
  let stores = loadData<Store[]>(STORES_KEY, []);
  let migrated = false;
  stores = stores.map(store => {
    const migratedStore = { ...store };
    if (typeof store.isCheckedIn === 'undefined') {
      migratedStore.isCheckedIn = false;
      migrated = true;
    }
    if (typeof store.isMatrix === 'undefined') {
      migratedStore.isMatrix = true; 
      migrated = true;
    }
    if (migratedStore.isMatrix === true && typeof store.matrixStoreId !== 'undefined') {
      migratedStore.matrixStoreId = undefined;
      migrated = true;
    }
    return migratedStore;
  });
  if (migrated && typeof window !== 'undefined') {
    saveData(STORES_KEY, stores); 
  }
  return stores;
};
export const saveStores = (stores: Store[]): void => saveData<Store[]>(STORES_KEY, stores);

// Vendors
export const loadVendors = (): Vendor[] => loadData<Vendor[]>(VENDORS_KEY, []);
export const saveVendors = (vendors: Vendor[]): void => saveData<Vendor[]>(VENDORS_KEY, vendors);

// Salespeople
export const loadSalespeople = (): Salesperson[] => loadData<Salesperson[]>(SALESPEOPLE_KEY, []);
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
    users = []; // Start with empty if parsing fails
  }

  // Ensure default admin user (Alcides) exists and is correct
  const alcidesUserIndex = users.findIndex(u => u.email === alcidesEmail);

  if (alcidesUserIndex !== -1) {
    // Alcides user exists, check if an update is needed
    const alcides = users[alcidesUserIndex];
    if (alcides.password !== alcidesPassword || !alcides.password || alcides.role !== 'admin' || alcides.name !== 'Alcides' || alcides.id !== alcidesUserId) {
      users[alcidesUserIndex] = {
        ...(alcides.id === alcidesUserId ? alcides : {}), // Preserve other fields if ID matches
        id: alcidesUserId,
        name: 'Alcides',
        email: alcidesEmail,
        role: 'admin',
        password: alcidesPassword,
      };
      updateLocalStorage = true;
    }
  } else {
    // Alcides user does not exist, add them
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
  
  // If users array was initially empty (or after potential parsing error recovery)
  // and Alcides was just added, or if any other initial empty lists need to be set.
  if (users.length === 1 && users[0].id === alcidesUserId && updateLocalStorage) {
    // This means Alcides was the only user, likely because localStorage was empty or cleared.
    // We ensure other keys are also initialized with empty defaults if not present.
    if (!window.localStorage.getItem(EVENT_KEY)) loadEvent();
    if (!window.localStorage.getItem(AWARD_TIERS_KEY)) loadAwardTiers();
    if (!window.localStorage.getItem(STORES_KEY)) loadStores();
    if (!window.localStorage.getItem(VENDORS_KEY)) loadVendors();
    if (!window.localStorage.getItem(SALESPEOPLE_KEY)) loadSalespeople();
  }


  if (updateLocalStorage) {
    saveData<User[]>(USERS_KEY, users);
  }
  
  return users;
};
export const saveUsers = (users: User[]): void => saveData<User[]>(USERS_KEY, users);

// Drawn Winners
export const loadDrawnWinners = (): SweepstakeWinnerRecord[] => loadData<SweepstakeWinnerRecord[]>(DRAWN_WINNERS_KEY, []);
export const saveDrawnWinners = (winners: SweepstakeWinnerRecord[]): void => saveData<SweepstakeWinnerRecord[]>(DRAWN_WINNERS_KEY, winners);

