import { Member, BazarExpense, Deposit, FixedCost, MessNotice, DayMealEntry } from '../types';

// All sample members, meals, bazars, deposits, fixed costs, and notices have been removed.
// The app now fetches real-time data from Firebase Firestore.
export const INITIAL_MEMBERS: Member[] = [];

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentMonthString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const generateInitialMealEntries = (_members: Member[]): DayMealEntry[] => {
  return [];
};

export const generateInitialBazars = (_monthStr: string): BazarExpense[] => {
  return [];
};

export const generateInitialDeposits = (_monthStr: string): Deposit[] => {
  return [];
};

export const generateInitialFixedCosts = (_monthStr: string): FixedCost[] => {
  return [];
};

export const INITIAL_NOTICES: MessNotice[] = [];
