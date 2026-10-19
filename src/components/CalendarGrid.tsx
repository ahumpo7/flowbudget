import React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import {
  CalendarItem,
  DayFinancialSummary,
  Bill,
  LifeEvent,
  IncomeSource,
  Debt,
} from '../types';
import {
  Check,
  Zap,
  DollarSign,
  AlertCircle,
  Clock,
  Plus,
  Trophy,
  Flag,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface CalendarGridProps {
  currentDate: Date;
  calendarItems: CalendarItem[];
  dailySummaries: DayFinancialSummary[];
  onSelectDay: (date: Date) => void;
  onSelectItem: (item: CalendarItem) => void;
  onTogglePaid: (item: CalendarItem, e: React.MouseEvent) => void;
  onQuickAddForDate: (date: Date) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  calendarItems,
  dailySummaries,
  onSelectItem,
  onTogglePaid,
  onQuickAddForDate,
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map daily summaries by date string
  const summaryMap = new Map<string, DayFinancialSummary>(
    dailySummaries.map((s) => [s.date, s])
  );

  // Group items by date
  const itemsByDate = new Map<string, CalendarItem[]>();
  calendarItems.forEach((item) => {
    if (!itemsByDate.has(item.date)) {
      itemsByDate.set(item.date, []);
    }
    itemsByDate.get(item.date)!.push(item);
  });

  return (
    <div className="bg-slate-900 flex-1 flex flex-col p-2 sm:p-4 lg:p-6 select-none">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1.5 text-center">
          {weekDays.map((day, idx) => (
            <div
              key={day}
              className={`py-2 text-xs font-bold tracking-wider uppercase ${
                idx === 0 || idx === 6 ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* 7-column Calendar Month Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1 auto-rows-fr">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            const daySummary = summaryMap.get(dateKey);
            const dayItems = itemsByDate.get(dateKey) || [];

            const endingBal = daySummary?.endingBalance;
            const hasOverdraft = endingBal !== undefined && endingBal < 0;
            const isTight = endingBal !== undefined && endingBal >= 0 && endingBal < 400;

            // Separate items by priority
            const incomes = dayItems.filter((i) => i.type === 'income');
            const bills = dayItems.filter((i) => i.type === 'bill' || i.type === 'debt');
            const lifeEvents = dayItems.filter((i) => i.type === 'life_event');

            return (
              <div
                key={dateKey}
                className={`group relative min-h-[105px] sm:min-h-[135px] rounded-xl border p-1.5 sm:p-2 flex flex-col justify-between transition-all duration-150 ${
                  isCurrentMonth
                    ? 'bg-slate-800/40 border-slate-700/60 hover:border-slate-500/80 hover:bg-slate-800/70'
                    : 'bg-slate-900/30 border-slate-800/40 opacity-40 hover:opacity-75'
                } ${isCurrentDay ? 'ring-2 ring-emerald-400/80 border-emerald-500/60 shadow-lg shadow-emerald-500/10' : ''}`}
              >
                {/* Day Header: Date Number + Daily Projected Balance */}
                <div className="flex items-start justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs sm:text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                        isCurrentDay
                          ? 'bg-emerald-500 text-slate-950 font-black shadow'
                          : isCurrentMonth
                          ? 'text-slate-200'
                          : 'text-slate-500'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {/* Hover Quick Add Button */}
                    <button
                      onClick={() => onQuickAddForDate(day)}
                      title={`Add item on ${format(day, 'MMM d')}`}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-emerald-300 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Daily Running Bank Balance */}
                  {endingBal !== undefined && (
                    <div
                      className={`text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded transition-colors ${
                        hasOverdraft
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : isTight
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                      title={`Projected bank balance at end of ${format(day, 'MMM d')}: $${endingBal.toFixed(2)}`}
                    >
                      ${Math.round(endingBal).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Day Items Container */}
                <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar max-h-[110px] sm:max-h-[140px]">
                  {/* 1. Incomes / Paydays (Prominent Green) */}
                  {incomes.map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => onSelectItem(inc)}
                      className="cursor-pointer px-1.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-[11px] sm:text-xs font-medium flex items-center justify-between gap-1 shadow-sm transition-colors"
                      title={`${inc.title} - Inflow of $${inc.amount?.toFixed(2)}`}
                    >
                      <div className="flex items-center gap-1 truncate font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="truncate">{inc.title}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-300 text-[11px]">
                        +${inc.amount?.toLocaleString()}
                      </span>
                    </div>
                  ))}

                  {/* 2. Bills & Debt Payments */}
                  {bills.map((bill) => {
                    const isDebt = bill.type === 'debt';
                    return (
                      <div
                        key={bill.id}
                        onClick={() => onSelectItem(bill)}
                        className={`cursor-pointer group/item px-1.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs border flex items-center justify-between gap-1 transition-all ${
                          bill.isPaid
                            ? 'bg-slate-800/80 border-slate-700/80 text-slate-400 line-through opacity-75'
                            : isDebt
                            ? 'bg-pink-950/30 border-pink-500/40 text-pink-200 hover:bg-pink-900/40'
                            : bill.isBaseline
                            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200 hover:bg-amber-900/40'
                            : 'bg-slate-800 border-slate-700/80 text-slate-200 hover:bg-slate-750 hover:border-slate-600'
                        }`}
                        title={`${bill.title}: $${bill.amount?.toFixed(2)} ${
                          bill.isBaseline ? '(Baseline estimate - click to enter actual)' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {/* Paid checkmark button */}
                          <button
                            type="button"
                            onClick={(e) => onTogglePaid(bill, e)}
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${
                              bill.isPaid
                                ? 'bg-emerald-500 text-slate-950'
                                : 'border border-slate-600 hover:border-emerald-400 hover:bg-emerald-500/20'
                            }`}
                            title={bill.isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
                          >
                            {bill.isPaid && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </button>

                          <span className="truncate">{bill.title}</span>

                          {/* Fluctuating baseline indicator */}
                          {bill.isBaseline && (
                            <span
                              className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium"
                              title="Baseline estimate pending actual bill"
                            >
                              est
                            </span>
                          )}
                        </div>

                        <span
                          className={`font-mono font-semibold shrink-0 ${
                            isDebt ? 'text-pink-300' : 'text-slate-300'
                          }`}
                        >
                          ${bill.amount?.toFixed(0)}
                        </span>
                      </div>
                    );
                  })}

                  {/* 3. Life / Family Schedule Events (Non-financial Layer) */}
                  {lifeEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => onSelectItem(evt)}
                      style={{
                        backgroundColor: `${evt.color}15`,
                        borderColor: `${evt.color}40`,
                        color: evt.color,
                      }}
                      className="cursor-pointer px-1.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs border flex items-center justify-between gap-1 transition-all hover:brightness-125"
                      title={`${evt.title} (${evt.layerName}) ${evt.notes ? `• ${evt.notes}` : ''} - Non-financial layer`}
                    >
                      <div className="flex items-center gap-1 truncate font-medium">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: evt.color }}
                        />
                        <span className="truncate">{evt.title}</span>
                      </div>
                      {evt.notes && (
                        <span className="text-[9px] opacity-75 shrink-0 hidden sm:inline">
                          {evt.notes.split(' - ')[0]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Day Inflow/Outflow mini indicator at bottom */}
                {(daySummary?.totalInflow || 0) > 0 || (daySummary?.totalOutflow || 0) > 0 ? (
                  <div className="mt-1 pt-1 border-t border-slate-700/40 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <span className="text-emerald-400">
                      {daySummary?.totalInflow ? `+$${daySummary.totalInflow}` : ''}
                    </span>
                    <span className="text-rose-400">
                      {daySummary?.totalOutflow ? `-$${Math.round(daySummary.totalOutflow)}` : ''}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
