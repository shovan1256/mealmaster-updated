import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, initUserDatabase, isFirestoreQuotaError, ensureFirebaseAuth } from '../firebase';
import {
  Member,
  DayMealEntry,
  BazarExpense,
  Deposit,
  FixedCost,
  MessNotice,
  Role,
  UserStatus,
  MealSlot,
} from '../types';

// Firestore collection names
export const USERS_COLLECTION = 'Users';
export const MEALS_COLLECTION = 'DayMealEntries';
export const BAZARS_COLLECTION = 'BazarExpenses';
export const DEPOSITS_COLLECTION = 'Deposits';
export const FIXED_COSTS_COLLECTION = 'FixedCosts';
export const NOTICES_COLLECTION = 'MessNotices';

export interface FirestoreUserDoc {
  uid: string;
  phone: string;
  name: string;
  role: Role; // 'it_admin' | 'manager' | 'user'
  status: UserStatus; // 'pending' | 'approved' | 'rejected'
  approved: boolean;
  room?: string;
  department?: string;
  batch?: string;
  photoUrl?: string;
  active: boolean;
  mealActive?: boolean;
  stoppedSinceDate?: string;
  avatarColor?: string;
  username?: string;
  password?: string;
  carryOverDue?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ----------------- USERS COLLECTION -----------------

export async function getUserFromFirestore(uid: string): Promise<FirestoreUserDoc | null> {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as FirestoreUserDoc;
    }
    return null;
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      console.warn('Firestore quota reached; using local user profile.');
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getUserByPhone(phone: string): Promise<FirestoreUserDoc | null> {
  const cleanPhone = phone.trim().replace(/\s+/g, '');
  try {
    const q = query(collection(db, USERS_COLLECTION), where('phone', '==', cleanPhone));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as FirestoreUserDoc;
    }
    return null;
  } catch (error) {
    console.warn('Could not query user by phone:', error);
    return null;
  }
}

export async function getUserByUsernameOrPhone(identifier: string): Promise<FirestoreUserDoc | null> {
  const trimmed = identifier.trim();
  const clean = trimmed.toLowerCase();
  const cleanNoSpaces = clean.replace(/[\s-+]/g, '');

  try {
    try {
      await ensureFirebaseAuth();
    } catch {
      // Proceed even if anonymous auth fails
    }

    // 1. Direct indexed query by username
    try {
      const qUser = query(collection(db, USERS_COLLECTION), where('username', '==', trimmed));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) {
        return snapUser.docs[0].data() as FirestoreUserDoc;
      }
    } catch (e) {
      // continue to next query
    }

    // 2. Direct indexed query by multiple phone candidates
    const phoneCandidates = Array.from(
      new Set([
        cleanNoSpaces,
        '+88' + cleanNoSpaces,
        cleanNoSpaces.startsWith('88') ? '+' + cleanNoSpaces : '+88' + cleanNoSpaces,
        cleanNoSpaces.startsWith('0') ? '+88' + cleanNoSpaces : '+880' + cleanNoSpaces,
        trimmed,
      ])
    ).filter(Boolean);

    for (const p of phoneCandidates) {
      try {
        const qPhone = query(collection(db, USERS_COLLECTION), where('phone', '==', p));
        const snapPhone = await getDocs(qPhone);
        if (!snapPhone.empty) {
          return snapPhone.docs[0].data() as FirestoreUserDoc;
        }
      } catch (e) {
        // continue
      }
    }

    // 3. Fallback scan across users
    const allUsers = await getAllUsersFromFirestore();
    const matched = allUsers.find((u) => {
      const uPhone = (u.phone || '').replace(/[\s-+]/g, '').toLowerCase();
      const uUser = (u.username || '').toLowerCase();
      const uName = (u.name || '').toLowerCase();

      return (
        uUser === clean ||
        uPhone === cleanNoSpaces ||
        uPhone.endsWith(cleanNoSpaces) ||
        cleanNoSpaces.endsWith(uPhone) ||
        uName === clean ||
        (clean.length > 3 && uName.includes(clean))
      );
    });

    return matched || null;
  } catch (error) {
    console.warn('Could not query user by username or phone:', error);
    return null;
  }
}

export async function countTotalUsersInFirestore(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    return snap.size;
  } catch (e) {
    return 0;
  }
}

export async function saveUserToFirestore(userData: FirestoreUserDoc): Promise<void> {
  const path = `${USERS_COLLECTION}/${userData.uid}`;
  try {
    await ensureFirebaseAuth();
    const payload = {
      ...userData,
      updatedAt: new Date().toISOString(),
      createdAt: userData.createdAt || new Date().toISOString(),
    };
    await initUserDatabase(userData.uid, payload);
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      console.warn('User saved in local cache (quota exceeded).');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserInFirestore(uid: string, fields: Partial<FirestoreUserDoc>): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(
      docRef,
      {
        ...fields,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('updateUserInFirestore warning (handled gracefully):', error);
  }
}

export async function updateUserApprovalStatus(
  uid: string,
  approved: boolean,
  status: UserStatus
): Promise<void> {
  return updateUserInFirestore(uid, { approved, status });
}

export async function updateUserRole(uid: string, role: Role): Promise<void> {
  return updateUserInFirestore(uid, { role });
}

export async function getAllUsersFromFirestore(): Promise<FirestoreUserDoc[]> {
  const path = USERS_COLLECTION;
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    return snap.docs.map((d) => d.data() as FirestoreUserDoc);
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      console.warn('Firestore quota reached; operating with local users.');
      return [];
    }
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToUsers(
  callback: (users: FirestoreUserDoc[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, USERS_COLLECTION),
    (snap) => {
      const users = snap.docs.map((d) => d.data() as FirestoreUserDoc);
      callback(users);
    },
    (error) => {
      if (isFirestoreQuotaError(error)) {
        console.warn('Users live sync paused due to daily quota limit. Operating locally.');
        return;
      }
      if (onError) onError(error);
      else console.warn('Users snapshot note:', error);
    }
  );
}

function removeUndefined<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// ----------------- MEAL ENTRIES & SYSTEM -----------------

export async function saveMealEntryToFirestore(entry: DayMealEntry): Promise<void> {
  const path = `${MEALS_COLLECTION}/${entry.id}`;
  try {
    const dataToSave = removeUndefined({
      ...entry,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, MEALS_COLLECTION, entry.id), dataToSave, { merge: true });
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      console.warn('Meal saved locally (quota reached).');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function batchSaveMealEntriesToFirestore(entries: DayMealEntry[]): Promise<void> {
  try {
    await Promise.all(entries.map((entry) => saveMealEntryToFirestore(entry)));
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      console.warn('Batch meals saved locally (quota reached).');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, MEALS_COLLECTION);
  }
}


export function subscribeToUserMeals(
  userId: string,
  callback: (meals: DayMealEntry[]) => void,
  onError?: (err: any) => void
) {
  const q = query(collection(db, MEALS_COLLECTION), where('memberId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const meals = snap.docs.map((d) => d.data() as DayMealEntry);
      callback(meals);
    },
    (err) => {
      if (isFirestoreQuotaError(err)) {
        console.warn('User meals sync paused due to daily quota limit. Operating locally.');
        return;
      }
      if (onError) onError(err);
      else console.warn('User meals snapshot note:', err);
    }
  );
}

export function subscribeToAllMeals(
  callback: (meals: DayMealEntry[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, MEALS_COLLECTION),
    (snap) => {
      const meals = snap.docs.map((d) => d.data() as DayMealEntry);
      callback(meals);
    },
    (err) => {
      if (isFirestoreQuotaError(err)) {
        console.warn('All meals sync paused due to daily quota limit. Operating locally.');
        return;
      }
      if (onError) onError(err);
      else console.warn('All meals snapshot note:', err);
    }
  );
}

// ----------------- BAZAR EXPENSES (MANAGER ONLY) -----------------

export async function saveBazarToFirestore(bazar: BazarExpense): Promise<void> {
  const path = `${BAZARS_COLLECTION}/${bazar.id}`;
  try {
    await setDoc(doc(db, BAZARS_COLLECTION, bazar.id), bazar, { merge: true });
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      console.warn('Bazar expense saved locally (quota reached).');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBazarFromFirestore(id: string): Promise<void> {
  const path = `${BAZARS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, BAZARS_COLLECTION, id));
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      console.warn('Bazar expense deleted locally (quota reached).');
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToBazars(
  callback: (bazars: BazarExpense[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, BAZARS_COLLECTION),
    (snap) => {
      const bazars = snap.docs.map((d) => d.data() as BazarExpense);
      callback(bazars);
    },
    (err) => {
      if (isFirestoreQuotaError(err)) {
        console.warn('Bazars sync paused due to daily quota limit. Operating locally.');
        return;
      }
      if (onError) onError(err);
      else console.warn('Bazars snapshot note:', err);
    }
  );
}

// ----------------- DEPOSITS -----------------

export async function saveDepositToFirestore(deposit: Deposit): Promise<void> {
  const path = `${DEPOSITS_COLLECTION}/${deposit.id}`;
  try {
    await setDoc(doc(db, DEPOSITS_COLLECTION, deposit.id), deposit, { merge: true });
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      console.warn('Deposit saved locally (quota reached).');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDepositFromFirestore(id: string): Promise<void> {
  const path = `${DEPOSITS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, DEPOSITS_COLLECTION, id));
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      console.warn('Deposit deleted locally (quota reached).');
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToDeposits(
  callback: (deposits: Deposit[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, DEPOSITS_COLLECTION),
    (snap) => {
      const deposits = snap.docs.map((d) => d.data() as Deposit);
      callback(deposits);
    },
    (err) => {
      if (isFirestoreQuotaError(err)) {
        console.warn('Deposits sync paused due to daily quota limit. Operating locally.');
        return;
      }
      if (onError) onError(err);
      else console.warn('Deposits snapshot note:', err);
    }
  );
}

// ----------------- FIXED COSTS -----------------

export async function saveFixedCostToFirestore(cost: FixedCost): Promise<void> {
  const path = `${FIXED_COSTS_COLLECTION}/${cost.id}`;
  try {
    await setDoc(doc(db, FIXED_COSTS_COLLECTION, cost.id), cost, { merge: true });
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      console.warn('Fixed cost saved locally (quota reached).');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToFixedCosts(
  callback: (costs: FixedCost[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, FIXED_COSTS_COLLECTION),
    (snap) => {
      const costs = snap.docs.map((d) => d.data() as FixedCost);
      callback(costs);
    },
    (err) => {
      if (isFirestoreQuotaError(err)) {
        console.warn('Fixed costs sync paused due to daily quota limit. Operating locally.');
        return;
      }
      if (onError) onError(err);
      else console.warn('Fixed costs snapshot note:', err);
    }
  );
}

// ----------------- NOTICES -----------------

export async function saveNoticeToFirestore(notice: MessNotice): Promise<void> {
  const path = `${NOTICES_COLLECTION}/${notice.id}`;
  try {
    const dataToSave = removeUndefined(notice);
    await setDoc(doc(db, NOTICES_COLLECTION, notice.id), dataToSave, { merge: true });
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      console.warn('Notice saved locally (quota reached).');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteNoticeFromFirestore(id: string): Promise<void> {
  const path = `${NOTICES_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, NOTICES_COLLECTION, id));
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      console.warn('Notice deleted locally (quota reached).');
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToNotices(
  callback: (notices: MessNotice[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, NOTICES_COLLECTION),
    (snap) => {
      const notices = snap.docs.map((d) => d.data() as MessNotice);
      callback(notices);
    },
    (err) => {
      if (isFirestoreQuotaError(err)) {
        console.warn('Notices sync paused due to daily quota limit. Operating locally.');
        return;
      }
      if (onError) onError(err);
      else console.warn('Notices snapshot note:', err);
    }
  );
}

// Month End Calculation: Update user carryOverDue in Firestore
export async function applyMonthEndCarryOver(
  updates: { memberId: string; carryOverDue: number }[]
): Promise<void> {
  try {
    await Promise.all(
      updates.map((u) =>
        updateDoc(doc(db, USERS_COLLECTION, u.memberId), {
          carryOverDue: u.carryOverDue,
          updatedAt: new Date().toISOString(),
        })
      )
    );
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      console.warn('Carry over applied locally (quota reached).');
      return;
    }
    handleFirestoreError(error, OperationType.UPDATE, USERS_COLLECTION);
  }
}
