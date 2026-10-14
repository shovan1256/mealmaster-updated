import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db, initUserDatabase, ensureFirebaseAuth } from '../firebase';
import { Member, DayMealEntry, BazarExpense, Deposit, FixedCost, MessNotice, Mess, MonthlyArchiveSummary } from '../types';

export const DEFAULT_MESS: Mess = {
  id: 'default_mess',
  name: 'ঢাকা সেন্ট্রাল ডাইনিং মেস',
  code: 'MM-1001',
  address: 'ধানমন্ডি, ঢাকা',
  adminId: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const STORAGE_KEYS = {
  MEMBERS: 'mealmaster_clean_members_v4',
  MEALS: 'mealmaster_clean_meals_v4',
  BAZARS: 'mealmaster_clean_bazars_v4',
  DEPOSITS: 'mealmaster_clean_deposits_v4',
  FIXED_COSTS: 'mealmaster_clean_fixed_costs_v4',
  NOTICES: 'mealmaster_clean_notices_v4',
  CURRENT_USER_ID: 'mealmaster_clean_current_user_id_v4',
  MESSES: 'mealmaster_clean_messes_v4',
  ACTIVE_MESS_ID: 'mealmaster_clean_active_mess_id_v4',
  AUDIT_LOGS: 'mealmaster_clean_audit_logs_v4',
  MONTHLY_ARCHIVES: 'mealmaster_clean_archives_v4',
};

// Purge legacy storage keys
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    [
      'mealmaster_clean_members_v3',
      'mealmaster_clean_meals_v3',
      'mealmaster_clean_bazars_v3',
      'mealmaster_clean_deposits_v3',
      'mealmaster_clean_fixed_costs_v3',
      'mealmaster_clean_notices_v3',
      'mealmaster_clean_current_user_id_v3',
      'mealmaster_members_v2',
      'mealmaster_meals_v2',
      'mealmaster_bazars_v2',
      'mealmaster_deposits_v2',
      'mealmaster_fixed_costs_v2',
      'mealmaster_notices_v2',
      'mealmaster_members',
      'mealmaster_meals',
    ].forEach((k) => localStorage.removeItem(k));
  }
} catch (e) {
  // ignore storage errors
}

// =========================================================================
// 1. MEMBERS SYNC & STORAGE (Users Collection)
// =========================================================================

export const getMembers = (): Member[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading members from localStorage:', e);
  }
  return [];
};

export const syncMemberToFirestore = async (member: Member): Promise<void> => {
  try {
    await initUserDatabase(member.id, {
      uid: member.id,
      phone: member.phone || '',
      name: member.name,
      username: member.username || '',
      password: member.password || '',
      role: member.role || 'user',
      status: member.status || 'pending',
      approved: member.approved ?? false,
      department: member.department || '',
      batch: member.batch || '',
      photoUrl: member.photoUrl || '',
      room: member.room || '101',
      active: member.active ?? true,
      mealActive: member.mealActive ?? true,
      stoppedSinceDate: member.stoppedSinceDate || null,
      carryOverDue: member.carryOverDue || 0,
      avatarColor: member.avatarColor || (member.role === 'it_admin' ? 'bg-amber-600' : member.role === 'manager' ? 'bg-indigo-600' : 'bg-emerald-600'),
      createdAt: member.joinDate || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || String(e).includes('quota') || String(e).includes('Quota')) {
      console.warn(`Member ${member.id} synced in local cache (Firestore daily quota reached).`);
      return;
    }
    console.warn(`Failed to sync member ${member.id} to Firestore:`, e);
  }
};

export const saveMembers = (members: Member[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.error('Error saving members to localStorage:', e);
  }
};

// =========================================================================
// 2. DAY MEAL ENTRIES SYNC & STORAGE (DayMealEntries Collection)
// =========================================================================

export const getMealEntries = (): DayMealEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading meal entries from localStorage:', e);
  }
  return [];
};

export const syncMealEntryToFirestore = async (entry: DayMealEntry): Promise<void> => {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'DayMealEntries', entry.id);
    await setDoc(docRef, {
      ...entry,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || String(e).includes('quota') || String(e).includes('Quota')) {
      console.warn(`Meal entry ${entry.id} saved in local storage (Firestore daily quota reached).`);
      return;
    }
    console.warn(`Failed to sync meal entry ${entry.id} to Firestore:`, e);
  }
};

export const saveMealEntries = (entries: DayMealEntry[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(entries));
  } catch (e) {
    console.error('Error saving meal entries to localStorage:', e);
  }
};

// =========================================================================
// 3. BAZAR EXPENSES SYNC & STORAGE (BazarExpenses Collection)
// =========================================================================

export const getBazars = (): BazarExpense[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BAZARS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading bazars from localStorage:', e);
  }
  return [];
};

export const syncBazarToFirestore = async (bazar: BazarExpense): Promise<void> => {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'BazarExpenses', bazar.id);
    await setDoc(docRef, bazar, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || String(e).includes('quota') || String(e).includes('Quota')) {
      console.warn(`Bazar expense ${bazar.id} saved in local storage (Firestore daily quota reached).`);
      return;
    }
    console.warn(`Failed to sync bazar ${bazar.id} to Firestore:`, e);
  }
};

export const saveBazars = (bazars: BazarExpense[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.BAZARS, JSON.stringify(bazars));
  } catch (e) {
    console.error('Error saving bazars to localStorage:', e);
  }
};

// =========================================================================
// 4. DEPOSITS SYNC & STORAGE (Deposits Collection)
// =========================================================================

export const getDeposits = (): Deposit[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading deposits from localStorage:', e);
  }
  return [];
};

export const syncDepositToFirestore = async (deposit: Deposit): Promise<void> => {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'Deposits', deposit.id);
    await setDoc(docRef, deposit, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || String(e).includes('quota') || String(e).includes('Quota')) {
      console.warn(`Deposit ${deposit.id} saved in local storage (Firestore daily quota reached).`);
      return;
    }
    console.warn(`Failed to sync deposit ${deposit.id} to Firestore:`, e);
  }
};

export const saveDeposits = (deposits: Deposit[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deposits));
  } catch (e) {
    console.error('Error saving deposits to localStorage:', e);
  }
};

// =========================================================================
// 5. FIXED COSTS SYNC & STORAGE (FixedCosts Collection)
// =========================================================================

export const getFixedCosts = (): FixedCost[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FIXED_COSTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading fixed costs from localStorage:', e);
  }
  return [];
};

export const syncFixedCostToFirestore = async (cost: FixedCost): Promise<void> => {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'FixedCosts', cost.id);
    await setDoc(docRef, cost, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || String(e).includes('quota') || String(e).includes('Quota')) {
      console.warn(`Fixed cost ${cost.id} saved in local storage (Firestore daily quota reached).`);
      return;
    }
    console.warn(`Failed to sync fixed cost ${cost.id} to Firestore:`, e);
  }
};

export const saveFixedCosts = (costs: FixedCost[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.FIXED_COSTS, JSON.stringify(costs));
  } catch (e) {
    console.error('Error saving fixed costs to localStorage:', e);
  }
};

// =========================================================================
// 6. MESS NOTICES SYNC & STORAGE (MessNotices Collection)
// =========================================================================

export const getNotices = (): MessNotice[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTICES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading notices from localStorage:', e);
  }
  return [];
};

export const syncNoticeToFirestore = async (notice: MessNotice): Promise<void> => {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'MessNotices', notice.id);
    await setDoc(docRef, notice, { merge: true });
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || String(e).includes('quota') || String(e).includes('Quota')) {
      console.warn(`Notice ${notice.id} saved in local storage (Firestore daily quota reached).`);
      return;
    }
    console.warn(`Failed to sync notice ${notice.id} to Firestore:`, e);
  }
};

export const saveNotices = (notices: MessNotice[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
  } catch (e) {
    console.error('Error saving notices to localStorage:', e);
  }
};

// =========================================================================
// 7. CURRENT USER ID & DATA RESET
// =========================================================================

export const getCurrentUserId = (defaultId: string): string => {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || defaultId;
  } catch (e) {
    return defaultId;
  }
};

export const setCurrentUserId = (id: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  } catch (e) {
    console.error('Error setting current user ID in localStorage:', e);
  }
};

export const resetAllData = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.error('Error resetting data in localStorage:', e);
  }
};

export const fetchAllFromFirestore = async () => {
  try {
    await ensureFirebaseAuth();
    const [usersSnap, mealsSnap, bazarsSnap, depositsSnap, costsSnap, noticesSnap] = await Promise.all([
      getDocs(collection(db, 'Users')),
      getDocs(collection(db, 'DayMealEntries')),
      getDocs(collection(db, 'BazarExpenses')),
      getDocs(collection(db, 'Deposits')),
      getDocs(collection(db, 'FixedCosts')),
      getDocs(collection(db, 'MessNotices')),
    ]);

    return {
      users: usersSnap.docs.map((d) => d.data()),
      meals: mealsSnap.docs.map((d) => d.data()),
      bazars: bazarsSnap.docs.map((d) => d.data()),
      deposits: depositsSnap.docs.map((d) => d.data()),
      fixedCosts: costsSnap.docs.map((d) => d.data()),
      notices: noticesSnap.docs.map((d) => d.data()),
    };
  } catch (e) {
    console.warn('Error fetching all collections from Firestore:', e);
    return null;
  }
};

// =========================================================================
// 8. MULTI-MESS PLATFORM & AUDIT LOGS STORAGE
// =========================================================================

export const getMesses = (): Mess[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading messes from localStorage:', e);
  }
  return [DEFAULT_MESS];
};

export const saveMesses = (messes: Mess[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.MESSES, JSON.stringify(messes));
  } catch (e) {
    console.error('Error saving messes to localStorage:', e);
  }
};

export const getActiveMessId = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_MESS_ID) || DEFAULT_MESS.id;
  } catch (e) {
    return DEFAULT_MESS.id;
  }
};

export const setActiveMessId = (id: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_MESS_ID, id);
  } catch (e) {
    console.error('Error setting active mess id in localStorage:', e);
  }
};

export const getMonthlyArchives = (): MonthlyArchiveSummary[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MONTHLY_ARCHIVES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading monthly archives from localStorage:', e);
  }
  return [];
};

export const saveMonthlyArchives = (archives: MonthlyArchiveSummary[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.MONTHLY_ARCHIVES, JSON.stringify(archives));
  } catch (e) {
    console.error('Error saving monthly archives to localStorage:', e);
  }
};

