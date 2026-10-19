import React from 'react';
import {
  CalendarItem,
  PayCycle,
  DayFinancialSummary,
  Bill,
} from '../types';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Plus,
} from 'lucide-react';

interface PayCycleViewProps {
  payCycles: PayCycle[];
  onSelectItem: (item: CalendarItem) => void;
  onTogglePaid: (item: CalendarItem, e: React.MouseEvent) => void;
  onOpenAddModal: () => void;
}

export const PayCycleView: React.FC<PayCycleViewProps> = ({
  payCycles,
  onSelectItem,
  onTogglePaid,
  onOpenAddModal,
}) => {
  if (payCycles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-slate-800/40 border border-slate-700/60 rounded-2xl mt-8">
        <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-200">No Pay Cycles Detected</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Add a recurring paycheck or manual income source to automatically generate payday-to-payday cash flow cycles.
        </p>
        <button
          onClick={onOpenAddModal}
          className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Income / Payday</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Overview Intro Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Payday-to-Payday Cash Flow Cycles
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Each paycheck is partitioned into its own cycle window. FlowBudget computes all fixed costs,
              fluctuating bills, and debt payments due before your next paycheck to show if you’re over or under covering expenses.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Bill or Income</span>
            </button>
          </div>
        </div>
      </div>

      {/* List of Pay Cycles */}
      <div className="space-y-6">
        {payCycles.map((cycle, index) => {
          const daysInCycle = differenceInDays(
            parseISO(cycle.endDate),
            parseISO(cycle.startDate)
          ) + 1;
          const percentUsed = cycle.incomeAmount > 0
            ? Math.min(100, Math.round((cycle.totalExpenses / cycle.incomeAmount) * 100))
            : 100;
          const expenses = cycle.items.filter((i) => i.type === 'bill' || i.type === 'debt');
          const isOver = cycle.isSurplus;

          const paidInCycle = expenses.filter((i) => i.isPaid).reduce((sum, i) => sum + (i.amount || 0), 0);
          const pendingInCycle = cycle.totalExpenses - paidInCycle;

          return (
            <div
              key={cycle.id}
              className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-lg ${
                isOver
                  ? 'bg-slate-800/70 border-slate-700/80 hover:border-emerald-500/40'
                  : 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60'
              }`}
            >
              {/* Cycle Top Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shrink-0">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {cycle.incomeName}
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-700 text-slate-300 border border-slate-600">
                        {format(parseISO(cycle.startDate), 'MMM d')} – {format(parseISO(cycle.endDate), 'MMM d, yyyy')} ({daysInCycle} days)
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Received: <strong className="text-emerald-400">{format(parseISO(cycle.payDate), 'EEEE, MMMM d')}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Over / Under Cash Flow Status Badge */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Cycle Buffer
                    </div>
                    <div
                      className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                        isOver ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isOver ? '+' : '-'}${Math.abs(cycle.netBuffer).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 ${
                      isOver
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {isOver ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>OVER (Surplus)</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <span>UNDER (Shortfall)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar & Financial Breakdown */}
              <div className="py-4 grid grid-cols-2 lg:grid-cols-4 gap-3 border-b border-slate-700/60">
                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                  <span className="text-xs text-slate-400">Paycheck Inflow</span>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    +${cycle.incomeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                  <span className="text-xs text-slate-400">Total Cycle Bills</span>
                  <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                    -${cycle.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                  <span className="text-xs text-slate-400">Paid vs Pending</span>
                  <div className="text-xs font-mono font-bold mt-1 flex items-center justify-between">
                    <span className="text-emerald-400">${paidInCycle.toFixed(0)} paid</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-rose-300">${pendingInCycle.toFixed(0)} pending</span>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Paycheck Allocated</span>
                    <span className="font-mono font-bold text-slate-300">{percentUsed}%</span>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2.5 mt-2 overflow-hidden border border-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentUsed > 100
                          ? 'bg-rose-500'
                          : percentUsed > 80
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, percentUsed)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bills Due in this Specific Pay Cycle */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Bills Covered by this Paycheck ({expenses.length})
                  </h4>
                  <span className="text-xs text-slate-400">
                    Must be paid before next paycheck
                  </span>
                </div>

                {expenses.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-500 italic bg-slate-900/30 rounded-xl border border-slate-800">
                    No bills or debt payments scheduled during this cycle. 100% of income is free buffer!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {expenses.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onSelectItem(item)}
                        className={`cursor-pointer p-3 rounded-xl border flex items-center justify-between transition-all ${
                          item.isPaid
                            ? 'bg-slate-900/40 border-slate-800/80 text-slate-500'
                            : 'bg-slate-900/70 border-slate-700/70 text-slate-200 hover:border-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          {/* Paid Toggle Button */}
                          <button
                            type="button"
                            onClick={(e) => onTogglePaid(item, e)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                              item.isPaid
                                ? 'bg-emerald-500 text-slate-950 font-bold'
                                : 'border border-slate-600 hover:border-emerald-400 hover:bg-emerald-500/20'
                            }`}
                            title={item.isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
                          >
                            {item.isPaid && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          <div className="truncate">
                            <div className="flex items-center gap-2 truncate">
                              <span className={`text-xs font-semibold truncate ${item.isPaid ? 'line-through' : ''}`}>
                                {item.title}
                              </span>
                              {item.isBaseline && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium">
                                  Baseline Est.
                                </span>
                              )}
                              {item.type === 'debt' && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 font-medium">
                                  Debt Payoff
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>Due {format(parseISO(item.date), 'MMM d (EEE)')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`font-mono font-bold text-sm ${item.isPaid ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                            ${item.amount?.toFixed(2)}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            {item.isPaid ? '✅ Paid' : 'Pending'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
