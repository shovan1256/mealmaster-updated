import React, { useState } from 'react';
import {
  Member,
  DayMealEntry,
  BazarExpense,
  Deposit,
  FixedCost,
  MessNotice,
  MealSummaryData,
  Mess,
} from '../types';
import { DailyCookSheet } from './DailyCookSheet';
import { BazarExpenseManager } from './BazarExpenseManager';
import { DepositManager } from './DepositManager';
import { MonthlyCalculationSheet } from './MonthlyCalculationSheet';
import { MembersManager } from './MembersManager';
import {
  Calendar,
  ShoppingCart,
  Wallet,
  Calculator,
  Users,
  Utensils,
  FileSpreadsheet,
} from 'lucide-react';
import {
  formatCurrency,
  getDayCookSummary,
  getTodayDateString,
} from '../utils/calculations';

interface ManagerPortalProps {
  currentUser: Member;
  currentMess: Mess;
  members: Member[];
  mealEntries: DayMealEntry[];
  bazars: BazarExpense[];
  deposits: Deposit[];
  fixedCosts: FixedCost[];
  notices: MessNotice[];
  memberSummaries: MealSummaryData[];
  totalMeals: number;
  totalBazarCost: number;
  totalFixedCost: number;
  mealRate: number;
  totalDeposited: number;
  totalCostOverall: number;
  selectedMonth: string;
  onSelectMonth?: (month: string) => void;
  onUpdateMealEntry: (entry: DayMealEntry) => void;
  onAddBazar: (bazar: BazarExpense) => void;
  onDeleteBazar: (id: string) => void;
  onAddDeposit: (deposit: Deposit) => void;
  onDeleteDeposit: (id: string) => void;
  onAddNotice: (notice: MessNotice) => void;
  onDeleteNotice: (id: string) => void;
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  onMonthEndCalculated?: (updates: { memberId: string; carryOverDue: number }[]) => void;
  onOpenStatementModal?: () => void;
  activeTab?: 'cook_sheet' | 'bazar' | 'deposits' | 'monthly_calc' | 'members' | 'notices';
  onSelectTab?: (tab: 'cook_sheet' | 'bazar' | 'deposits' | 'monthly_calc' | 'members' | 'notices') => void;
}

export const ManagerPortal: React.FC<ManagerPortalProps> = ({
  currentUser,
  currentMess,
  members,
  mealEntries,
  bazars,
  deposits,
  fixedCosts,
  notices,
  memberSummaries,
  totalMeals,
  totalBazarCost,
  totalFixedCost,
  mealRate,
  totalDeposited,
  totalCostOverall,
  selectedMonth,
  onSelectMonth,
  onUpdateMealEntry,
  onAddBazar,
  onDeleteBazar,
  onAddDeposit,
  onDeleteDeposit,
  onAddNotice,
  onDeleteNotice,
  onAddMember,
  onUpdateMember,
  onMonthEndCalculated,
  onOpenStatementModal,
  activeTab: controlledTab,
  onSelectTab: controlledOnSelectTab,
}) => {
  const [internalTab, setInternalTab] = useState<
    'cook_sheet' | 'bazar' | 'deposits' | 'monthly_calc' | 'members'
  >('cook_sheet');

  const managerTab = (controlledTab as any) ?? internalTab;
  const setManagerTab = (controlledOnSelectTab as any) ?? setInternalTab;

  // KPIs and Calculations
  const cashInHand = totalDeposited - (totalBazarCost + totalFixedCost);
  const pendingCount = members.filter((m) => !m.approved || m.status === 'pending').length;

  const todayStr = getTodayDateString();
  const todayCookSummary = getDayCookSummary(members, mealEntries, todayStr);
  const todayMeals = todayCookSummary.totalMeals;
  const activeMembers = todayCookSummary.activeMembersCount;

  // 5-Item Navigation Config
  const tabs = [
    {
      id: 'cook_sheet',
      label: 'Cook Sheet',
      icon: Calendar,
    },
    {
      id: 'bazar',
      label: 'Bazaar',
      icon: ShoppingCart,
      badge: formatCurrency(totalBazarCost),
    },
    {
      id: 'deposits',
      label: 'Deposits',
      icon: Wallet,
      badge: formatCurrency(totalDeposited),
    },
    {
      id: 'monthly_calc',
      label: 'Monthly Report',
      icon: Calculator,
      badge: `${formatCurrency(mealRate)}/meal`,
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
    {
      id: 'members',
      label: 'Members',
      icon: Users,
      badge: pendingCount > 0 ? `${pendingCount}` : `${members.length}`,
      badgeColor: pendingCount > 0 ? 'bg-rose-500 text-white' : undefined,
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Header: Compact Top Navbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Profile & Role Pill */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm`}
          >
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{currentUser.name}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                  currentUser.role === 'it_admin'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}
              >
                {currentUser.role === 'it_admin' ? '👑 IT Admin' : '💼 Manager'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {currentMess.name} · Room: {currentUser.room}
            </p>
          </div>
        </div>

        {/* Month Filter & Action Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            {onSelectMonth ? (
              <select
                value={selectedMonth}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="bg-transparent text-slate-200 outline-none cursor-pointer pr-1 text-xs font-semibold"
              >
                <option value="2026-09" className="bg-slate-900 text-white">September 2026</option>
                <option value="2026-10" className="bg-slate-900 text-white">October 2026</option>
                <option value="2026-11" className="bg-slate-900 text-white">November 2026</option>
              </select>
            ) : (
              <span className="font-semibold text-slate-200">{selectedMonth}</span>
            )}
          </div>

          {onOpenStatementModal && (
            <button
              onClick={onOpenStatementModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Statement</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Navigation: Clean 5-Item Segmented Control */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-sm">
        <nav className="grid grid-cols-2 sm:grid-cols-5 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = managerTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setManagerTab(tab.id as any)}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-700/20 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                      isActive ? 'bg-indigo-800 text-white' : tab.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. KPI Cards: Single 4-Column Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Cash in Hand */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Cash in Hand
            </span>
            <span
              className={`text-lg sm:text-xl font-black mt-0.5 block ${
                cashInHand >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(cashInHand)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Meal Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Meal Rate
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-xl font-black text-amber-300">
                {formatCurrency(mealRate)}
              </span>
              <span className="text-xs text-slate-400">/meal</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Today's Meals */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Today's Meals
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-xl font-black text-indigo-400">
                {todayMeals}
              </span>
              <span className="text-xs text-slate-400">meals</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Active Members */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Active Members
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-xl font-black text-cyan-400">
                {activeMembers}
              </span>
              <span className="text-xs text-slate-400">/ {members.length}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. Tab Contents */}
      {managerTab === 'cook_sheet' && (
        <DailyCookSheet
          members={members}
          mealEntries={mealEntries}
          onUpdateMealEntry={onUpdateMealEntry}
          currentUser={currentUser}
        />
      )}

      {managerTab === 'bazar' && (
        <BazarExpenseManager
          bazars={bazars}
          members={members}
          onAddBazar={onAddBazar}
          onDeleteBazar={onDeleteBazar}
          currentUser={currentUser}
          selectedMonth={selectedMonth}
        />
      )}

      {managerTab === 'deposits' && (
        <DepositManager
          deposits={deposits}
          members={members}
          onAddDeposit={onAddDeposit}
          onDeleteDeposit={onDeleteDeposit}
          currentUser={currentUser}
          selectedMonth={selectedMonth}
          messName={currentMess.name}
        />
      )}

      {managerTab === 'monthly_calc' && (
        <MonthlyCalculationSheet
          memberSummaries={memberSummaries}
          totalMeals={totalMeals}
          totalBazarCost={totalBazarCost}
          totalFixedCost={totalFixedCost}
          mealRate={mealRate}
          totalDeposited={totalDeposited}
          totalCostOverall={totalCostOverall}
          fixedCosts={fixedCosts}
          selectedMonth={selectedMonth}
          members={members}
          onMonthEndCalculated={onMonthEndCalculated}
          currentUser={currentUser}
          currentMess={currentMess}
        />
      )}

      {managerTab === 'members' && (
        <MembersManager
          members={members}
          onAddMember={onAddMember}
          onUpdateMember={onUpdateMember}
          currentUser={currentUser}
          notices={notices}
          onAddNotice={onAddNotice}
          onDeleteNotice={onDeleteNotice}
          mealEntries={mealEntries}
        />
      )}
    </div>
  );
};
