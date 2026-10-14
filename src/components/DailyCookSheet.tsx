import React, { useState } from 'react';
import { Member, DayMealEntry } from '../types';
import {
  Calendar,
  Users,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Power,
  Utensils,
  Sparkles,
} from 'lucide-react';
import { getDayCookSummary, generateDailyCookWhatsAppText } from '../utils/calculations';

interface DailyCookSheetProps {
  members: Member[];
  mealEntries: DayMealEntry[];
  onUpdateMealEntry: (entry: DayMealEntry) => void;
  currentUser: Member;
}

export const DailyCookSheet: React.FC<DailyCookSheetProps> = ({
  members,
  mealEntries,
  onUpdateMealEntry,
  currentUser,
}) => {
  const today = new Date();
  const formatIsoDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(formatIsoDate(today));
  const [copied, setCopied] = useState<boolean>(false);

  const handleShiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    setSelectedDate(formatIsoDate(dateObj));
  };

  const cookSummary = getDayCookSummary(members, mealEntries, selectedDate);

  const handleToggleMemberMeal = (memberId: string) => {
    const existing = mealEntries.find(
      (e) => e.date === selectedDate && e.memberId === memberId
    );

    const currentStatus = existing ? existing.mealOn : true;
    const newStatus = !currentStatus;

    const updated: DayMealEntry = existing
      ? {
          ...existing,
          mealOn: newStatus,
          mealsCount: newStatus ? 2 : 0,
          updatedAt: new Date().toISOString(),
        }
      : {
          id: `meal-${selectedDate}-${memberId}`,
          date: selectedDate,
          memberId,
          mealOn: newStatus,
          mealsCount: newStatus ? 2 : 0,
          guestMeals: 0,
          updatedAt: new Date().toISOString(),
        };

    onUpdateMealEntry(updated);
  };

  const handleGuestChange = (memberId: string, delta: number) => {
    const existing = mealEntries.find(
      (e) => e.date === selectedDate && e.memberId === memberId
    );

    const currentCount = existing ? existing.guestMeals || 0 : 0;
    const newCount = Math.max(0, currentCount + delta);

    const updated: DayMealEntry = existing
      ? {
          ...existing,
          guestMeals: newCount,
          updatedAt: new Date().toISOString(),
        }
      : {
          id: `meal-${selectedDate}-${memberId}`,
          date: selectedDate,
          memberId,
          mealOn: true,
          mealsCount: 2,
          guestMeals: newCount,
          updatedAt: new Date().toISOString(),
        };

    onUpdateMealEntry(updated);
  };

  // Live Feast Choice Tally for the selected date
  const feastChoiceCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    mealEntries
      .filter((e) => e.date === selectedDate && e.mealOn && e.customMealChoice)
      .forEach((e) => {
        const choice = e.customMealChoice!.trim();
        counts[choice] = (counts[choice] || 0) + 1;
      });
    return counts;
  }, [mealEntries, selectedDate]);

  const handleCopyWhatsAppText = () => {
    let text = generateDailyCookWhatsAppText(selectedDate, cookSummary);
    if (Object.keys(feastChoiceCounts).length > 0) {
      const tallyText = Object.entries(feastChoiceCounts)
        .map(([c, count]) => `• ${c}: ${count} জন`)
        .join('\n');
      text += `\n\n🎉 *ভোজ মেনু সারসংক্ষেপ (Feast Tally):*\n${tallyText}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isToday = selectedDate === formatIsoDate(today);

  const preferenceMap: Record<string, string> = {
    beef: 'গরু (Beef)',
    mutton: 'খাসি (Mutton)',
    fish: 'মাছ (Fish)',
    egg: 'ডিম (Egg)',
    chicken: 'মুরগি (Chicken)',
    vegetarian: 'সবজি (Veg)',
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              দৈনিক রান্নার মিল শিট (Daily Cook Sheet & Menu)
            </h2>
            {isToday && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                আজকের দিন
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            বাবুর্চি ও মেস ম্যানেজারদের জন্য খাদ্য তালিকা ও মেম্বারদের খাবার পছন্দ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-slate-950 rounded-2xl border border-slate-800 p-1">
            <button
              onClick={() => handleShiftDate(-1)}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
              title="আগের দিন"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-white font-medium px-2 py-1 outline-none cursor-pointer"
            />
            <button
              onClick={() => handleShiftDate(1)}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
              title="পরের দিন"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleCopyWhatsAppText}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                কপি হয়েছে!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                হোয়াটসঅ্যাপ রিপোর্ট কপি
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-5 shadow-sm">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide block">
            আজকের মোট রান্না
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-black text-white">{cookSummary.totalMeals}</span>
            <span className="text-sm text-slate-400">টি মিল</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs text-slate-400">
            মেম্বার মিল ({cookSummary.regularMeals}) + গেস্ট মিল ({cookSummary.guestMeals})
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
            সক্রিয় মেম্বার
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-white">{cookSummary.activeMembersCount}</span>
            <span className="text-sm text-slate-400">জন (মোট {members.length} জনের মধ্যে)</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs text-slate-400">
            জনপ্রতি ২ মিল = {cookSummary.regularMeals} টি নিয়মিত মিল
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wide block">
            মিল বন্ধ আছে
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-rose-400">{cookSummary.stoppedMembersCount}</span>
            <span className="text-sm text-slate-400">জনের</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs text-slate-400">
            এদের খাবার রান্না করা হবে না
          </div>
        </div>
      </div>

      {/* Live Feast Choice Tally Summary */}
      {Object.keys(feastChoiceCounts).length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Utensils className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  <span>ভোজ মেনু পছন্দ লাইভ সামারি (Feast Choice Summary)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  তারিখ: {selectedDate} • বোর্ডারদের নির্বাচিত খাবার পছন্দের লাইভ কাউন্ট
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(feastChoiceCounts).map(([choice, count]) => (
                <div
                  key={choice}
                  className="px-3.5 py-2 rounded-2xl bg-amber-500/20 text-amber-200 border border-amber-500/40 text-xs font-black flex items-center gap-2 shadow-sm"
                >
                  <span className="text-amber-300">
                    {choice.toLowerCase().includes('beef') ? '🥩' : choice.toLowerCase().includes('mutton') ? '🍖' : '🍽️'} {choice}:
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-400/20 text-white font-mono text-sm">
                    {count} জন
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Member Attendance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            সদস্য অনুযায়ী দৈনিক মিল ও মেনু পছন্দ ({selectedDate})
          </h3>
          <span className="text-xs text-slate-400">
            মোট সদস্য: {members.length} জন
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 pl-5">সদস্যের নাম ও রুম</th>
                <th className="py-3 px-3">মেনু পছন্দ (দুপুর / রাত)</th>
                <th className="py-3 px-4 text-center">মিল স্ট্যাটাস</th>
                <th className="py-3 px-4 text-center">গেস্ট মিল</th>
                <th className="py-3 px-4 text-center pr-5">মোট মিল</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {cookSummary.memberStatusList.map((row) => {
                const isCurrent = row.member.id === currentUser.id;

                return (
                  <tr
                    key={row.member.id}
                    className={`hover:bg-slate-850/50 transition ${
                      isCurrent ? 'bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 pl-5 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl ${row.member.avatarColor} text-white flex items-center justify-center font-bold text-xs`}
                        >
                          {row.member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{row.member.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                                আপনি
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            রুম {row.member.room} • {row.member.department || ''}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="space-y-1">
                        {row.entry?.customMealChoice ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
                            <span>{row.entry.customMealChoice.toLowerCase().includes('beef') ? '🥩' : row.entry.customMealChoice.toLowerCase().includes('mutton') ? '🍖' : '🍽️'}</span>
                            <span>ভোজ পছন্দ: {row.entry.customMealChoice}</span>
                          </div>
                        ) : (
                          <>
                            <span className="text-amber-300 font-semibold block text-[11px]">
                              দুপুর: {preferenceMap[row.lunchPreference] || row.lunchPreference}
                            </span>
                            <span className="text-indigo-300 block text-[11px]">
                              রাত: {preferenceMap[row.dinnerPreference] || row.dinnerPreference}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleMemberMeal(row.member.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
                          row.isMealOn
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {row.isMealOn ? '🟢 চালু (২ মিল)' : '🔴 বন্ধ (০)'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-xl">
                        <button
                          onClick={() => handleGuestChange(row.member.id, -1)}
                          disabled={!row.guestMeals}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-white flex items-center justify-center font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="font-bold text-amber-400 px-1 text-xs">
                          {row.guestMeals || 0}
                        </span>
                        <button
                          onClick={() => handleGuestChange(row.member.id, 1)}
                          className="w-5 h-5 rounded bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 pr-5 text-center font-black text-sm text-white">
                      {row.totalDayMeals}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
