import React from 'react';
import { X, Printer, FileSpreadsheet, Download, Building2, Calendar, ShieldCheck } from 'lucide-react';
import { MealSummaryData, Mess } from '../types';
import { exportMonthlyExcelStatement, openPrintablePDFStatement } from '../utils/statementExport';

interface MonthlyStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  mess: Mess;
  month: string;
  totalMeals: number;
  totalBazarCost: number;
  totalFixedCost: number;
  mealRate: number;
  summaries: MealSummaryData[];
}

export const MonthlyStatementModal: React.FC<MonthlyStatementModalProps> = ({
  isOpen,
  onClose,
  mess,
  month,
  totalMeals,
  totalBazarCost,
  totalFixedCost,
  mealRate,
  summaries,
}) => {
  if (!isOpen) return null;

  const [year, monthNum] = month.split('-');
  const monthNames = [
    'জানুয়ারি',
    'ফেব্রুয়ারি',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টেম্বর',
    'অক্টোবর',
    'নভেম্বর',
    'ডিসেম্বর',
  ];
  const formattedMonth = `${monthNames[parseInt(monthNum, 10) - 1] || monthNum} ${year}`;

  const handlePrint = () => {
    openPrintablePDFStatement(mess, month, totalMeals, totalBazarCost, totalFixedCost, mealRate, summaries);
  };

  const handleExcelExport = () => {
    exportMonthlyExcelStatement(mess, month, totalMeals, totalBazarCost, totalFixedCost, mealRate, summaries);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold">{mess.name} - মাসিক হিসাব বিবরণী</h2>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <span>মাস: {formattedMonth}</span>
                <span>·</span>
                <span>মিল রেট: ৳{mealRate.toFixed(2)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>অফিসিয়াল সার্টিফাইড হিসাব বিবরণী</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExcelExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel ডাউনলোড (.csv)
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              প্রিন্ট বা PDF সংরক্ষণ
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">মোট মিল</span>
              <div className="text-lg font-bold font-mono text-slate-900">{totalMeals.toFixed(1)}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">বাজার খরচ</span>
              <div className="text-lg font-bold font-mono text-slate-900">৳{totalBazarCost.toLocaleString('bn-BD')}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">ফিক্সড খরচ</span>
              <div className="text-lg font-bold font-mono text-slate-900">৳{totalFixedCost.toLocaleString('bn-BD')}</div>
            </div>
            <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase">মিল রেট</span>
              <div className="text-lg font-bold font-mono text-indigo-700">৳{mealRate.toFixed(2)}</div>
            </div>
          </div>

          {/* Members Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 text-center">নং</th>
                    <th className="p-2.5">মেম্বারের নাম</th>
                    <th className="p-2.5 text-center">রুম</th>
                    <th className="p-2.5 text-right font-mono">মোট মিল</th>
                    <th className="p-2.5 text-right font-mono">মিল খরচ</th>
                    <th className="p-2.5 text-right font-mono">ফিক্সড</th>
                    <th className="p-2.5 text-right font-mono">বকেয়া</th>
                    <th className="p-2.5 text-right font-mono font-bold">মোট খরচ</th>
                    <th className="p-2.5 text-right font-mono text-emerald-700 font-bold">জমা</th>
                    <th className="p-2.5 text-right font-mono font-bold">ব্যালেন্স</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaries.map((s, idx) => (
                    <tr key={s.memberId} className="hover:bg-slate-50/80 transition">
                      <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{s.memberName}</td>
                      <td className="p-2.5 text-center text-slate-500">{s.room || '-'}</td>
                      <td className="p-2.5 text-right font-mono text-slate-700">{s.totalMeals.toFixed(1)}</td>
                      <td className="p-2.5 text-right font-mono text-slate-700">৳{Math.round(s.mealCost)}</td>
                      <td className="p-2.5 text-right font-mono text-slate-700">৳{Math.round(s.fixedCostShare)}</td>
                      <td className="p-2.5 text-right font-mono text-slate-500">৳{Math.round(s.carryOverDue)}</td>
                      <td className="p-2.5 text-right font-mono font-semibold text-slate-900">৳{Math.round(s.totalPayable)}</td>
                      <td className="p-2.5 text-right font-mono font-semibold text-emerald-700">৳{Math.round(s.totalDeposit)}</td>
                      <td
                        className={`p-2.5 text-right font-mono font-bold ${
                          s.balance >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {s.balance >= 0 ? '+' : ''}৳{Math.round(s.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
