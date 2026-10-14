export type Role = 'it_admin' | 'manager' | 'user';
export type UserRole = Role;
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface Mess {
  id: string;
  name: string;
  code: string; // 6-character join code
  address?: string;
  adminId: string;
  createdAt: string;
}

export interface Member {
  id: string;
  messId?: string;
  name: string;
  phone: string;
  room: string;
  role: Role;
  status: UserStatus;
  approved: boolean;
  department?: string;
  batch?: string;
  photoUrl?: string;
  avatarColor: string;
  active: boolean;
  joinDate: string;
  mealActive: boolean; // Is the member's daily dining meal currently active?
  stoppedSinceDate?: string; // Date since meal was turned off
  resumeDate?: string; // Scheduled resume date if set via vacation mode
  username?: string; // Username for login
  password?: string; // Password for login
  carryOverDue?: number; // Previous months carried over dues
}

export type LunchPreference = 'beef' | 'mutton' | 'fish' | 'egg' | 'vegetarian';
export type DinnerPreference = 'chicken' | 'fish' | 'egg' | 'vegetarian';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export interface DayMealEntry {
  id: string;
  messId?: string;
  date: string; // YYYY-MM-DD
  memberId: string;
  mealOn: boolean; // Is the whole day's meal ON or OFF?
  mealsCount: number; // Regular meals for the day
  guestMeals: number; // Guest meal counter for this day
  guestBreakfast?: number;
  guestLunch?: number;
  guestDinner?: number;
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  lunchPreference?: LunchPreference;
  dinnerPreference?: DinnerPreference;
  customMealChoice?: string;
  note?: string;
  updatedAt?: string;
}

export type ExpenseCategory =
  | 'fish_meat'
  | 'vegetables'
  | 'grocery_spices'
  | 'oil_rice'
  | 'gas_fuel'
  | 'others';

export interface BazarExpense {
  id: string;
  messId?: string;
  date: string; // YYYY-MM-DD
  memberId: string;
  memberName: string;
  title: string;
  items: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: 'cash' | 'bkash' | 'nagad' | 'bank';
}

export interface Deposit {
  id: string;
  messId?: string;
  date: string; // YYYY-MM-DD
  memberId: string;
  memberName: string;
  amount: number;
  paymentMethod: 'cash' | 'bkash' | 'nagad' | 'bank';
  note?: string;
}

export interface FixedCost {
  id: string;
  messId?: string;
  month: string; // YYYY-MM
  title: string;
  amount: number;
  category: 'cook_bill' | 'utility' | 'wifi' | 'maid' | 'others';
}

export interface MessNotice {
  id: string;
  messId?: string;
  date: string;
  title: string;
  content: string;
  author: string;
  priority: 'normal' | 'important' | 'urgent';
  servingSchedule?: string; // Optional serving time updates
  enableMealChoice?: boolean;
  mealChoices?: string[];
  deadline?: string; // Time cutoff for feast choice e.g. "22:00"
}


export interface MonthlyArchiveSummary {
  id: string; // e.g. `${messId}_${month}`
  messId: string;
  month: string; // YYYY-MM
  totalMeals: number;
  totalBazarCost: number;
  totalFixedCost: number;
  mealRate: number;
  memberSummaries: MealSummaryData[];
  archivedAt: string;
}

export interface MealSummaryData {
  memberId: string;
  memberName: string;
  room?: string;
  department?: string;
  totalDaysOn: number;
  totalRegularMeals: number;
  totalGuestMeals: number;
  totalMeals: number;
  totalDeposit: number;
  mealCost: number;
  fixedCostShare: number;
  carryOverDue: number;
  totalPayable: number;
  balance: number; // deposit - payable (+ means refund/advance, - means due)
  status: 'due' | 'advance' | 'balanced';
  currentMealStatus: 'active' | 'stopped';
  isDefaulter?: boolean;
}

