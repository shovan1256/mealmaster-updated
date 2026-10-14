import React, { useState } from 'react';
import { Member, MealSummaryData, FixedCost, Mess } from '../types';
import {
  Calculator,
  Download,
  Printer,
  Copy,
  Check,
  FileText,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  X,
  Power,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FolderArchive,
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { applyMonthEndCarryOver } from '../services/firestoreService';
import { exportMonthlyExcelStatement, openPrintablePDFStatement } from '../utils/statementExport';
import { saveMonthlyArchives, getMonthlyArchives, DEFAULT_MESS } from '../utils/storage';

interface MonthlyCalculationSheetProps {
  memberSummaries: MealSummaryData[];
  totalMeals: number;
  totalBazarCost: number;
  totalFixedCost: number;
  mealRate: number;
  totalDeposited: number;
  totalCostOverall: number;
  fixedCosts: FixedCost[];
  selectedMonth: string;
  members: Member[];
  onMonthEndCalculated?: (updates: { memberId: string; carryOverDue: number }[]) => void;
  currentUser?: Member;
  currentMess?: Mess;
}

export const MonthlyCalculationSheet: React.FC<MonthlyCalculationSheetProps> = ({
  memberSummaries,
  totalMeals,
  totalBazarCost,
  totalFixedCost,
  mealRate,
  totalDeposited,
  totalCostOverall,
  fixedCosts,
  selectedMonth,
  members,
  onMonthEndCalculated,
  currentUser,
  currentMess = DEFAULT_MESS,
}) => {
  const [selectedMemberForSlip, setSelectedMemberForSlip] = useState<MealSummaryData | null>(null);
  const [copied, setCopied] = useState(false);

  // Month-end confirmation modal state
  const [isMonthEndModalOpen, setIsMonthEndModalOpen] = useState(false);
  const [monthEndProcessing, setMonthEndProcessing] = useState(false);
  const [monthEndSuccess, setMonthEndSuccess] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  const isManagerOrAdmin =
    currentUser?.role === 'it_admin' || currentUser?.role === 'manager';

  // Export handlers
  const handleExportPDF = () => {
    openPrintablePDFStatement(currentMess, selectedMonth, totalMeals, totalBazarCost, totalFixedCost, mealRate, memberSummaries);
  };

  const handleExportExcel = () => {
    exportMonthlyExcelStatement(currentMess, selectedMonth, totalMeals, totalBazarCost, totalFixedCost, mealRate, memberSummaries);
  };

  // Generate WhatsApp summary for monthly report
  const handleCopyMonthlySummary = () => {
    const lines = [
      `📊 *মাসিক ডাইনিং ও মেস হিসাব শিট - ${selectedMonth}*`,
      `==============================`,
      `🍲 *মোট খাওয়া মিল:* ${totalMeals} টি`,
      `🛒 *মোট বাজার খরচ:* ${formatCurrency(totalBazarCost)}`,
      `⚡ *স্বয়ংক্রিয় মিল রেট:* ${formatCurrency(mealRate)} / মিল`,
      `🏢 *ফিক্সড খরচ:* ${formatCurrency(totalFixedCost)} (বাবুর্চি, গ্যাস, ওয়াইফাই)`,
      `💰 *মোট জমা ফান্ড:* ${formatCurrency(totalDeposited)}`,
      `==============================`,
      `📋 *সদস্যভিত্তিক চূড়ান্ত ব্যালেন্স তালিকা:*`,
    ];

    memberSummaries.forEach((m, idx) => {
      const balanceTxt =
        m.balance >= 0
          ? `পাবে ${formatCurrency(m.balance)}`
          : `বকেয়া/দিবে ${formatCurrency(Math.abs(m.balance))}`;
      lines.push(
        `${idx + 1}. *${m.memberName}* (${m.room || 'রুম'}): মিল ${m.totalMeals} টি | খরচ: ${formatCurrency(
          m.totalPayable
        )} | জমা: ${formatCurrency(m.totalDeposit)} 👉 *${balanceTxt}*`
      );
    });

    lines.push(`\n- MealMaster ডাইনিং সিস্টেম থেকে তৈরি`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Perform Month-End Automation: Carry Over Dues & Reset
  const handleExecuteMonthEnd = async () => {
    setMonthEndProcessing(true);

    try {
      // Calculate dues to carry over for each member
      const carryOverUpdates = memberSummaries.map((m) => {
        // If balance is negative, that becomes positive carryOverDue debt
        const dueToCarry = m.balance < 0 ? Math.abs(m.balance) : 0;
        return {
          memberId: m.memberId,
          carryOverDue: dueToCarry,
        };
      });

      await applyMonthEndCarryOver(carryOverUpdates);

      // Save frozen Monthly Archive for quota saving and historical records
      const archiveSummary = {
        id: `${currentMess.id}_${selectedMonth}`,
        messId: currentMess.id,
        month: selectedMonth,
        totalMeals,
        totalBazarCost,
        totalFixedCost,
        mealRate,
        memberSummaries,
        archivedAt: new Date().toISOString(),
      };
      const existingArchives = getMonthlyArchives().filter((a) => a.id !== archiveSummary.id);
      saveMonthlyArchives([archiveSummary, ...existingArchives]);


      if (onMonthEndCalculated) {
        onMonthEndCalculated(carryOverUpdates);
      }

      setMonthEndProcessing(false);
      setMonthEndSuccess(true);

      setTimeout(() => {
        setIsMonthEndModalOpen(false);
        setMonthEndSuccess(false);
      }, 2500);
    } catch (e) {
      console.error('Month-end execution error:', e);
      alert('মাস সমাপ্তি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setMonthEndProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              মাসিক পূর্ণাঙ্গ হিসাব ও মিল রেট শিট ({selectedMonth})
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              স্বয়ংক্রিয় হিসাব
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            বাজার খরচ ÷ মোট মিল = মিল রেট, বিল বণ্টন ও মাস-সমাপ্তি অটোমেশন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            title="প্রিন্ট বা PDF হিসেবে সংরক্ষণ"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>PDF শিট</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Excel (.csv) ডাউনলোড"
          >
            <Download className="w-4 h-4" />
            <span>Excel ফাইল</span>
          </button>

          <button
            onClick={handleCopyMonthlySummary}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                কপি হয়েছে!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-emerald-400" />
                মেসেঞ্জারে কপি
              </>
            )}
          </button>

          <button
            onClick={() => setIsArchiveModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            title="পূর্ববর্তী মাসের সংরক্ষিত আর্কাইভ দেখুন"
          >
            <FolderArchive className="w-4 h-4 text-amber-400" />
            <span>পূর্ববর্তী আর্কাইভ</span>
          </button>

          {/* Calculate Month-End Button for Managers */}
          {isManagerOrAdmin && (
            <button
              onClick={() => setIsMonthEndModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-700/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Calculate Month-End (মাস সমাপ্তি ও বকেয়া জের)</span>
            </button>
          )}
        </div>
      </div>

      {/* Formula & Financial Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Meal Rate Card */}
        <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 relative overflow-hidden">
          <span className="text-xs text-emerald-400 font-bold block uppercase tracking-wider">
            বর্তমান মিল রেট (Meal Rate)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl sm:text-4xl font-black text-emerald-300">
              {formatCurrency(mealRate)}
            </span>
            <span className="text-xs text-slate-400">/মিল</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-2 font-mono">
            সূত্র: মোট বাজার খরচ ({formatCurrency(totalBazarCost)}) ÷ মোট মিল ({totalMeals})
          </span>
        </div>

        {/* Total Meals Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">
            মোট খাওয়া মিল (Total Meals)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl sm:text-4xl font-black text-white">
              {totalMeals}
            </span>
            <span className="text-xs text-slate-400">টি</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-2">
            নিয়মিত + গেস্ট মিল অন্তর্ভুক্ত
          </span>
        </div>

        {/* Total Bazar Expense */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">
            মোট বাজার খরচ (Bazar Cost)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl sm:text-4xl font-black text-amber-300">
              {formatCurrency(totalBazarCost)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-2">
            চলতি মাসে সকল বাজার খাতার মোট
          </span>
        </div>

        {/* Total Fund Deposited */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">
            মোট সংগৃহীত জমা ফান্ড
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400">
              {formatCurrency(totalDeposited)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-2">
            বোর্ডারদের মোট প্রদত্ত ডিপোজিট
          </span>
        </div>
      </div>

      {/* Member Balance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">
            প্রত্যেক সদস্যের বিস্তারিত হিসাব ও ব্যালেন্স শিট ({memberSummaries.length} জন)
          </h3>
          <span className="text-xs text-slate-400">
            বকেয়া ২ মাসের বেশি হলে লাল রঙে চিহ্নিত
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">সদস্যের নাম ও রুম</th>
                <th className="p-3.5 text-center">চালু দিন</th>
                <th className="p-3.5 text-center">মোট মিল</th>
                <th className="p-3.5 text-right">মিল খরচ</th>
                <th className="p-3.5 text-right">ফিক্সড খরচ</th>
                <th className="p-3.5 text-right">আগের বকেয়া</th>
                <th className="p-3.5 text-right">মোট প্রদেয়</th>
                <th className="p-3.5 text-right">মোট জমা</th>
                <th className="p-3.5 text-right pr-5">চূড়ান্ত ব্যালেন্স</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {memberSummaries.map((m) => {
                const isAdvance = m.balance >= 0;
                const isOverdueDefaulter = m.isDefaulter || m.balance < -4000;

                return (
                  <tr
                    key={m.memberId}
                    className={`hover:bg-slate-850/50 transition ${
                      isOverdueDefaulter ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="p-3.5 pl-5 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span>{m.memberName}</span>
                        {isOverdueDefaulter && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                            ডিফল্টার লক
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        রুম {m.room || 'N/A'} • {m.department || ''}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">{m.totalDaysOn} দিন</td>
                    <td className="p-3.5 text-center font-bold text-white">
                      {m.totalMeals}
                    </td>
                    <td className="p-3.5 text-right font-mono">
                      {formatCurrency(m.mealCost)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-400">
                      {formatCurrency(m.fixedCostShare)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-amber-400">
                      {formatCurrency(m.carryOverDue || 0)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-200">
                      {formatCurrency(m.totalPayable)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-emerald-400 font-semibold">
                      {formatCurrency(m.totalDeposit)}
                    </td>
                    <td className="p-3.5 text-right pr-4 font-mono font-black">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs inline-block ${
                          isAdvance
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isOverdueDefaulter
                            ? 'bg-rose-600 text-white border border-rose-500 font-black'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {isAdvance ? `+${formatCurrency(m.balance)}` : formatCurrency(m.balance)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MONTH-END EXECUTION MODAL */}
      {isMonthEndModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-indigo-400" />
                <span>মাস সমাপ্তি ও বকেয়া জের অটোমেশন (Month-End Close)</span>
              </h3>
              <button
                onClick={() => setIsMonthEndModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-300">
              <p className="leading-relaxed">
                এই বাটনে চাপ দিলে বর্তমান মাসের <strong>{selectedMonth}</strong> চূড়ান্ত হিসাব সম্পন্ন হবে:
              </p>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>মিল রেট লক: {formatCurrency(mealRate)} / মিল</span>
                </div>
                <div className="flex items-center gap-2 text-white font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>মোট বাজার খরচ: {formatCurrency(totalBazarCost)}</span>
                </div>
                <div className="flex items-center gap-2 text-white font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>বকেয়া বহন: যাদের ব্যালেন্স মাইনাস (-), তাদের বকেয়া পরবর্তী মাসের ‘Carry Over Due’-তে যুক্ত হবে।</span>
                </div>
              </div>

              {monthEndSuccess ? (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500 text-emerald-300 font-bold text-center">
                  ✅ মাস সমাপ্তি সফলভাবে সম্পন্ন হয়েছে এবং বকেয়া জের আপডেট হয়েছে!
                </div>
              ) : (
                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsMonthEndModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    disabled={monthEndProcessing}
                    onClick={handleExecuteMonthEnd}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-4 h-4 ${monthEndProcessing ? 'animate-spin' : ''}`} />
                    <span>{monthEndProcessing ? 'প্রসেসিং হচ্ছে...' : 'চূড়ান্ত হিসাব সম্পন্ন করুন'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAST ARCHIVES MODAL */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-base">সংরক্ষিত পূর্ববর্তী মাসিক আর্কাইভ</h3>
                  <p className="text-xs text-slate-400">কোটা সাশ্রয়ী অপ্টিমাইজড ডাটাবেজ আর্কাইভ</p>
                </div>
              </div>
              <button
                onClick={() => setIsArchiveModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
              {getMonthlyArchives().filter((a) => a.messId === currentMess.id).length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-950 rounded-2xl border border-slate-850">
                  <FolderArchive className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
                  <p className="text-sm font-semibold">কোনো পূর্ববর্তী মাস এখনও আর্কাইভ করা হয়নি।</p>
                  <p className="text-xs text-slate-500 mt-1">
                    চলতি মাস শেষ হলে "Calculate Month-End" বাটনে ক্লিক করলে সেই মাসের হিসাব স্বয়ংক্রিয়ভাবে এখানে চিরতরে সংরক্ষিত হবে।
                  </p>
                </div>
              ) : (
                getMonthlyArchives()
                  .filter((a) => a.messId === currentMess.id)
                  .map((archive) => (
                    <div
                      key={archive.id}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">মাস: {archive.month}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            মিল রেট: ৳{archive.mealRate.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          <span>মোট মিল: {archive.totalMeals.toFixed(1)}</span>
                          <span>·</span>
                          <span>মোট বাজার: ৳{archive.totalBazarCost.toLocaleString('bn-BD')}</span>
                          <span>·</span>
                          <span>বোর্ডার: {archive.memberSummaries.length} জন</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          আর্কাইভের সময়: {new Date(archive.archivedAt).toLocaleDateString('bn-BD')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            exportMonthlyExcelStatement(
                              currentMess,
                              archive.month,
                              archive.totalMeals,
                              archive.totalBazarCost,
                              archive.totalFixedCost,
                              archive.mealRate,
                              archive.memberSummaries
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Excel</span>
                        </button>
                        <button
                          onClick={() => {
                            openPrintablePDFStatement(
                              currentMess,
                              archive.month,
                              archive.totalMeals,
                              archive.totalBazarCost,
                              archive.totalFixedCost,
                              archive.mealRate,
                              archive.memberSummaries
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
