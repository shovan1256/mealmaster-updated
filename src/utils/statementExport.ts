import { MealSummaryData, MonthlyArchiveSummary, Mess } from '../types';

/**
 * Generates and downloads a clean, UTF-8 formatted CSV/Excel statement file
 * Compatible with Microsoft Excel, Google Sheets, and LibreOffice with full Bengali support.
 */
export function exportMonthlyExcelStatement(
  mess: Mess,
  month: string,
  totalMeals: number,
  totalBazarCost: number,
  totalFixedCost: number,
  mealRate: number,
  summaries: MealSummaryData[]
) {
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

  const rows: string[] = [];

  // UTF-8 Byte Order Mark for Excel Bengali character rendering
  const BOM = '\uFEFF';

  // Mess Header
  rows.push(`"মেসের নাম:","${mess.name}"`);
  rows.push(`"হিসাবের মাস:","${formattedMonth}"`);
  rows.push(`"মোট মিল:","${totalMeals.toFixed(1)}"`);
  rows.push(`"মোট বাজার খরচ:","৳${totalBazarCost.toLocaleString('bn-BD')}"`);
  rows.push(`"মোট ফিক্সড খরচ:","৳${totalFixedCost.toLocaleString('bn-BD')}"`);
  rows.push(`"প্রতি মিল রেট:","৳${mealRate.toFixed(2)}"`);
  rows.push(''); // Empty line separator

  // Table Headers
  const headers = [
    'ক্রমিক',
    'মেম্বারের নাম',
    'রুম',
    'ডিপার্টমেন্ট',
    'চালু দিন',
    'রেগুলার মিল',
    'গেস্ট মিল',
    'মোট মিল',
    'মিল খরচ (৳)',
    'ফিক্সড খরচ (৳)',
    'পূর্বের বকেয়া (৳)',
    'মোট প্রদেয় (৳)',
    'মোট জমা (৳)',
    'বর্তমান ব্যালেন্স (৳)',
    'অবস্থা',
  ];
  rows.push(headers.map((h) => `"${h}"`).join(','));

  // Data rows
  summaries.forEach((s, idx) => {
    const statusText =
      s.balance > 0
        ? `পাওনা (৳${Math.round(s.balance)})`
        : s.balance < 0
        ? `বকেয়া (৳${Math.abs(Math.round(s.balance))})`
        : 'পরিশোধিত';

    const row = [
      (idx + 1).toString(),
      s.memberName,
      s.room || '-',
      s.department || '-',
      s.totalDaysOn.toString(),
      s.totalRegularMeals.toFixed(1),
      s.totalGuestMeals.toFixed(1),
      s.totalMeals.toFixed(1),
      Math.round(s.mealCost).toString(),
      Math.round(s.fixedCostShare).toString(),
      Math.round(s.carryOverDue).toString(),
      Math.round(s.totalPayable).toString(),
      Math.round(s.totalDeposit).toString(),
      Math.round(s.balance).toString(),
      statusText,
    ];
    rows.push(row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','));
  });

  // Footer Totals
  const totalDepositSum = summaries.reduce((acc, s) => acc + s.totalDeposit, 0);
  const totalPayableSum = summaries.reduce((acc, s) => acc + s.totalPayable, 0);
  const totalBalanceSum = summaries.reduce((acc, s) => acc + s.balance, 0);

  rows.push('');
  rows.push(
    `"সর্বমোট","","","","","","","${totalMeals.toFixed(1)}","${Math.round(
      totalBazarCost
    )}","${Math.round(totalFixedCost)}","","${Math.round(
      totalPayableSum
    )}","${Math.round(totalDepositSum)}","${Math.round(totalBalanceSum)}",""`
  );

  const csvContent = BOM + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${mess.name.replace(/\s+/g, '_')}_হিসাব_${month}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Builds printable HTML format for certified PDF print
 */
export function openPrintablePDFStatement(
  mess: Mess,
  month: string,
  totalMeals: number,
  totalBazarCost: number,
  totalFixedCost: number,
  mealRate: number,
  summaries: MealSummaryData[]
) {
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

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return;
  }

  const tableRowsHtml = summaries
    .map(
      (s, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
      <td style="padding: 8px 6px; text-align: center;">${idx + 1}</td>
      <td style="padding: 8px 6px; font-weight: 600;">${s.memberName}</td>
      <td style="padding: 8px 6px; text-align: center;">${s.room || '-'}</td>
      <td style="padding: 8px 6px; text-align: right; font-family: monospace;">${s.totalMeals.toFixed(1)}</td>
      <td style="padding: 8px 6px; text-align: right; font-family: monospace;">৳${Math.round(s.mealCost)}</td>
      <td style="padding: 8px 6px; text-align: right; font-family: monospace;">৳${Math.round(s.fixedCostShare)}</td>
      <td style="padding: 8px 6px; text-align: right; font-family: monospace;">৳${Math.round(s.carryOverDue)}</td>
      <td style="padding: 8px 6px; text-align: right; font-weight: 600; font-family: monospace;">৳${Math.round(s.totalPayable)}</td>
      <td style="padding: 8px 6px; text-align: right; font-weight: 600; color: #047857; font-family: monospace;">৳${Math.round(s.totalDeposit)}</td>
      <td style="padding: 8px 6px; text-align: right; font-weight: 700; color: ${
        s.balance >= 0 ? '#047857' : '#b91c1c'
      }; font-family: monospace;">${s.balance >= 0 ? '+' : ''}৳${Math.round(s.balance)}</td>
    </tr>
  `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="utf-8">
      <title>${mess.name} - ${formattedMonth} মাসিক হিসাব বিবরণী</title>
      <style>
        @page { size: A4 landscape; margin: 15mm; }
        body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
        .meta-grid { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #f1f5f9; padding: 8px 6px; font-size: 12px; font-weight: 700; text-align: left; border-bottom: 2px solid #cbd5e1; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; padding: 0 40px; }
        .sig-line { border-top: 1px dashed #64748b; width: 180px; text-align: center; font-size: 12px; padding-top: 6px; }
        @media print {
          body { padding: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0 0 4px 0; font-size: 22px; color: #0f172a;">${mess.name}</h1>
        <div style="font-size: 14px; color: #64748b;">মাসিক ডাইনিং ও মেস হিসাব বিবরণী · ${formattedMonth}</div>
      </div>

      <div class="meta-grid">
        <div><strong>হিসাবের মাস:</strong> ${formattedMonth}</div>
        <div><strong>মোট মিল:</strong> ${totalMeals.toFixed(1)}</div>
        <div><strong>মোট বাজার খরচ:</strong> ৳${totalBazarCost.toLocaleString('bn-BD')}</div>
        <div><strong>ফিক্সড খরচ:</strong> ৳${totalFixedCost.toLocaleString('bn-BD')}</div>
        <div><strong>মিল রেট:</strong> <span style="color: #047857; font-weight: bold;">৳${mealRate.toFixed(2)}</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align: center;">নং</th>
            <th>মেম্বার</th>
            <th style="text-align: center;">রুম</th>
            <th style="text-align: right;">মিল</th>
            <th style="text-align: right;">মিল খরচ</th>
            <th style="text-align: right;">ফিক্সড খরচ</th>
            <th style="text-align: right;">পূর্বের বকেয়া</th>
            <th style="text-align: right;">মোট প্রদেয়</th>
            <th style="text-align: right;">মোট জমা</th>
            <th style="text-align: right;">ব্যালেন্স (+পাওনা / -বকেয়া)</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <div class="sig-line">মেস ম্যানেজারের স্বাক্ষর</div>
        <div class="sig-line">হিসাব নিরীক্ষক / অডিটর</div>
        <div class="sig-line">মেস প্রতিনিধির স্বাক্ষর</div>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
          🖨️ প্রিন্ট করুন বা PDF হিসেবে সংরক্ষণ করুন
        </button>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}
