import React, { useState, useEffect } from 'react';
import { MessNotice, Member, DayMealEntry } from '../types';
import {
  Bell,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  Calendar,
  X,
  Pin,
  Megaphone,
  Clock,
  Sparkles,
  CheckCircle2,
  Send,
  Utensils,
} from 'lucide-react';
import { deleteNoticeFromFirestore } from '../services/firestoreService';

interface NoticeBoardProps {
  notices: MessNotice[];
  onAddNotice: (notice: MessNotice) => void;
  onDeleteNotice: (id: string) => void;
  currentUser: Member;
  mealEntries?: DayMealEntry[];
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({
  notices,
  onAddNotice,
  onDeleteNotice,
  currentUser,
  mealEntries,
}) => {
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePriority, setNoticePriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [servingSchedule, setServingSchedule] = useState('');
  const [enableMealChoice, setEnableMealChoice] = useState(false);
  const [mealChoicesInput, setMealChoicesInput] = useState('');
  const [deadlineInput, setDeadlineInput] = useState('22:00');

  // Web Notification State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          new Notification('MealMaster ডাইনিং নোটিফিকেশন সক্রিয়!', {
            body: 'এখন থেকে খাবার পরিবেশনের সময়সূচি ও জরুরি ঘোষণা ব্রাউজার নোটিফিকেশনে পাবেন।',
            icon: '/favicon.ico',
          });
        }
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    } else {
      alert('আপনার ব্রাউজার ওয়েব নোটিফিকেশন সাপোর্ট করে না।');
    }
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) {
      alert('নোটিশের শিরোনাম ও বিস্তারিত বার্তা লিখুন');
      return;
    }

    const parsedChoices = enableMealChoice
      ? mealChoicesInput
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      : undefined;

    const newNot: MessNotice = {
      id: `notice-${Date.now()}`,
      messId: currentUser.messId,
      date: new Date().toISOString().split('T')[0],
      title: noticeTitle,
      content: noticeContent,
      author: `${currentUser.name} (${currentUser.role === 'it_admin' ? 'IT Admin' : currentUser.role === 'manager' ? 'Manager' : 'User'})`,
      priority: noticePriority,
      servingSchedule: servingSchedule.trim() || undefined,
      enableMealChoice,
      mealChoices: parsedChoices && parsedChoices.length > 0 ? parsedChoices : undefined,
      deadline: enableMealChoice && deadlineInput.trim() ? deadlineInput.trim() : undefined,
    };

    setLocalNotices((prev) => [newNot, ...prev]);
    onAddNotice(newNot);

    // Trigger local push notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`📢 ${newNot.title}`, {
          body: newNot.content,
          icon: '/favicon.ico',
        });
      } catch (err) {
        // ignore
      }
    }

    setIsNoticeModalOpen(false);
    setNoticeTitle('');
    setNoticeContent('');
    setServingSchedule('');
    setEnableMealChoice(false);
    setMealChoicesInput('');
    setDeadlineInput('22:00');
  };

  // Local notices state to update UI immediately on delete/add
  const [localNotices, setLocalNotices] = useState<MessNotice[]>(notices || []);

  useEffect(() => {
    if (notices) {
      setLocalNotices(notices);
    }
  }, [notices]);

  const handleDeleteNotice = async (noticeId: string, noticeTitle: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const confirmed = window.confirm(
      `আপনি কি নিশ্চিত যে "${noticeTitle}" নোটিশটি মুছে ফেলতে চান?`
    );
    if (!confirmed) return;

    // Immediately filter out the deleted notice from local state so it disappears without reloading
    setLocalNotices((prev) => prev.filter((n) => n.id !== noticeId));

    if (onDeleteNotice) {
      onDeleteNotice(noticeId);
    }

    try {
      await deleteNoticeFromFirestore(noticeId);
    } catch (err) {
      console.error('Firestore notice deletion error in NoticeBoard:', err);
      alert('নোটিশ মুছে ফেলতে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    }
  };

  const canPost = currentUser.role === 'it_admin' || currentUser.role === 'manager';

  return (
    <div className="space-y-6">
      
      {/* Header & Push Notification Enabler */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-400" />
              IT Admin নোটিশ বোর্ড ও সার্ভিং শিডিউল (Notice Board)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              মোট: {localNotices.length} টি নোটিশ
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            খাবার পরিবেশন সময়সূচি, আজকের স্পেশাল মেনু ও মেসের অফিসিয়াল ঘোষণা
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Push Web Notification Toggle */}
          <button
            onClick={handleRequestPushPermission}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              notificationPermission === 'granted'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${notificationPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>
              {notificationPermission === 'granted'
                ? 'Web Push সক্রিয় ✅'
                : 'Web Push নোটিফিকেশন চালু করুন'}
            </span>
          </button>

          {canPost && (
            <button
              onClick={() => setIsNoticeModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-700/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              নতুন নোটিশ প্রকাশ করুন
            </button>
          )}
        </div>
      </div>

      {/* Serving Schedule Quick Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm text-white">দৈনিক খাবার পরিবেশন ও টোকেন কাট-অফ সময়সূচি</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-850">
            <span className="text-amber-400 font-bold block mb-1">☕ সকালের নাস্তা</span>
            <span className="text-slate-200 block font-mono">০৭:৩০ AM – ১০:০০ AM</span>
            <span className="text-[11px] text-rose-400 block mt-1">কাট-অফ: ১০:৩০ AM</span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-850">
            <span className="text-emerald-400 font-bold block mb-1">🍛 দুপুরের খাবার (Lunch)</span>
            <span className="text-slate-200 block font-mono">০১:০০ PM – ০২:১৫ PM</span>
            <span className="text-[11px] text-rose-400 block mt-1">কাট-অফ: ০২:৩০ PM</span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-850">
            <span className="text-indigo-400 font-bold block mb-1">🍲 রাতের খাবার (Dinner)</span>
            <span className="text-slate-200 block font-mono">০৮:০০ PM – ০৯:১৫ PM</span>
            <span className="text-[11px] text-rose-400 block mt-1">কাট-অফ: ০৯:৩০ PM</span>
          </div>
        </div>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {localNotices.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-3xl">
            <Megaphone className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <span>এখনও কোনো নোটিশ প্রকাশিত হয়নি।</span>
          </div>
        ) : (
          localNotices.map((not) => {
            const isUrgent = not.priority === 'urgent';
            const isImportant = not.priority === 'important';

            return (
              <div
                key={not.id}
                className={`p-5 rounded-3xl border flex flex-col justify-between shadow-sm transition hover:shadow-md ${
                  isUrgent
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                    : isImportant
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isUrgent
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isImportant
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isUrgent ? '🚨 জরুরি নোটিশ' : isImportant ? '⚠️ গুরুত্বপূর্ণ' : '📢 সাধারণ নোটিশ'}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {not.date}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white mb-2 leading-snug">
                    {not.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {not.content}
                  </p>

                  {not.servingSchedule && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-xs text-amber-300 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{not.servingSchedule}</span>
                    </div>
                  )}

                  {not.enableMealChoice && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-amber-300">
                            <Utensils className="w-3.5 h-3.5 text-amber-400" />
                            <span>ভোজ মেনু পছন্দ (Feast Choices):</span>
                          </div>
                          {not.deadline && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-rose-400" />
                              সময়সীমা: {not.deadline}
                            </span>
                          )}
                        </div>
                        {not.mealChoices && not.mealChoices.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {not.mealChoices.map((choice, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-500/40 text-[11px] font-semibold"
                              >
                                {choice}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Live Count Summary Tally */}
                      <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-amber-400 text-[11px]">ভোজ লাইভ কাউন্ট সামারি:</span>
                        {(() => {
                          const counts: Record<string, number> = {};
                          if (mealEntries) {
                            mealEntries
                              .filter((e) => (not.date ? e.date === not.date : true) && e.mealOn && e.customMealChoice)
                              .forEach((e) => {
                                const c = e.customMealChoice!.trim();
                                counts[c] = (counts[c] || 0) + 1;
                              });
                          }
                          const entries = Object.entries(counts);
                          if (entries.length === 0) {
                            return <span className="text-[11px] text-slate-400">(এখনো কোনো ভোট পড়েনি)</span>;
                          }
                          return (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {entries.map(([choice, count]) => (
                                <span
                                  key={choice}
                                  className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black"
                                >
                                  {choice}: {count} জন
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    কর্তৃপক্ষ: <strong className="text-slate-200">{not.author}</strong>
                  </span>
                  {canPost && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteNotice(not.id, not.title, e);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                      title="ডিলিট"
                      aria-label="Delete notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Post Notice Modal */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">নতুন নোটিশ বা সার্ভিং আপডেট দিন</h3>
              <button
                onClick={() => setIsNoticeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  নোটিশের শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="যেমন: আজকের বিশেষ জুম্মার মেনু ও পরিবেশন সময়"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  নোটিশের গুরুত্ব (Priority)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNoticePriority('normal')}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      noticePriority === 'normal'
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-950 border-slate-850 text-slate-400'
                    }`}
                  >
                    সাধারণ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoticePriority('important')}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      noticePriority === 'important'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-850 text-slate-400'
                    }`}
                  >
                    গুরুত্বপূর্ণ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoticePriority('urgent')}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      noticePriority === 'urgent'
                        ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-850 text-slate-400'
                    }`}
                  >
                    জরুরি
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  পরিবেশন সময়সূচি (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={servingSchedule}
                  onChange={(e) => setServingSchedule(e.target.value)}
                  placeholder="যেমন: দুপুর ১:৩০ টা থেকে পরিবেশন শুরু হবে"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Feast / Dynamic Menu Dropdown Control */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={enableMealChoice}
                    onChange={(e) => setEnableMealChoice(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>Enable Meal Choice Dropdown (ভোজ মিল চয়েস ড্রপডাউন)</span>
                </label>

                {enableMealChoice && (
                  <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        মেনু পছন্দ অপশনসমূহ (কমা দিয়ে লিখুন) *
                      </label>
                      <input
                        type="text"
                        required={enableMealChoice}
                        value={mealChoicesInput}
                        onChange={(e) => setMealChoicesInput(e.target.value)}
                        placeholder="যেমন: Beef, Mutton (বা Chicken, Fish)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>পছন্দ নির্বাচনের সময়সীমা (Deadline):</span>
                      </label>
                      <input
                        type="time"
                        value={deadlineInput}
                        onChange={(e) => setDeadlineInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  বিস্তারিত বার্তা (Message) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="নোটিশের বিস্তারিত বার্তা লিখুন..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNoticeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>নোটিশ প্রকাশ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
