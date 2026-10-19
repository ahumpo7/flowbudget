import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Info,
  Sparkles,
} from 'lucide-react';
import { CalendarItem, DayFinancialSummary } from '../types';

interface CashFlowBannerProps {
  currentDate: Date;
  calendarItems: CalendarItem[];
  dailySummaries: DayFinancialSummary[];
}

export const CashFlowBanner: React.FC<CashFlowBannerProps> = ({
  calendarItems,
  dailySummaries,
}) => {
  // Aggregate for current month's items
  const incomes = calendarItems.filter((i) => i.type === 'income');
  const bills = calendarItems.filter((i) => i.type === 'bill');
  const debts = calendarItems.filter((i) => i.type === 'debt');

  const totalInflow = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalBills = bills.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalDebt = debts.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalOutflow = totalBills + totalDebt;
  const netCashFlow = totalInflow - totalOutflow;

  // Calculate lowest running balance
  const lowestBalance = dailySummaries.length > 0
    ? Math.min(...dailySummaries.map((d) => d.endingBalance))
    : 0;

  // Fluctuating bills needing attention
  const paidExpenses = [...bills, ...debts].filter((b) => b.isPaid).reduce((sum, i) => sum + (i.amount || 0), 0);
  const pendingExpenses = totalOutflow - paidExpenses;

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {/* Total Inflow */}
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Inflow (Income)</span>
            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
              +${totalInflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {incomes.length} payday{incomes.length === 1 ? '' : 's'} scheduled
          </div>
        </div>

        {/* Total Outflow */}
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Bills & Debt Payments</span>
            <span className="p-1 rounded-md bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono tracking-tight">
              -${totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="text-emerald-400 font-semibold">${paidExpenses.toFixed(0)} paid</span>
            <span className="text-slate-500">•</span>
            <span className="text-rose-300 font-semibold">${pendingExpenses.toFixed(0)} pending</span>
          </div>
        </div>

        {/* Net Monthly Buffer / Over-Under */}
        <div className={`rounded-xl p-3 border shadow-sm flex flex-col justify-between ${
          netCashFlow >= 0
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Net Monthly Surplus / Deficit</span>
            {netCashFlow >= 0 ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                OVER (SURPLUS)
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> UNDER (DEFICIT)
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
              netCashFlow >= 0 ? 'text-emerald-300' : 'text-rose-400'
            }`}>
              {netCashFlow >= 0 ? '+' : '-'}${Math.abs(netCashFlow).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-300 truncate">
            {netCashFlow >= 0
              ? '✅ Income fully covers all scheduled bills'
              : '⚠️ Shortfall! Need to cut or float funds'}
          </div>
        </div>

        {/* Lowest Projected Cash Balance */}
        <div className={`rounded-xl p-3 border shadow-sm flex flex-col justify-between ${
          lowestBalance < 0
            ? 'bg-red-950/40 border-red-500/50'
            : lowestBalance < 500
            ? 'bg-amber-950/30 border-amber-500/30'
            : 'bg-slate-800/60 border-slate-700/60'
        }`}>
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Lowest Projected Balance</span>
            {lowestBalance < 0 ? (
              <span className="p-1 rounded-md bg-red-500/20 text-red-400">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
                <DollarSign className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
              lowestBalance < 0
                ? 'text-red-400 font-bold'
                : lowestBalance < 500
                ? 'text-amber-400'
                : 'text-cyan-300'
            }`}>
              ${lowestBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {lowestBalance < 0
              ? '🚨 Cash flow overdraft warning!'
              : lowestBalance < 500
              ? '⚠️ Cushion is tight during this cycle'
              : '🛡️ Safe cash cushion maintained'}
          </div>
        </div>
      </div>
    </div>
  );
};
