import React, { useState, useEffect } from 'react';
import { Member } from '../types';
import {
  Clock,
  ShieldAlert,
  LogOut,
  RefreshCw,
  Building,
  GraduationCap,
  Home,
  Edit3,
} from 'lucide-react';
import { getUserFromFirestore, updateUserInFirestore } from '../services/firestoreService';

interface WaitingApprovalScreenProps {
  currentUser: Member;
  onRefreshUser: (updated: Member) => void;
  onOpenEditProfile: () => void;
  onLogout: () => void;
}

export const WaitingApprovalScreen: React.FC<WaitingApprovalScreenProps> = ({
  currentUser,
  onRefreshUser,
  onOpenEditProfile,
  onLogout,
}) => {
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Auto-activate designated IT Admin account if detected
  useEffect(() => {
    const cleanPhone = (currentUser.phone || '').replace(/[\s-+]/g, '');
    const isOwner =
      cleanPhone.endsWith('01700801665') ||
      (currentUser.username || '').toLowerCase() === 'shovan' ||
      currentUser.name.toLowerCase().includes('shovan');

    if (isOwner) {
      const activatedAdmin: Member = {
        ...currentUser,
        role: 'it_admin',
        approved: true,
        status: 'approved',
        avatarColor: 'bg-amber-600',
      };
      updateUserInFirestore(currentUser.id, {
        role: 'it_admin',
        approved: true,
        status: 'approved',
        avatarColor: 'bg-amber-600',
      });
      onRefreshUser(activatedAdmin);
    }
  }, [currentUser, onRefreshUser]);

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage(null);
    try {
      const cleanPhone = (currentUser.phone || '').replace(/[\s-+]/g, '');
      const isOwner =
        cleanPhone.endsWith('01700801665') ||
        (currentUser.username || '').toLowerCase() === 'shovan' ||
        currentUser.name.toLowerCase().includes('shovan');

      if (isOwner) {
        const activatedAdmin: Member = {
          ...currentUser,
          role: 'it_admin',
          approved: true,
          status: 'approved',
          avatarColor: 'bg-amber-600',
        };
        await updateUserInFirestore(currentUser.id, {
          role: 'it_admin',
          approved: true,
          status: 'approved',
          avatarColor: 'bg-amber-600',
        });
        setStatusMessage('অভিনন্দন! আপনার প্রধান IT Admin অ্যাকাউন্ট সক্রিয় করা হয়েছে। প্রবেশ হচ্ছে...');
        setTimeout(() => {
          onRefreshUser(activatedAdmin);
        }, 500);
        return;
      }

      const liveDoc = await getUserFromFirestore(currentUser.id);
      if (liveDoc) {
        if (liveDoc.approved && liveDoc.status === 'approved') {
          setStatusMessage('অভিনন্দন! আপনার প্রোফাইল অনুমোদিত হয়েছে। প্রবেশ হচ্ছে...');
          setTimeout(() => {
            onRefreshUser({
              ...currentUser,
              ...liveDoc,
              id: liveDoc.uid,
              role: liveDoc.role,
              approved: true,
              status: 'approved',
            });
          }, 800);
          return;
        } else if (liveDoc.status === 'rejected') {
          setStatusMessage('দুঃখিত, ম্যানেজার আপনার আবেদনটি বাতিল করেছেন। মেস অফিসে যোগাযোগ করুন।');
        } else {
          setStatusMessage('অনুরোধ এখনও যাচাইাধীন রয়েছে। ম্যানেজার অনুমোদন দিলে ড্যাশবোর্ড চালু হবে।');
        }
      }
    } catch (e) {
      setStatusMessage('স্ট্যাটাস পরীক্ষা করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
    } finally {
      setChecking(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.25),rgba(255,255,255,0))]" />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 backdrop-blur-xl">
        {/* Top Icon Badge */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
            <Clock className="w-8 h-8 animate-pulse text-amber-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-500/30 px-3 py-1 rounded-full mb-2">
            অ্যাকাউন্ট অনুমোদনের অপেক্ষায় (Pending Approval)
          </span>
          <h1 className="text-2xl font-black text-white">
            Waiting for Manager Approval
          </h1>
          <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
            আপনার রেজিস্ট্রেশন সম্পন্ন হয়েছে। মেস নিরাপত্তা ও মিল অ্যান্টি-থেফট নিয়মের আওতায় ম্যানেজার বা আইটি এডমিন আপনার তথ্য যাচাই করে অনুমোদন দিলে আপনার ড্যাশবোর্ড স্বয়ংক্রিয়ভাবে উন্মুক্ত হবে।
          </p>
        </div>

        {/* User Submitted Profile Card */}
        <div className="mt-6 bg-slate-950/70 border border-slate-800 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl ${currentUser.avatarColor || 'bg-indigo-600'} text-white flex items-center justify-center font-bold text-sm shadow`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{currentUser.name}</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {currentUser.phone || currentUser.username}
                </span>
              </div>
            </div>
            <button
              onClick={onOpenEditProfile}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>প্রোফাইল এডিট</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-850">
              <span className="text-slate-400 text-[10px] block flex items-center gap-1">
                <Building className="w-3 h-3 text-slate-500" /> বিভাগ (Department)
              </span>
              <strong className="text-slate-200 text-xs">
                {currentUser.department || 'উল্লেখ নেই'}
              </strong>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-850">
              <span className="text-slate-400 text-[10px] block flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-slate-500" /> ব্যাচ (Batch)
              </span>
              <strong className="text-slate-200 text-xs">
                {currentUser.batch || 'উল্লেখ নেই'}
              </strong>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-850">
              <span className="text-slate-400 text-[10px] block flex items-center gap-1">
                <Home className="w-3 h-3 text-slate-500" /> রুম / সিট নং
              </span>
              <strong className="text-slate-200 text-xs">
                {currentUser.room || '১০১'}
              </strong>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-850">
              <span className="text-slate-400 text-[10px] block flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-slate-500" /> বর্তমান স্ট্যাটাস
              </span>
              <strong className="text-amber-400 text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                যাচাইাধীন (Pending)
              </strong>
            </div>
          </div>
        </div>

        {/* Status Message Feedback */}
        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs text-center animate-in fade-in">
            {statusMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'স্ট্যাটাস চেক হচ্ছে...' : 'অনুমোদন যাচাই করুন (Check Status)'}</span>
          </button>

          <button
            onClick={onLogout}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500 text-center mt-5">
          🔒 আপনার অ্যাকাউন্টটি অনুমোদনের জন্য অপেক্ষমাণ রয়েছে। মেস ম্যানেজার বা আইটি এডমিন অনুমোদন প্রদান করলে আপনার ড্যাশবোর্ড স্বয়ংক্রিয়ভাবে চালু হয়ে যাবে।
        </p>
      </div>
    </div>
  );
};
