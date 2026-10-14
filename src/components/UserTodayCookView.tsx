import React from 'react';
import { Member, DayMealEntry } from '../types';
import { Utensils, Users, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { getDayCookSummary, getTodayDateString } from '../utils/calculations';

interface UserTodayCookViewProps {
  members: Member[];
  mealEntries: DayMealEntry[];
  currentUser: Member;
}

export const UserTodayCookView: React.FC<UserTodayCookViewProps> = ({
  members,
  mealEntries,
  currentUser,
}) => {
  const todayStr = getTodayDateString();
  const cookSummary = getDayCookSummary(members, mealEntries, todayStr);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-400" />
              আজকের ডাইনিং রান্নার সার্বিক অবস্থা (Today's Dining Count)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              আজকে ডাইনিংয়ে মোট কতজনের খাবার রান্না হচ্ছে তার রিয়েল-টাইম তথ্য
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-xl bg-slate-800 text-emerald-300 font-semibold border border-slate-700 self-start sm:self-auto">
            তারিখ: {todayStr}
          </span>
        </div>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide block">
            আজকের মোট রান্না
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-black text-white">{cookSummary.totalMeals}</span>
            <span className="text-xs text-slate-400">টি মিল</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            নিয়মিত {cookSummary.regularMeals} টি + গেস্ট {cookSummary.guestMeals} টি
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
            আজকে মিল চালু আছে
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-black text-emerald-400">{cookSummary.activeMembersCount}</span>
            <span className="text-xs text-slate-400">জন সদস্যের</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            মেসের সক্রিয় সদস্যরা খাবার খাচ্ছেন
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wide block">
            আজকে মিল বন্ধ আছে
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-black text-rose-400">{cookSummary.stoppedMembersCount}</span>
            <span className="text-xs text-slate-400">জন সদস্যের</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            ছুটিতে বা মিল অফ করে রেখেছেন
          </p>
        </div>
      </div>

      {/* Members Meal Attendance List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            আজকে কে কে খাচ্ছেন (Boarder Status)
          </h3>
        </div>

        <div className="divide-y divide-slate-800/80">
          {cookSummary.memberStatusList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              মেসে এখনও কোনো সদস্যের মিল যুক্ত হয়নি।
            </div>
          ) : (
            cookSummary.memberStatusList.map((row) => {
            const isMe = row.member.id === currentUser.id;

            return (
              <div
                key={row.member.id}
                className={`p-4 flex items-center justify-between gap-3 ${
                  isMe ? 'bg-emerald-950/20' : 'hover:bg-slate-850/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl ${row.member.avatarColor} text-white flex items-center justify-center font-bold text-xs`}
                  >
                    {row.member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white flex items-center gap-2">
                      {row.member.name}
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                          আপনি
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      রুম {row.member.room}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {row.guestMeals > 0 && (
                    <span className="text-xs text-amber-400 font-semibold bg-amber-950/30 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                      +{row.guestMeals} গেস্ট মিল
                    </span>
                  )}
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 ${
                      row.isMealOn
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {row.isMealOn ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        মিল চালু (২ মিল)
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        মিল বন্ধ
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          }))}
        </div>
      </div>

    </div>
  );
};
