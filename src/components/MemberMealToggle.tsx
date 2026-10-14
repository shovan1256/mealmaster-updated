import React, { useState } from 'react';
import {
  Member,
  DayMealEntry,
  MealSummaryData,
  MessNotice,
} from '../types';
import {
  CheckCircle2,
  XCircle,
  Users,
  Power,
  Plane,
  Calendar,
  AlertCircle,
  Check,
  Clock,
  Sparkles,
  Lock,
  Utensils,
  ShieldAlert,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import {
  calculateSingleDayMealCount,
  formatCurrency,
  getTodayDateString,
  getTomorrowDateString,
  isNextDayCutoffPassed,
} from '../utils/calculations';

interface MemberMealToggleProps {
  currentUser: Member;
  mealEntries: DayMealEntry[];
  currentUserSummary?: MealSummaryData;
  onToggleUserMealStatus: (memberId: string, setActive: boolean) => void;
  onUpdateMealEntry: (updatedEntry: DayMealEntry) => void;
  onBatchUpdateMeals: (entries: DayMealEntry[]) => void;
  currentMealRate: number;
  notices?: MessNotice[];
}

export const MemberMealToggle: React.FC<MemberMealToggleProps> = ({
  currentUser,
  mealEntries,
  currentUserSummary,
  onToggleUserMealStatus,
  onUpdateMealEntry,
  onBatchUpdateMeals,
  currentMealRate,
  notices,
}) => {
  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  const [activeTab, setActiveTab] = useState<'main_toggle' | 'vacation'>('main_toggle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vacation states
  const [vacationStart, setVacationStart] = useState<string>(todayStr);
  const [vacationResume, setVacationResume] = useState<string>(
    new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Defaulter Lock Enforcement
  const isDefaulter = Boolean(currentUserSummary?.isDefaulter || (currentUserSummary?.balance && currentUserSummary.balance < -4000));

  // Next-day 10:00 PM cutoff status
  const isPast10PM = isNextDayCutoffPassed();
  const isManagerOrAdmin = currentUser.role === 'it_admin' || currentUser.role === 'manager';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getEntryForDate = (dateStr: string): DayMealEntry => {
    const existing = mealEntries.find(
      (e) => e.date === dateStr && e.memberId === currentUser.id
    );
    if (existing) return existing;

    let mealOn = currentUser.mealActive;
    if (currentUser.mealActive === false && currentUser.stoppedSinceDate && dateStr >= currentUser.stoppedSinceDate) {
      mealOn = false;
    }

    return {
      id: `meal-${dateStr}-${currentUser.id}`,
      date: dateStr,
      memberId: currentUser.id,
      mealOn,
      mealsCount: mealOn ? 2 : 0,
      guestMeals: 0,
      lunchPreference: 'beef',
      dinnerPreference: 'chicken',
      updatedAt: new Date().toISOString(),
    };
  };

  const todayEntry = getEntryForDate(todayStr);
  const tomorrowEntry = getEntryForDate(tomorrowStr);

  // Master Meal Toggle
  const handleMasterToggle = () => {
    if (isDefaulter) {
      showToast('⚠️ বকেয়া সীমা অতিক্রম করায় আপনার অ্যাকাউন্ট লক করা রয়েছে। মিল পরিবর্তন সম্ভব নয়।');
      return;
    }

    const newStatus = !currentUser.mealActive;
    onToggleUserMealStatus(currentUser.id, newStatus);

    const updatedToday: DayMealEntry = {
      ...todayEntry,
      mealOn: newStatus,
      mealsCount: newStatus ? 2 : 0,
      updatedAt: new Date().toISOString(),
    };
    onUpdateMealEntry(updatedToday);

    if (newStatus) {
      showToast('আপনার মিল সফলভাবে চালু (ON) করা হয়েছে!');
    } else {
      showToast('আপনার মিল বন্ধ (OFF) করা হয়েছে। আপনি আবার চালু না করা পর্যন্ত মিল বন্ধ থাকবে।');
    }
  };

  // Active feast notices with custom meal choice enabled
  const activeFeastNotices =
    notices?.filter(
      (n) => n.enableMealChoice && n.mealChoices && n.mealChoices.length > 0
    ) || [];

  // Helper to check if a feast notice selection deadline has passed
  const isFeastDeadlinePassed = (notice: MessNotice): boolean => {
    if (!notice.deadline) return false;
    try {
      const now = new Date();
      const cleanDeadline = notice.deadline.trim();
      const targetDateStr = notice.date || todayStr;

      // Check standard 24h format "HH:mm" (e.g. "22:00" or "14:30")
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(cleanDeadline)) {
        const [h, m] = cleanDeadline.split(':').map(Number);
        const target = new Date(`${targetDateStr}T00:00:00`);
        target.setHours(h, m, 0, 0);
        return now.getTime() > target.getTime();
      }

      // Check 12h format e.g. "10:00 PM"
      const match12 = cleanDeadline.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (match12) {
        let h = parseInt(match12[1], 10);
        const m = parseInt(match12[2], 10);
        const meridiem = match12[3].toUpperCase();
        if (meridiem === 'PM' && h < 12) h += 12;
        if (meridiem === 'AM' && h === 12) h = 0;
        const target = new Date(`${targetDateStr}T00:00:00`);
        target.setHours(h, m, 0, 0);
        return now.getTime() > target.getTime();
      }

      const parsed = new Date(cleanDeadline);
      if (!isNaN(parsed.getTime())) {
        return now.getTime() > parsed.getTime();
      }
    } catch (err) {
      console.warn('Error checking feast deadline:', err);
    }
    return false;
  };

  // Feast custom meal choice selection
  const handleFeastChoiceChange = (choice: string, notice: MessNotice) => {
    if (isDefaulter) {
      showToast('⚠️ বকেয়া সীমা অতিক্রম করায় খাবার পছন্দ পরিবর্তন লক রয়েছে।');
      return;
    }

    if (isFeastDeadlinePassed(notice)) {
      showToast('⚠️ নির্বাচনের সময় শেষ (Locked)! সময়সীমা অতিক্রান্ত হয়েছে।');
      return;
    }

    const targetDate = notice.date || todayStr;
    const entry = getEntryForDate(targetDate);
    const updated: DayMealEntry = {
      ...entry,
      customMealChoice: choice,
      updatedAt: new Date().toISOString(),
    };
    onUpdateMealEntry(updated);
    showToast(`ভোজ মেনু পছন্দ সংরক্ষিত: ${choice}`);
  };

  // Toggle tomorrow's meal with 10:00 PM cutoff check
  const handleToggleTomorrowMeal = () => {
    if (isDefaulter) {
      showToast('⚠️ বকেয়া সীমা অতিক্রম করায় অ্যাকাউন্ট লক করা রয়েছে।');
      return;
    }

    if (isPast10PM && !isManagerOrAdmin) {
      showToast('⚠️ রাত ১০:০০ টার পর আগামীকালের মিল পরিবর্তনের সময় শেষ হয়েছে (Cutoff Enforced)। ম্যানেজার ওভাররাইড প্রয়োজন।');
      return;
    }

    const newStatus = !tomorrowEntry.mealOn;
    const updated: DayMealEntry = {
      ...tomorrowEntry,
      mealOn: newStatus,
      mealsCount: newStatus ? 2 : 0,
      updatedAt: new Date().toISOString(),
    };
    onUpdateMealEntry(updated);
    showToast(`আগামীকালের মিল: ${newStatus ? 'চালু (ON)' : 'বন্ধ (OFF)'} করা হয়েছে!`);
  };

  // Guest meals change
  const handleGuestChange = (dateStr: string, delta: number) => {
    if (isDefaulter) {
      showToast('⚠️ বকেয়া সীমা অতিক্রম করায় গেস্ট মিল যোগ করা যাবে না।');
      return;
    }

    if (dateStr === tomorrowStr && isPast10PM && !isManagerOrAdmin) {
      showToast('⚠️ রাত ১০:০০ টার পর আগামীকালের গেস্ট মিল পরিবর্তন লক করা হয়েছে।');
      return;
    }

    const entry = getEntryForDate(dateStr);
    const currentCount = entry.guestMeals || 0;
    const newCount = Math.max(0, currentCount + delta);

    const updated: DayMealEntry = {
      ...entry,
      guestMeals: newCount,
      updatedAt: new Date().toISOString(),
    };
    onUpdateMealEntry(updated);
    showToast(`${dateStr === todayStr ? 'আজকের' : 'আগামীকালের'} গেস্ট মিল: ${newCount} টি`);
  };

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 border border-emerald-500/60 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DEFAULTER LOCK WARNING BANNER */}
      {isDefaulter && (
        <div className="bg-rose-950/70 border-2 border-rose-500 rounded-3xl p-5 shadow-2xl shadow-rose-950/50 text-rose-200">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <span>⚠️ অ্যাকাউন্ট সাময়িক লক (Defaulter Lock Enforced)</span>
              </h3>
              <p className="text-xs text-rose-300 mt-1 leading-relaxed">
                আপনার বকেয়া <strong>২ মাসের নির্ধারিত সীমা (৳৪,০০০)</strong> অতিক্রম করেছে (বর্তমান ব্যালেন্স: {formatCurrency(currentUserSummary?.balance || 0)})। মেস নিয়মানুযায়ী আপনার মিল অন/অফ এবং গেস্ট মিল স্বয়ংক্রিয়ভাবে ফ্রিজ রাখা হয়েছে। অনুগ্রহ করে মেস ম্যানেজারের সাথে যোগাযোগ করে বকেয়া পরিশোধ করুন।
              </p>
            </div>
          </div>
        </div>
      )}


      {/* 1. MINIMAL MASTER MEAL STATUS CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black inline-flex items-center gap-2 ${
              currentUser.mealActive
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentUser.mealActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span>{currentUser.mealActive ? 'মিল চালু (ON)' : 'মিল বন্ধ (OFF)'}</span>
          </span>
        </div>

        <button
          onClick={handleMasterToggle}
          disabled={isDefaulter}
          className={`py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            currentUser.mealActive
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>
            {currentUser.mealActive ? 'মিল বন্ধ করুন' : 'মিল চালু করুন'}
          </span>
        </button>
      </div>

      {/* 2. SPECIAL FEAST-ONLY DYNAMIC MENU CARD (Hidden by default; shown only if feast notice with choices is active) */}
      {activeFeastNotices.length > 0 && (
        <div className="space-y-4">
          {activeFeastNotices.map((feastNotice) => {
            const isDeadlineLocked = isFeastDeadlinePassed(feastNotice);
            const targetEntry = feastNotice.date ? getEntryForDate(feastNotice.date) : todayEntry;
            const currentSelectedChoice = targetEntry.customMealChoice || todayEntry.customMealChoice || '';

            return (
              <div
                key={feastNotice.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-lg relative overflow-hidden transition ${
                  isDeadlineLocked ? 'border-slate-800' : 'border-amber-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <Flame className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ভোজ নোটিশ (Feast Notice)
                        </span>
                        {feastNotice.servingSchedule && (
                          <span className="text-[11px] text-amber-300 flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {feastNotice.servingSchedule}
                          </span>
                        )}
                        {feastNotice.deadline && (
                          <span className="text-[11px] text-amber-300 flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-amber-400" />
                            সময়সীমা: {feastNotice.deadline}
                          </span>
                        )}
                        {isDeadlineLocked ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-rose-400" />
                            নির্বাচনের সময় শেষ (Locked)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            নির্বাচন চালু (Open)
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-white mt-1 leading-snug">
                        {feastNotice.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">
                        {feastNotice.content}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Beef, Mutton & Custom Choice Buttons with Deadline Lock */}
                <div className="mt-4 pt-1 space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-amber-400" />
                      <span>আপনার খাবার পছন্দ নির্বাচন করুন (Feast Choice):</span>
                    </label>
                    {isDeadlineLocked ? (
                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 self-start sm:self-auto">
                        <Lock className="w-3 h-3 text-rose-400" />
                        নির্বাচনের সময় শেষ (Locked)
                      </span>
                    ) : currentSelectedChoice ? (
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>নির্বাচিত পছন্দ: <strong className="underline decoration-emerald-400">{currentSelectedChoice}</strong></span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-400 font-medium">
                        * নিচের বাটনে ক্লিক করে পছন্দ সংরক্ষণ করুন
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {((feastNotice.mealChoices && feastNotice.mealChoices.length > 0)
                      ? feastNotice.mealChoices
                      : ['Beef', 'Mutton']
                    ).map((choice) => {
                      const isSelected = currentSelectedChoice.trim().toLowerCase() === choice.trim().toLowerCase();
                      const isBeef = choice.toLowerCase().includes('beef') || choice.includes('গরু');
                      const isMutton = choice.toLowerCase().includes('mutton') || choice.includes('খাসি');

                      return (
                        <button
                          key={choice}
                          type="button"
                          disabled={isDefaulter || isDeadlineLocked}
                          onClick={() => handleFeastChoiceChange(choice, feastNotice)}
                          className={`p-3 rounded-xl text-xs font-black border-2 transition-all flex items-center justify-between gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            isSelected
                              ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/40'
                              : isDeadlineLocked
                              ? 'bg-slate-900/60 border-slate-800/80 text-slate-500 hover:text-slate-500'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white hover:bg-slate-850'
                          }`}
                          title={isDeadlineLocked ? 'নির্বাচনের সময় শেষ (Locked)' : `পছন্দ হিসেবে ${choice} সংরক্ষণ করুন`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="text-sm">{isBeef ? '🥩' : isMutton ? '🍖' : '🍽️'}</span>
                            <span className="truncate">{choice}</span>
                          </span>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : isDeadlineLocked ? (
                            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. NEXT-DAY DEADLINE & 10:00 PM CUTOFF CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>পরবর্তী দিনের মিল সুইচ ও ১০:০০ PM কাট-অফ ডেডলাইন</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              পরবর্তী দিন: <strong>{tomorrowStr}</strong> • বাজার খরচের সঠিক হিসাবের জন্য রাত ১০:০০ টায় স্বয়ংক্রিয় লক হয়।
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isPast10PM ? (
              <span className="text-xs px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-rose-400" />
                <span>রাত ১০:০০ PM অতিক্রান্ত (LOCKED)</span>
              </span>
            ) : (
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>১০:০০ PM পর্যন্ত পরিবর্তনযোগ্য</span>
              </span>
            )}
          </div>
        </div>

        {/* Tomorrow Switch & Guest Meals */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/70 p-4.5 rounded-2xl border border-slate-850">
          <div>
            <span className="text-xs font-bold text-white block">
              আগামীকালের মিল স্ট্যাটাস:
            </span>
            <span
              className={`text-xs font-black mt-1 inline-block ${
                tomorrowEntry.mealOn ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {tomorrowEntry.mealOn ? '✅ চালু রয়েছে (চালু থাকবে)' : '❌ বন্ধ রয়েছে'}
            </span>
            {isPast10PM && !isManagerOrAdmin && (
              <p className="text-[11px] text-amber-400 mt-1">
                কাট-অফ সময় শেষ হওয়ায় আপনি নিজে পরিবর্তন করতে পারবেন না। ম্যানেজারের সাথে কথা বলুন।
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Guest meals counter for tomorrow */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <span className="text-xs text-slate-400 px-2">গেস্ট মিল:</span>
              <button
                type="button"
                onClick={() => handleGuestChange(tomorrowStr, -1)}
                disabled={isDefaulter || (isPast10PM && !isManagerOrAdmin)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold text-sm flex items-center justify-center hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-bold text-white w-5 text-center">
                {tomorrowEntry.guestMeals || 0}
              </span>
              <button
                type="button"
                onClick={() => handleGuestChange(tomorrowStr, 1)}
                disabled={isDefaulter || (isPast10PM && !isManagerOrAdmin)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold text-sm flex items-center justify-center hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Tomorrow toggle button */}
            <button
              onClick={handleToggleTomorrowMeal}
              disabled={isDefaulter || (isPast10PM && !isManagerOrAdmin)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                tomorrowEntry.mealOn
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{tomorrowEntry.mealOn ? 'আগামীকাল বন্ধ রাখুন' : 'আগামীকাল চালু রাখুন'}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
