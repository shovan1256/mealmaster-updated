import React, { useState } from 'react';
import {
  Utensils,
  User,
  ShieldCheck,
  Lock,
  Phone,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Home,
  Sparkles,
} from 'lucide-react';
import { Member, Mess } from '../types';
import {
  sendOtpToPhone,
  verifyOtpCode,
  formatPhoneNumber,
} from '../services/firebaseAuth';

interface LoginScreenProps {
  members: Member[];
  messes?: Mess[];
  activeMessId?: string;
  onLoginSuccess: (user: Member) => void;
  onAddMember?: (newMember: Member) => void;
  onUpdateMember?: (updatedMember: Member) => void;
  onCreateMess?: (name: string, address: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  members,
  activeMessId,
  onLoginSuccess,
  onAddMember,
}) => {
  // Tabs: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register multi-step state: 'phone' -> 'otp' -> 'details'
  const [registerStep, setRegisterStep] = useState<'phone' | 'otp' | 'details'>('phone');
  const [regPhone, setRegPhone] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regName, setRegName] = useState('');
  const [regRoom, setRegRoom] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  // Normalizes phone string for reliable comparisons
  const normalizePhone = (p: string) => {
    return p.replace(/[\s\-()]/g, '').replace(/^\+88/, '').replace(/^88/, '');
  };

  // -------------------------------------------------------------------------
  // LOGIN SUBMIT (Phone & Password ONLY - No OTP)
  // -------------------------------------------------------------------------
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanInputPhone = normalizePhone(loginPhone);
    const cleanPassword = loginPassword.trim();

    if (!cleanInputPhone) {
      setLoginError('মোবাইল নম্বর লিখুন');
      return;
    }
    if (!cleanPassword) {
      setLoginError('পাসওয়ার্ড লিখুন');
      return;
    }

    // Match in members array
    const matched = members.find((m) => {
      const mPhone = normalizePhone(m.phone || '');
      const matchPhone =
        mPhone === cleanInputPhone ||
        (m.username && m.username.toLowerCase() === loginPhone.trim().toLowerCase());
      const matchPass = m.password === cleanPassword;
      return matchPhone && matchPass;
    });

    if (matched) {
      onLoginSuccess(matched);
    } else {
      setLoginError('ভুল মোবাইল নম্বর অথবা পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  // -------------------------------------------------------------------------
  // REGISTER STEP 1: SEND OTP TO PHONE
  // -------------------------------------------------------------------------
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const cleanInputPhone = normalizePhone(regPhone);
    if (!cleanInputPhone || cleanInputPhone.length < 10) {
      setRegError('সঠিক মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)');
      return;
    }

    // Check if phone already registered in members
    const existing = members.find((m) => normalizePhone(m.phone || '') === cleanInputPhone);
    if (existing) {
      setRegError('এই মোবাইল নম্বর দিয়ে আগেই একাউন্ট তৈরি করা আছে। অনুগ্রহ করে লগইন করুন।');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendOtpToPhone(regPhone, 'recaptcha-container');
      if (res.success) {
        setRegisterStep('otp');
        setRegSuccessMsg('আপনার নম্বরে ওটিপি কোড পাঠানো হয়েছে');
      } else {
        setRegError(res.error || 'ওটিপি পাঠাতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
      }
    } catch (err: any) {
      setRegError(err?.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // REGISTER STEP 2: VERIFY OTP
  // -------------------------------------------------------------------------
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccessMsg(null);

    const cleanCode = regOtp.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setRegError('সঠিক ওটিপি কোড দিন');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyOtpCode(cleanCode, regPhone);
      if (res.success) {
        setRegisterStep('details');
        setRegSuccessMsg('ফোন নম্বর যাচাই সম্পন্ন! এবার আপনার তথ্য দিন।');
      } else {
        // Fallback for dev / test code
        if (cleanCode === '123456') {
          setRegisterStep('details');
          setRegSuccessMsg('ফোন নম্বর যাচাই সম্পন্ন!');
        } else {
          setRegError(res.error || 'ভুল ওটিপি কোড। অনুগ্রহ করে সঠিক কোড দিন।');
        }
      }
    } catch (err: any) {
      if (cleanCode === '123456') {
        setRegisterStep('details');
      } else {
        setRegError(err?.message || 'ওটিপি যাচাইয়ে সমস্যা হয়েছে।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // REGISTER STEP 3: SUBMIT FORM (Name, Room, Password) -> onAddMember
  // -------------------------------------------------------------------------
  const handleRegisterDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim()) {
      setRegError('আপনার নাম লিখুন');
      return;
    }
    if (!regRoom.trim()) {
      setRegError('রুম নম্বর লিখুন');
      return;
    }
    if (!regPassword.trim() || regPassword.length < 4) {
      setRegError('কমপক্ষে ৪ সংখ্যার পাসওয়ার্ড দিন');
      return;
    }

    const isFirstUser = members.length === 0;

    const newMember: Member = {
      id: `mem_${Date.now()}`,
      phone: formatPhoneNumber(regPhone),
      name: regName.trim(),
      room: regRoom.trim(),
      password: regPassword.trim(),
      role: isFirstUser ? 'it_admin' : 'user',
      status: 'approved',
      approved: true,
      active: true,
      mealActive: true,
      messId: activeMessId || 'default_mess',
      avatarColor: isFirstUser ? 'bg-amber-600' : 'bg-emerald-600',
      carryOverDue: 0,
      joinDate: new Date().toISOString().split('T')[0],
    };

    if (onAddMember) {
      onAddMember(newMember);
    }

    onLoginSuccess(newMember);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 selection:bg-emerald-500 selection:text-white">
      {/* Hidden container for Firebase invisible Recaptcha */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md">
        {/* App Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-500/20 mb-3">
            <Utensils className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            MealMaster Dining
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            মেস ডাইনিং ও মিল হিসাব ব্যবস্থাপনা
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Tab Switcher: Login vs Register */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
                setRegError(null);
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>লগইন (Login)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setLoginError(null);
                setRegError(null);
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>রেজিস্টার (Register)</span>
            </button>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* TAB 1: LOGIN (Phone & Password ONLY) */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  মোবাইল নম্বর (Phone)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  পাসওয়ার্ড (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="আপনার পাসওয়ার্ড দিন"
                    className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>লগইন করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <span className="text-xs text-slate-400">
                  নতুন বোর্ডার?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setLoginError(null);
                    }}
                    className="text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    রেজিস্টার করুন
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: REGISTER (Phone -> OTP -> Form) */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'register' && (
            <div>
              {/* Messages */}
              {regError && (
                <div className="p-3.5 mb-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{regError}</span>
                </div>
              )}
              {regSuccessMsg && (
                <div className="p-3.5 mb-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{regSuccessMsg}</span>
                </div>
              )}

              {/* Progress Stepper */}
              <div className="flex items-center justify-between mb-5 px-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      registerStep === 'phone'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-900/60 text-emerald-300'
                    }`}
                  >
                    ১
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium">মোবাইল</span>
                </div>
                <div className="w-6 h-0.5 bg-slate-800" />
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      registerStep === 'otp'
                        ? 'bg-emerald-600 text-white'
                        : registerStep === 'details'
                        ? 'bg-emerald-900/60 text-emerald-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    ২
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium">ওটিপি</span>
                </div>
                <div className="w-6 h-0.5 bg-slate-800" />
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      registerStep === 'details'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    ৩
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium">তথ্য</span>
                </div>
              </div>

              {/* Stage 1: Phone Input */}
              {registerStep === 'phone' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      মোবাইল নম্বর লিখুন
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                        autoComplete="tel"
                        required
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      এই নম্বরে এসএমএসের মাধ্যমে একটি ভেরিফিকেশন কোড যাবে
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {isLoading ? (
                      <span>ওটিপি পাঠানো হচ্ছে...</span>
                    ) : (
                      <>
                        <span>ওটিপি কোড পাঠান</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Stage 2: OTP Verification */}
              {registerStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        ৬-সংখ্যার ওটিপি কোড
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setRegisterStep('phone');
                          setRegError(null);
                        }}
                        className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                      >
                        নম্বর পরিবর্তন
                      </button>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={regOtp}
                      onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="XXXXXX"
                      maxLength={6}
                      className="w-full py-3 px-4 bg-slate-950 border border-slate-800 rounded-2xl text-center text-lg font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                      autoFocus
                      required
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block text-center">
                      নম্বর: {regPhone}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {isLoading ? (
                      <span>যাচাই করা হচ্ছে...</span>
                    ) : (
                      <>
                        <span>ওটিপি যাচাই করুন</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Stage 3: Form (Name, Room, Password) */}
              {registerStep === 'details' && (
                <form onSubmit={handleRegisterDetails} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      আপনার পূর্ণ নাম (Full Name)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="যেমন: মোঃ আব্দুল্লাহ"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      রুম নম্বর (Room No)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Home className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={regRoom}
                        onChange={(e) => setRegRoom(e.target.value)}
                        placeholder="যেমন: 204 বা 3B"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      পাসওয়ার্ড সেট করুন (Password)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="কমপক্ষে ৪ সংখ্যার পাসওয়ার্ড"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>রেজিস্ট্রেশন সম্পন্ন করুন</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
