import React, { useState } from 'react';
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
  parseISO,
} from 'date-fns';
import {
  CalendarItem,
  DayFinancialSummary,
} from '../types';
import {
  Check,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  ArrowRight,
  TrendingUp,
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
  const [selectedMobileDate, setSelectedMobileDate] = useState<Date>(() => new Date());

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

  const selectedDateKey = format(selectedMobileDate, 'yyyy-MM-dd');
  const selectedDayItems = itemsByDate.get(selectedDateKey) || [];
  const selectedDaySummary = summaryMap.get(selectedDateKey);

  return (
    <div className="bg-slate-950 flex-1 flex flex-col p-2 sm:p-4 lg:p-6 select-none pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 text-center">
          {weekDays.map((day, idx) => (
            <div
              key={day}
              className={`py-1 sm:py-2 text-[10px] sm:text-xs font-bold tracking-wider uppercase ${
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
            const isSelected = isSameDay(day, selectedMobileDate);
            const daySummary = summaryMap.get(dateKey);
            const dayItems = itemsByDate.get(dateKey) || [];

            const endingBal = daySummary?.endingBalance;
            const hasOverdraft = endingBal !== undefined && endingBal < 0;
            const isTight = endingBal !== undefined && endingBal >= 0 && endingBal < 400;

            const incomes = dayItems.filter((i) => i.type === 'income');
            const bills = dayItems.filter((i) => i.type === 'bill' || i.type === 'debt');
            const lifeEvents = dayItems.filter((i) => i.type === 'life_event');

            return (
              <div
                key={dateKey}
                onClick={() => setSelectedMobileDate(day)}
                className={`group relative min-h-[58px] sm:min-h-[95px] md:min-h-[135px] rounded-xl border p-1 sm:p-1.5 md:p-2 flex flex-col justify-between transition-all cursor-pointer ${
                  isCurrentMonth
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-600'
                    : 'bg-slate-950/40 border-slate-900 opacity-40 hover:opacity-70'
                } ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 border-cyan-400/80 bg-slate-850 shadow-md'
                    : isCurrentDay
                    ? 'ring-1 sm:ring-2 ring-emerald-400/70 border-emerald-500/50'
                    : ''
                }`}
              >
                {/* Day Header: Date Number + Daily Projected Balance */}
                <div className="flex items-start justify-between gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[11px] sm:text-xs md:text-sm font-semibold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center ${
                        isCurrentDay
                          ? 'bg-emerald-500 text-slate-950 font-black shadow'
                          : isSelected
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : isCurrentMonth
                          ? 'text-slate-200'
                          : 'text-slate-500'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {/* Desktop Hover Quick Add */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAddForDate(day);
                      }}
                      title={`Add item on ${format(day, 'MMM d')}`}
                      className="hidden md:inline-block opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-emerald-300 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Daily Running Bank Balance */}
                  {endingBal !== undefined && (
                    <div
                      className={`text-[9px] sm:text-[10px] md:text-xs font-mono font-bold px-1 py-0.2 rounded transition-colors ${
                        hasOverdraft
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : isTight
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                      title={`Projected balance: $${endingBal.toFixed(2)}`}
                    >
                      <span className="sm:hidden">
                        ${endingBal >= 10000 ? `${(endingBal / 1000).toFixed(0)}k` : Math.round(endingBal)}
                      </span>
                      <span className="hidden sm:inline">
                        ${Math.round(endingBal).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Mobile View: Compact Indicator Dots (hidden on tablet/desktop) */}
                <div className="md:hidden flex items-center gap-1 flex-wrap pt-0.5">
                  {incomes.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Payday" />
                  )}
                  {bills.map((b) => (
                    <span
                      key={b.id}
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: b.isPaid ? '#64748b' : b.color }}
                      title={`${b.title} ($${b.amount})`}
                    />
                  ))}
                  {lifeEvents.map((e) => (
                    <span
                      key={e.id}
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: e.color }}
                      title={e.title}
                    />
                  ))}
                </div>

                {/* Desktop View: Full Rich Item Cards (md: and above) */}
                <div className="hidden md:block space-y-1 flex-1 overflow-y-auto no-scrollbar max-h-[140px]">
                  {/* Incomes / Paydays */}
                  {incomes.map((inc) => (
                    <div
                      key={inc.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem(inc);
                      }}
                      className="cursor-pointer px-1.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center justify-between gap-1 shadow-sm transition-colors"
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

                  {/* Bills & Debt Payments */}
                  {bills.map((bill) => {
                    const isDebt = bill.type === 'debt';
                    return (
                      <div
                        key={bill.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(bill);
                        }}
                        className={`cursor-pointer group/item px-1.5 py-0.5 sm:py-1 rounded-lg text-xs border flex items-center justify-between gap-1 transition-all ${
                          bill.isPaid
                            ? 'bg-slate-800/80 border-slate-700/80 text-slate-400 line-through opacity-75'
                            : isDebt
                            ? 'bg-pink-950/30 border-pink-500/40 text-pink-200 hover:bg-pink-900/40'
                            : bill.isBaseline
                            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200 hover:bg-amber-900/40'
                            : 'bg-slate-800 border-slate-700/80 text-slate-200 hover:bg-slate-750'
                        }`}
                        title={`${bill.title}: $${bill.amount?.toFixed(2)}`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <button
                            type="button"
                            onClick={(e) => onTogglePaid(bill, e)}
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${
                              bill.isPaid
                                ? 'bg-emerald-500 text-slate-950'
                                : 'border border-slate-600 hover:border-emerald-400'
                            }`}
                            title={bill.isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
                          >
                            {bill.isPaid && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </button>
                          <span className="truncate">{bill.title}</span>
                          {bill.isBaseline && (
                            <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-medium">
                              est
                            </span>
                          )}
                        </div>

                        <span className={`font-mono font-semibold shrink-0 ${isDebt ? 'text-pink-300' : 'text-slate-300'}`}>
                          ${bill.amount?.toFixed(0)}
                        </span>
                      </div>
                    );
                  })}

                  {/* Life Events */}
                  {lifeEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem(evt);
                      }}
                      style={{
                        backgroundColor: `${evt.color}15`,
                        borderColor: `${evt.color}40`,
                        color: evt.color,
                      }}
                      className="cursor-pointer px-1.5 py-0.5 sm:py-1 rounded-lg text-xs border flex items-center justify-between gap-1 transition-all"
                      title={`${evt.title} (${evt.layerName})`}
                    >
                      <div className="flex items-center gap-1 truncate font-medium">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: evt.color }} />
                        <span className="truncate">{evt.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* MOBILE ONLY: Selected Day Interactive Agenda Drawer */}
        <div className="md:hidden mt-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Selected Date</span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {format(selectedMobileDate, 'EEEE, MMMM d, yyyy')}
              </h3>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Ending Balance
              </span>
              <span className="text-sm font-black font-mono text-emerald-400">
                ${selectedDaySummary?.endingBalance?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>

          {/* List of items on this day for mobile with large thumb tap targets */}
          {selectedDayItems.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-500 italic">
              No bills or events on this day.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayItems.map((item) => {
                const isIncome = item.type === 'income';
                const isLife = item.type === 'life_event';

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3 active:bg-slate-750"
                  >
                    <div className="flex items-center gap-3 truncate">
                      {/* Large touch target checkbox for bills */}
                      {!isIncome && !isLife ? (
                        <button
                          type="button"
                          onClick={(e) => onTogglePaid(item, e)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                            item.isPaid
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'border-2 border-slate-600 active:border-emerald-400'
                          }`}
                          title={item.isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                        >
                          {item.isPaid && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>
                      ) : (
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${item.color}20`, color: item.color }}
                        >
                          {isIncome ? <TrendingUp className="w-4 h-4" /> : <CalendarIcon className="w-4 h-4" />}
                        </div>
                      )}

                      <div className="truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`text-xs font-semibold truncate ${item.isPaid ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            {item.title}
                          </span>
                          {item.isBaseline && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium">
                              Baseline
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {item.amount !== undefined ? (
                        <div className={`font-mono font-bold text-xs sm:text-sm ${
                          isIncome ? 'text-emerald-400' : item.isPaid ? 'line-through text-slate-500' : 'text-rose-400'
                        }`}>
                          {isIncome ? '+' : '-'}${item.amount.toFixed(2)}
                        </div>
                      ) : (
                        <span className="text-[10px] text-purple-300 font-medium">{item.layerName}</span>
                      )}
                      <div className="text-[9px] text-slate-500">
                        {item.isPaid ? 'Paid' : isIncome ? 'Income' : isLife ? 'Life' : 'Pending'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Add Button on Selected Date */}
          <button
            onClick={() => onQuickAddForDate(selectedMobileDate)}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-emerald-400 stroke-[3]" />
            <span>Add Bill or Event on {format(selectedMobileDate, 'MMM d')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
