import React, { useState } from 'react';
import { Member, Mess } from '../types';
import {
  Utensils,
  User,
  ShieldCheck,
  ChevronDown,
  Calendar,
  LogOut,
  Edit3,
  Briefcase,
  Shield,
  Building2,
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface HeaderProps {
  members: Member[];
  currentUser: Member;
  currentMess?: Mess;
  onOpenMessSwitcher?: () => void;
  onSelectUser: (user: Member) => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  userBalance: number;
  currentMealRate: number;
  onResetData: () => void;
  portalMode: 'user' | 'manager';
  onSelectPortalMode: (mode: 'user' | 'manager') => void;
  onOpenPhoneAuth: () => void;
  onOpenEditProfile: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  members,
  currentUser,
  currentMess,
  onOpenMessSwitcher,
  onSelectUser,
  selectedMonth,
  onSelectMonth,
  userBalance,
  currentMealRate,
  onResetData,
  portalMode,
  onSelectPortalMode,
  onOpenEditProfile,
  onLogout,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const months = [
    { value: `${currentYear}-09`, label: 'সেপ্টেম্বর ২০২৬' },
    { value: `${currentYear}-10`, label: 'অক্টোবর ২০২৬ (চলতি মাস)' },
    { value: `${currentYear}-11`, label: 'নভেম্বর ২০২৬' },
  ];

  const isPrivileged = currentUser.role === 'it_admin' || currentUser.role === 'manager';

  const handlePortalSwitch = (mode: 'user' | 'manager') => {
    if (mode === 'manager' && !isPrivileged) {
      alert('এক্সেস সংরক্ষিত! এডমিন বা ম্যানেজার ড্যাশবোর্ড শুধুমাত্র অনুমোদিতদের জন্য।');
      return;
    }
    onSelectPortalMode(mode);
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Logo & Mess Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
                <Utensils className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                    MealMaster
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                      ডাইনিং
                    </span>
                  </h1>

                  {currentMess && onOpenMessSwitcher && (
                    <button
                      onClick={onOpenMessSwitcher}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition cursor-pointer"
                      title="মেস পরিবর্তন করুন বা কোড দেখুন"
                    >
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-semibold text-white max-w-[120px] truncate">{currentMess.name}</span>
                      <span className="font-mono text-[10px] text-indigo-300 bg-indigo-950/70 px-1 py-0.5 rounded border border-indigo-500/30">
                        {currentMess.code}
                      </span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  মাল্টি-মেস প্ল্যাটফর্ম · স্বয়ংক্রিয় হিসাব ও অ্যান্টি-থেফট টোকেন
                </p>
              </div>
            </div>

            {/* Mobile user profile button */}
            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium cursor-pointer"
              >
                <div className={`w-6 h-6 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}>
                  {currentUser.name.charAt(0)}
                </div>
                <span className="max-w-[70px] truncate">{currentUser.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Center: ROLE-BASED DASHBOARD SWITCHER */}
          <div className="flex items-center justify-center self-center">
            {isPrivileged ? (
              // Privileged roles see switcher between Manager/Admin Dashboard and User View
              <div className="flex items-center bg-slate-950/70 p-1 rounded-2xl border border-slate-800">
                <button
                  onClick={() => handlePortalSwitch('manager')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    portalMode === 'manager'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-700/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {currentUser.role === 'it_admin' ? 'আইটি এডমিন প্যানেল' : 'ম্যানেজার প্যানেল'}
                  </span>
                </button>

                <button
                  onClick={() => handlePortalSwitch('user')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    portalMode === 'user'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>মেম্বার ভিউ (User)</span>
                </button>
              </div>
            ) : (
              // Standard User strictly locked to UserDashboard
              <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-300">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>মেম্বার ড্যাশবোর্ড (UserDashboard)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-normal">
                  ব্যক্তিগত এক্সেস
                </span>
              </div>
            )}
          </div>

          {/* Right: Quick Metrics, Profile Edit & User Switcher */}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            
            {/* Month Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/80 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="bg-transparent text-slate-200 outline-none cursor-pointer pr-1 text-xs"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Member Balance */}
            <div
              className={`px-2.5 py-1.5 rounded-xl text-xs border ${
                userBalance >= 0
                  ? 'bg-blue-950/60 border-blue-500/30 text-blue-300'
                  : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
              }`}
            >
              <span className="opacity-80 text-[11px]">ব্যালেন্স: </span>
              <span className="font-black">{formatCurrency(userBalance)}</span>
            </div>

            {/* Profile Edit button */}
            <button
              onClick={onOpenEditProfile}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
              title="প্রোফাইল ছবি, বিভাগ ও ব্যাচ এডিট করুন"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">প্রোফাইল</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
              title="লগআউট"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">লগআউট</span>
            </button>

            {/* Desktop User Switcher / Profile Badge */}
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs transition cursor-pointer"
              >
                <div
                  className={`w-6 h-6 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-xs`}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white leading-tight flex items-center gap-1">
                    {currentUser.name}
                    {currentUser.role === 'it_admin' && (
                      <span title="আইটি এডমিন">
                        <ShieldCheck className="w-3 h-3 text-amber-400" />
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {currentUser.role === 'it_admin'
                      ? '👑 IT Admin'
                      : currentUser.role === 'manager'
                      ? '💼 Manager'
                      : '👤 User'} • {currentUser.room}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-700 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{currentUser.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {currentUser.department || 'Dept'} • {currentUser.batch || 'Batch'}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentUser.role === 'it_admin'
                          ? 'bg-amber-500/20 text-amber-300'
                          : currentUser.role === 'manager'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenEditProfile();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 rounded-xl transition flex items-center gap-2 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>প্রোফাইল এডিট করুন</span>
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/40 rounded-xl transition flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>লগআউট করুন</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
