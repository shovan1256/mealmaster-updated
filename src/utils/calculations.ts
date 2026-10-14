import {
  Member,
  DayMealEntry,
  BazarExpense,
  Deposit,
  FixedCost,
  MealSummaryData,
  MealSlot,
} from '../types';

export const MEALS_PER_DAY = 2; // Lunch + Dinner
export const DEFAULTER_DUES_THRESHOLD = 4000; // ৳4000 threshold (approx. 2 months dining expenses)

// Cutoff Constants
export const CUTOFF_HOURS = {
  NEXT_DAY_MEAL: { hour: 22, minute: 0 }, // 10:00 PM
  BREAKFAST: { hour: 10, minute: 30 }, // 10:30 AM
  LUNCH: { hour: 14, minute: 30 }, // 2:30 PM
  DINNER: { hour: 21, minute: 30 }, // 9:30 PM
};

export const getCurrentMonthString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTomorrowDateString = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateSingleDayMealCount = (
  entry: DayMealEntry | undefined,
  mealsPerDay: number = MEALS_PER_DAY
): number => {
  if (!entry) return 0;
  const isMealOn = entry.mealOn ?? (entry.mealsCount ? entry.mealsCount > 0 : false);
  const regular = isMealOn ? mealsPerDay : 0;
  const guest = entry.guestMeals || 0;
  return regular + guest;
};

/**
 * Checks if 10:00 PM next-day meal cutoff has passed for today
 */
export const isNextDayCutoffPassed = (now: Date = new Date()): boolean => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const cutoffMinutes = CUTOFF_HOURS.NEXT_DAY_MEAL.hour * 60 + CUTOFF_HOURS.NEXT_DAY_MEAL.minute;
  return currentMinutes >= cutoffMinutes;
};

export const filterEntriesByMonth = (
  entries: DayMealEntry[],
  monthStr: string
): DayMealEntry[] => {
  return entries.filter((e) => e.date.startsWith(monthStr));
};

export const calculateMonthlySummary = (
  members: Member[],
  mealEntries: DayMealEntry[],
  bazars: BazarExpense[],
  deposits: Deposit[],
  fixedCosts: FixedCost[],
  monthStr: string,
  mealsPerDay: number = MEALS_PER_DAY
): {
  memberSummaries: MealSummaryData[];
  totalMeals: number;
  totalBazarCost: number;
  totalFixedCost: number;
  mealRate: number;
  totalDeposited: number;
  totalCostOverall: number;
} => {
  const monthMeals = filterEntriesByMonth(mealEntries, monthStr);
  const monthBazars = bazars.filter((b) => b.date.startsWith(monthStr));
  const monthDeposits = deposits.filter((d) => d.date.startsWith(monthStr));
  const monthFixedCosts = fixedCosts.filter((f) => f.month === monthStr);

  const totalBazarCost = monthBazars.reduce((acc, curr) => acc + curr.amount, 0);
  const totalFixedCost = monthFixedCosts.reduce((acc, curr) => acc + curr.amount, 0);
  const totalDeposited = monthDeposits.reduce((acc, curr) => acc + curr.amount, 0);

  const activeMembers = members.filter((m) => m.active);
  const activeMemberCount = Math.max(1, activeMembers.length);
  const fixedCostPerMember = Math.round(totalFixedCost / activeMemberCount);

  let totalMeals = 0;
  const memberMealMap = new Map<
    string,
    { totalDaysOn: number; totalRegularMeals: number; totalGuestMeals: number; totalMeals: number }
  >();

  members.forEach((m) => {
    memberMealMap.set(m.id, {
      totalDaysOn: 0,
      totalRegularMeals: 0,
      totalGuestMeals: 0,
      totalMeals: 0,
    });
  });

  monthMeals.forEach((entry) => {
    const stat = memberMealMap.get(entry.memberId);
    if (stat) {
      const isMealOn = entry.mealOn ?? (entry.mealsCount ? entry.mealsCount > 0 : false);
      const regular = isMealOn ? mealsPerDay : 0;
      const guest = entry.guestMeals || 0;

      if (isMealOn) {
        stat.totalDaysOn += 1;
      }
      stat.totalRegularMeals += regular;
      stat.totalGuestMeals += guest;

      const dayMeals = regular + guest;
      stat.totalMeals += dayMeals;
      totalMeals += dayMeals;
    }
  });

  const mealRate = totalMeals > 0 ? +(totalBazarCost / totalMeals).toFixed(2) : 0;

  const memberSummaries: MealSummaryData[] = members.map((member) => {
    const stats = memberMealMap.get(member.id) || {
      totalDaysOn: 0,
      totalRegularMeals: 0,
      totalGuestMeals: 0,
      totalMeals: 0,
    };

    const memberDeposits = monthDeposits
      .filter((d) => d.memberId === member.id)
      .reduce((sum, d) => sum + d.amount, 0);

    const mealCost = Math.round(stats.totalMeals * mealRate);
    const fixedCostShare = member.active ? fixedCostPerMember : 0;
    const carryOver = member.carryOverDue || 0;
    const totalPayable = mealCost + fixedCostShare + carryOver;
    const balance = memberDeposits - totalPayable;

    let status: 'due' | 'advance' | 'balanced' = 'balanced';
    if (balance > 1) status = 'advance';
    else if (balance < -1) status = 'due';

    // Defaulter if total unpaid due exceeds 2 months threshold (৳4,000)
    const isDefaulter = balance < -DEFAULTER_DUES_THRESHOLD;

    return {
      memberId: member.id,
      memberName: member.name,
      room: member.room,
      department: member.department,
      totalDaysOn: stats.totalDaysOn,
      totalRegularMeals: stats.totalRegularMeals,
      totalGuestMeals: stats.totalGuestMeals,
      totalMeals: stats.totalMeals,
      totalDeposit: memberDeposits,
      mealCost,
      fixedCostShare,
      carryOverDue: carryOver,
      totalPayable,
      balance,
      status,
      currentMealStatus: member.mealActive ? 'active' : 'stopped',
      isDefaulter,
    };
  });

  const totalCostOverall = totalBazarCost + totalFixedCost;

  return {
    memberSummaries,
    totalMeals,
    totalBazarCost,
    totalFixedCost,
    mealRate,
    totalDeposited,
    totalCostOverall,
  };
};

export const getDayCookSummary = (
  members: Member[],
  mealEntries: DayMealEntry[],
  dateStr: string,
  mealsPerDay: number = MEALS_PER_DAY
) => {
  let activeMembersCount = 0;
  let regularMealsCount = 0;
  let guestMealsCount = 0;

  const memberStatusList = members.map((m) => {
    const entry = mealEntries.find((e) => e.date === dateStr && e.memberId === m.id);
    let isMealOn = true;
    if (entry !== undefined) {
      isMealOn = entry.mealOn;
    } else if (m.mealActive === false) {
      if (!m.stoppedSinceDate || dateStr >= m.stoppedSinceDate) {
        isMealOn = false;
      }
    }

    const guestMeals = entry?.guestMeals || 0;
    const regularMeals = isMealOn ? mealsPerDay : 0;

    if (isMealOn) {
      activeMembersCount++;
      regularMealsCount += regularMeals;
    }
    guestMealsCount += guestMeals;

    return {
      member: m,
      entry,
      isMealOn,
      regularMeals,
      guestMeals,
      totalDayMeals: regularMeals + guestMeals,
      lunchPreference: entry?.lunchPreference || 'beef',
      dinnerPreference: entry?.dinnerPreference || 'chicken',
    };
  });

  return {
    date: dateStr,
    activeMembersCount,
    stoppedMembersCount: members.length - activeMembersCount,
    totalMeals: regularMealsCount + guestMealsCount,
    regularMeals: regularMealsCount,
    guestMeals: guestMealsCount,
    memberStatusList,
  };
};

export const formatCurrency = (amount: number): string => {
  return `৳${amount.toLocaleString('en-IN')}`;
};

export const generateDailyCookWhatsAppText = (
  dateStr: string,
  cookSummary: ReturnType<typeof getDayCookSummary>
): string => {
  const parts = [
    `📢 *ডাইনিং মিল ও মেনু আপডেট - তারিখ: ${dateStr}*`,
    `--------------------------------`,
    `🍲 *আজকের মোট রান্নার মিল:* ${cookSummary.totalMeals} টি`,
    `👥 *সদস্য মিল:* ${cookSummary.activeMembersCount} জন (${cookSummary.regularMeals} টি)`,
    `🙋 *গেস্ট মিল:* ${cookSummary.guestMeals} টি`,
    `🚫 *মিল বন্ধ আছে:* ${cookSummary.stoppedMembersCount} জনের`,
    `--------------------------------`,
    `📋 *সদস্যদের মেনু ও খাবার পছন্দ:*`,
  ];

  cookSummary.memberStatusList.forEach((item) => {
    const guestTxt = item.guestMeals > 0 ? ` (+${item.guestMeals} গেস্ট)` : '';
    const statusText = item.isMealOn
      ? `✅ চালু (দুপুর: ${item.lunchPreference}, রাত: ${item.dinnerPreference}${guestTxt})`
      : `❌ মিল বন্ধ${item.guestMeals > 0 ? ` (+${item.guestMeals} গেস্ট মিল)` : ''}`;
    parts.push(`• ${item.member.name} (${item.member.room}): ${statusText}`);
  });

  parts.push(`\n- MealMaster ডাইনিং অ্যাপ থেকে তৈরি`);
  return parts.filter(Boolean).join('\n');
};
