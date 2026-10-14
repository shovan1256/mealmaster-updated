import React, { useState } from 'react';
import { Member, DayMealEntry, Deposit, MessNotice, MealSummaryData } from '../types';
import { MemberMealToggle } from './MemberMealToggle';
import { UserMyAccount } from './UserMyAccount';
import { UserTodayCookView } from './UserTodayCookView';
import { NoticeBoard } from './NoticeBoard';
import {
  Utensils,
  Receipt,
  Eye,
  Bell,
  Sparkles,
  UserCheck,
} from 'lucide-react';

interface UserPortalProps {
  currentUser: Member;
  members: Member[];
  mealEntries: DayMealEntry[];
  deposits: Deposit[];
  notices: MessNotice[];
  currentUserSummary: MealSummaryData | undefined;
  selectedMonth: string;
  mealRate: number;
  onToggleUserMealStatus: (memberId: string, setActive: boolean) => void;
  onUpdateMealEntry: (updatedEntry: DayMealEntry) => void;
  onBatchUpdateMeals: (entries: DayMealEntry[]) => void;
  onAddNotice: (notice: MessNotice) => void;
  onDeleteNotice: (id: string) => void;
  onOpenStatementModal?: () => void;
  activeTab?: 'my_meals' | 'my_account' | 'today_cook' | 'notices';
  onSelectTab?: (tab: 'my_meals' | 'my_account' | 'today_cook' | 'notices') => void;
}

export const UserPortal: React.FC<UserPortalProps> = ({
  currentUser,
  members,
  mealEntries,
  deposits,
  notices,
  currentUserSummary,
  selectedMonth,
  mealRate,
  onToggleUserMealStatus,
  onUpdateMealEntry,
  onBatchUpdateMeals,
  onAddNotice,
  onDeleteNotice,
  onOpenStatementModal,
  activeTab: controlledTab,
  onSelectTab: controlledOnSelectTab,
}) => {
  const [internalTab, setInternalTab] = useState<'my_meals' | 'my_account' | 'today_cook' | 'notices'>(
    'my_meals'
  );

  const userTab = controlledTab ?? internalTab;
  const setUserTab = controlledOnSelectTab ?? setInternalTab;

  const tabs = [
    {
      id: 'my_meals',
      label: 'আমার মিল অন/অফ',
      icon: Utensils,
      badge: currentUser.mealActive ? 'চালু' : 'বন্ধ',
      badgeColor: currentUser.mealActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300',
    },
    {
      id: 'my_account',
      label: 'আমার ব্যক্তিগত হিসাব ও স্লিপ',
      icon: Receipt,
      badge: currentUserSummary?.balance !== undefined ? (currentUserSummary.balance >= 0 ? 'পাবেন' : 'বকেয়া') : undefined,
      badgeColor: currentUserSummary && currentUserSummary.balance >= 0 ? 'bg-blue-500/20 text-blue-300' : 'bg-rose-500/20 text-rose-300',
    },
    {
      id: 'today_cook',
      label: 'আজকের রান্নার সার্বিক অবস্থা',
      icon: Eye,
    },
    {
      id: 'notices',
      label: 'মেস নোটিশ বোর্ড',
      icon: Bell,
      badge: `${notices.length} টি`,
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Sub-navigation bar for User Portal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-sm">
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = userTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setUserTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      isActive ? 'bg-emerald-800 text-white' : tab.badgeColor || 'bg-slate-800 text-slate-300'
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

      {/* Tab 1: Member Meal On/Off */}
      {userTab === 'my_meals' && (
        <MemberMealToggle
          currentUser={currentUser}
          mealEntries={mealEntries}
          currentUserSummary={currentUserSummary}
          onToggleUserMealStatus={onToggleUserMealStatus}
          onUpdateMealEntry={onUpdateMealEntry}
          onBatchUpdateMeals={onBatchUpdateMeals}
          currentMealRate={mealRate}
          notices={notices}
        />
      )}

      {/* Tab 2: User My Account Statement */}
      {userTab === 'my_account' && (
        <UserMyAccount
          currentUser={currentUser}
          currentUserSummary={currentUserSummary}
          deposits={deposits}
          selectedMonth={selectedMonth}
          mealRate={mealRate}
          onOpenStatementModal={onOpenStatementModal}
        />
      )}

      {/* Tab 3: Today's Cook Count Overview */}
      {userTab === 'today_cook' && (
        <UserTodayCookView
          members={members}
          mealEntries={mealEntries}
          currentUser={currentUser}
        />
      )}

      {/* Tab 4: Notice Board */}
      {userTab === 'notices' && (
        <NoticeBoard
          notices={notices}
          onAddNotice={onAddNotice}
          onDeleteNotice={onDeleteNotice}
          currentUser={currentUser}
          mealEntries={mealEntries}
        />
      )}

    </div>
  );
};
