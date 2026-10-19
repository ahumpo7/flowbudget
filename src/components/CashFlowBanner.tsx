import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  ChevronDown,
  ChevronUp,
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
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

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

  const paidExpenses = [...bills, ...debts].filter((b) => b.isPaid).reduce((sum, i) => sum + (i.amount || 0), 0);
  const pendingExpenses = totalOutflow - paidExpenses;

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 lg:px-8 py-2 sm:py-3.5">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Header / Quick Strip Toggle */}
        <div className="md:hidden flex items-center justify-between pb-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Monthly Cash Flow:</span>
            <span className={`font-mono font-bold ${netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netCashFlow >= 0 ? '+' : '-'}${Math.abs(netCashFlow).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${netCashFlow >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
              {netCashFlow >= 0 ? 'SURPLUS' : 'DEFICIT'}
            </span>
          </div>

          <button
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
          >
            <span>{isMobileExpanded ? 'Hide' : 'Details'}</span>
            {isMobileExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* 4 Metrics Grid: always visible on md+, collapsible on mobile */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 ${isMobileExpanded ? 'grid' : 'hidden md:grid'}`}>
          {/* Total Inflow */}
          <div className="bg-slate-800/60 rounded-xl p-2.5 sm:p-3 border border-slate-700/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-medium">
              <span>Total Inflow</span>
              <span className="p-0.5 sm:p-1 rounded bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-base sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
                +${totalInflow.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400">
              {incomes.length} payday{incomes.length === 1 ? '' : 's'}
            </div>
          </div>

          {/* Total Outflow */}
          <div className="bg-slate-800/60 rounded-xl p-2.5 sm:p-3 border border-slate-700/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-medium">
              <span>Bills & Debts</span>
              <span className="p-0.5 sm:p-1 rounded bg-rose-500/10 text-rose-400">
                <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-base sm:text-2xl font-black text-rose-400 font-mono tracking-tight">
                -${totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between">
              <span className="text-emerald-400">${paidExpenses.toFixed(0)} paid</span>
              <span className="text-slate-500">•</span>
              <span className="text-rose-300">${pendingExpenses.toFixed(0)} due</span>
            </div>
          </div>

          {/* Net Monthly Buffer / Over-Under */}
          <div className={`rounded-xl p-2.5 sm:p-3 border shadow-sm flex flex-col justify-between ${
            netCashFlow >= 0
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}>
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold">
              <span>Net Buffer</span>
              {netCashFlow >= 0 ? (
                <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                  OVER
                </span>
              ) : (
                <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" /> UNDER
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className={`text-base sm:text-2xl font-black font-mono tracking-tight ${
                netCashFlow >= 0 ? 'text-emerald-300' : 'text-rose-400'
              }`}>
                {netCashFlow >= 0 ? '+' : '-'}${Math.abs(netCashFlow).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-300 truncate">
              {netCashFlow >= 0 ? 'Safe cushion' : 'Shortfall warning'}
            </div>
          </div>

          {/* Lowest Projected Cash Balance */}
          <div className={`rounded-xl p-2.5 sm:p-3 border shadow-sm flex flex-col justify-between ${
            lowestBalance < 0
              ? 'bg-red-950/40 border-red-500/50'
              : lowestBalance < 500
              ? 'bg-amber-950/30 border-amber-500/30'
              : 'bg-slate-800/60 border-slate-700/60'
          }`}>
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium text-slate-400">
              <span>Lowest Balance</span>
              <span className="p-0.5 sm:p-1 rounded bg-cyan-500/10 text-cyan-400">
                <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className={`text-base sm:text-2xl font-black font-mono tracking-tight ${
                lowestBalance < 0
                  ? 'text-red-400 font-bold'
                  : lowestBalance < 500
                  ? 'text-amber-400'
                  : 'text-cyan-300'
              }`}>
                ${lowestBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400">
              {lowestBalance < 0 ? 'Overdraft risk' : 'Healthy buffer'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
