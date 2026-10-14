import React from 'react';
import { Member, MealSummaryData, Deposit } from '../types';
import {
  Wallet,
  Receipt,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface UserMyAccountProps {
  currentUser: Member;
  currentUserSummary: MealSummaryData | undefined;
  deposits: Deposit[];
  selectedMonth: string;
  mealRate: number;
  onOpenStatementModal?: () => void;
}

export const UserMyAccount: React.FC<UserMyAccountProps> = ({
  currentUser,
  currentUserSummary,
  deposits,
  selectedMonth,
  mealRate,
  onOpenStatementModal,
}) => {
  const myDeposits = deposits.filter(
    (d) => d.memberId === currentUser.id && d.date.startsWith(selectedMonth)
  );

  const balance = currentUserSummary?.balance ?? 0;
  const isAdvance = balance >= 0;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              আমার ব্যক্তিগত হিসাব ও ব্যালেন্স (My Statement)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              মাস: {selectedMonth}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            চলতি মাসে আপনার মোট খাওয়া মিল, জমা টাকা ও চূড়ান্ত ব্যালেন্সের হিসাব
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenStatementModal && (
            <button
              onClick={onOpenStatementModal}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>মেসের পূর্ণাঙ্গ হিসাব শিট</span>
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>স্লিপ প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Balance */}
        <div
          className={`rounded-2xl p-5 border shadow-sm ${
            isAdvance
              ? 'bg-emerald-950/30 border-emerald-500/40'
              : 'bg-rose-950/30 border-rose-500/40'
          }`}
        >
          <span className="text-xs font-semibold text-slate-300 block uppercase">
            আপনার চূড়ান্ত ব্যালেন্স
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-3xl font-black ${
                isAdvance ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(balance)}
            </span>
            <span className="text-xs text-slate-300">
              {isAdvance ? '(মেস থেকে পাবেন)' : '(বকেয়া দিতে হবে)'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-2">
            মোট জমা - (মিল খরচ + ফিক্সড খরচ)
          </span>
        </div>

        {/* Total Deposit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-semibold block uppercase">
            আপনার মোট জমা ফান্ড
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-emerald-400">
              {formatCurrency(currentUserSummary?.totalDeposit || 0)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-2">
            চলতি মাসে মোট {myDeposits.length} টি পেমেন্ট
          </span>
        </div>

        {/* Total Meals */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-semibold block uppercase">
            মোট খাওয়া মিল
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-white">
              {currentUserSummary?.totalMeals || 0}
            </span>
            <span className="text-xs text-slate-400">টি</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-2">
            নিয়মিত {currentUserSummary?.totalRegularMeals || 0} + গেস্ট {currentUserSummary?.totalGuestMeals || 0}
          </span>
        </div>

        {/* Meal Rate & Cost */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-semibold block uppercase">
            মিল খরচ + ফিক্সড খরচ
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-amber-300">
              {formatCurrency(currentUserSummary?.totalPayable || 0)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-2">
            মিল রেট: {formatCurrency(mealRate)}/মিল
          </span>
        </div>

      </div>

      {/* Slip Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Printable Detailed Slip Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Receipt className="w-4 h-4 text-emerald-400" />
            মাসিক ভাউচার বিবরণী
          </h3>

          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">সদস্যের নাম:</span>
              <span className="font-bold text-white">{currentUser.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">রুম নম্বর:</span>
              <span className="text-slate-200">রুম {currentUser.room}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">মিল চালু ছিল:</span>
              <span className="text-slate-200">{currentUserSummary?.totalDaysOn || 0} দিন</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">গেস্ট মিল সংখ্যা:</span>
              <span className="text-amber-400 font-semibold">{currentUserSummary?.totalGuestMeals || 0} টি</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">সর্বমোট মিল:</span>
              <span className="font-bold text-emerald-400">{currentUserSummary?.totalMeals || 0} টি</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">মিল বাবদ মোট খরচ ({currentUserSummary?.totalMeals || 0} × {formatCurrency(mealRate)}):</span>
              <span className="font-bold text-white">{formatCurrency(currentUserSummary?.mealCost || 0)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">ফিক্সড খরচ ভাগ (বাবুর্চি, গ্যাস, ওয়াইফাই):</span>
              <span className="text-slate-300">{formatCurrency(currentUserSummary?.fixedCostShare || 0)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-100 font-bold">
              <span>মোট প্রদেয় খরচ:</span>
              <span>{formatCurrency(currentUserSummary?.totalPayable || 0)}</span>
            </div>
            <div className="flex justify-between py-1 text-emerald-400 font-bold">
              <span>আপনার মোট জমা টাকা:</span>
              <span>{formatCurrency(currentUserSummary?.totalDeposit || 0)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-800 text-base font-black">
              <span className="text-white">ফাইনাল ব্যালেন্স:</span>
              <span className={isAdvance ? 'text-emerald-400' : 'text-rose-400'}>
                {formatCurrency(balance)} {isAdvance ? '(পাবেন)' : '(বকেয়া)'}
              </span>
            </div>
          </div>
        </div>

        {/* Deposit History */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Wallet className="w-4 h-4 text-emerald-400" />
            চলতি মাসে আপনার জমার রেকর্ড ({myDeposits.length} টি)
          </h3>

          {myDeposits.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              চলতি মাসে এখনও কোনো জমা রেকর্ড পাওয়া যায়নি।
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {myDeposits.map((dep) => (
                <div key={dep.id} className="py-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-white">
                        {dep.note || 'ডিপোজিট জমা'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {dep.date} • {dep.paymentMethod}
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-emerald-400">
                    +{formatCurrency(dep.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
