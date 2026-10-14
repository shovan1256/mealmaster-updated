import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  X,
  CheckCircle,
  MoreVertical,
  Copy,
  Check,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');
  const [copiedLink, setCopiedLink] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already running inside installed standalone PWA, hide banner
  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <>
      {/* Top Banner on Mobile & Desktop */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-b border-emerald-500/30 text-white px-3 sm:px-4 py-2.5 transition">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="font-bold text-xs sm:text-sm text-emerald-300 block leading-tight">
                মোবাইলে অ্যাপ আকারে ডাউনলোড করুন
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                হোম স্ক্রিন থেকে ফুলস্ক্রিনে আসল অ্যাপের মতো সহজে মিল অন/অফ করুন
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowGuideModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1 transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">কিভাবে করবেন?</span>
              <span className="sm:hidden">নিয়ম</span>
            </button>

            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/30 cursor-pointer transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              ইনস্টল করুন
            </button>

            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Complete Step-by-Step Mobile Download Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">
                  মোবাইলে অ্যাপ ডাউনলোড নির্দেশিকা
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform Switcher Tab */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setGuidePlatform('android')}
                className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  guidePlatform === 'android'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🤖 Android (Chrome)</span>
              </button>
              <button
                onClick={() => setGuidePlatform('ios')}
                className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  guidePlatform === 'ios'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🍏 iPhone (Safari)</span>
              </button>
            </div>

            {/* Platform 1: Android Steps */}
            {guidePlatform === 'android' && (
              <div className="space-y-3 text-xs sm:text-sm text-slate-200">
                
                {/* Special Highlight for 'This app cannot be installed' */}
                <div className="bg-amber-950/40 border-2 border-amber-500/50 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                    <span className="text-base">⚠️</span>
                    <span>যদি স্ক্রিনে "This app cannot be installed" আসে:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ঘাবড়ানোর কোনো কারণ নেই! পপ-আপের নিচে থাকা <strong className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">"Create shortcut" (শর্টকাট তৈরি করুন)</strong> বাটনে চাপ দিন।
                  </p>
                  <p className="text-[11px] text-amber-200/90 bg-amber-900/30 p-2 rounded-xl">
                    👉 <strong>Create shortcut</strong> চাপলেই মোবাইলের হোম স্ক্রিনে সরাসরি <strong>MealMaster</strong> অ্যাপ আইকন চলে আসবে এবং আসল অ্যাপের মতো ফুলস্ক্রিন চলবে!
                  </p>
                </div>

                <div className="flex items-start gap-3 bg-slate-850 p-3 rounded-2xl border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    ১
                  </div>
                  <div>
                    <p className="font-bold text-white">ব্রাউজারের ৩-ডট (⋮) মেন্যু চাপুন</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      মোবাইলে Google Chrome এর উপরের ডানদিকের তিনটি ফোঁটা (<MoreVertical className="w-3 h-3 text-emerald-400 inline" />) মেন্যুতে ট্যাপ করুন।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-850 p-3 rounded-2xl border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    ২
                  </div>
                  <div>
                    <p className="font-bold text-emerald-300">
                      "Install app" অথবা "Add to Home screen" চাপুন
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      মেন্যু থেকে <strong>"Install app"</strong> (অ্যাপ ইনস্টল) বা <strong>"Add to Home screen"</strong> (হোম স্ক্রিনে যোগ করুন) চাপুন।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-850 p-3 rounded-2xl border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    ৩
                  </div>
                  <div>
                    <p className="font-bold text-white">
                      "Install" অথবা "Create shortcut" কনফার্ম করুন
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      স্ক্রিনে আসা বক্সে <strong>Install</strong> বা <strong>Create shortcut</strong> চাপুন। কয়েক সেকেন্ডেই আপনার ফোনের অ্যাপ লিস্টে MealMaster যোগ হয়ে যাবে!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30 text-emerald-200">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    🎉 ইনস্টল সম্পন্ন হলে হোম স্ক্রিন থেকে MealMaster আইকনে ট্যাপ করে সবসময় সরাসরি মিল অন/অফ করতে পারবেন।
                  </p>
                </div>
              </div>
            )}

            {/* Platform 2: iOS Steps */}
            {guidePlatform === 'ios' && (
              <div className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                <div className="flex items-start gap-3 bg-slate-850 p-3.5 rounded-2xl border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    ১
                  </div>
                  <div>
                    <p className="font-bold text-white">Safari ব্রাউজারে লিংকটি খুলুন</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      iPhone এর নিজস্ব Safari ব্রাউজারে এই লিংকটি ভিজিট করুন।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-850 p-3.5 rounded-2xl border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    ২
                  </div>
                  <div>
                    <p className="font-bold text-white flex items-center gap-1">
                      নিচের <Share className="w-3.5 h-3.5 text-blue-400 inline" /> Share বাটনে চাপুন
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      সাফারির নিচে থাকা শেয়ার আইকনটিতে ট্যাপ করুন।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-850 p-3.5 rounded-2xl border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    ৩
                  </div>
                  <div>
                    <p className="font-bold text-emerald-300 flex items-center gap-1">
                      <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> "Add to Home Screen" চাপুন
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      অপশনগুলো স্ক্রল করে <strong>Add to Home Screen</strong> সিলেক্ট করে উপরে ডানপাশে <strong>Add</strong> চাপুন।
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Copy Link Section for sending to mobile */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">লিংক কপি হয়েছে! হোয়াটসঅ্যাপে পাঠান</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-emerald-400" />
                    <span>অ্যাপের লিংক কপি করুন (Copy Link)</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
            >
              বুঝেছি, বন্ধ করুন
            </button>

          </div>
        </div>
      )}
    </>
  );
};
