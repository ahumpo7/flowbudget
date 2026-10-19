import React, { useState } from 'react';
import { CalendarItem, DayFinancialSummary } from '../types';
import { format, parseISO, isToday, isPast } from 'date-fns';
import {
  Calendar,
  Check,
  TrendingUp,
  Receipt,
  CreditCard,
  Zap,
  Filter,
  DollarSign,
  Plus,
} from 'lucide-react';

interface ScheduleViewProps {
  calendarItems: CalendarItem[];
  onSelectItem: (item: CalendarItem) => void;
  onTogglePaid: (item: CalendarItem, e: React.MouseEvent) => void;
  onOpenAddModal: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  calendarItems,
  onSelectItem,
  onTogglePaid,
  onOpenAddModal,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'money' | 'life'>('all');

  // Filter items
  const filtered = calendarItems.filter((item) => {
    if (filterType === 'money') return item.type !== 'life_event';
    if (filterType === 'life') return item.type === 'life_event';
    return true;
  });

  // Group by date
  const grouped = new Map<string, CalendarItem[]>();
  filtered
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((item) => {
      if (!grouped.has(item.date)) {
        grouped.set(item.date, []);
      }
      grouped.get(item.date)!.push(item);
    });

  const dates = Array.from(grouped.keys());

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span>Monthly Agenda & Schedule</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological timeline of paydays, bills, debts, and family events
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700/80 text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilterType('money')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === 'money'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Money Only
            </button>
            <button
              onClick={() => setFilterType('life')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === 'life'
                  ? 'bg-purple-500/20 text-purple-300 shadow-sm border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Life Layers
            </button>
          </div>

          <button
            onClick={onOpenAddModal}
            className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            title="Add event or bill"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Date-grouped List */}
      {dates.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-slate-800/40 rounded-2xl border border-slate-700/60">
          No items scheduled for this period matching your filter.
        </div>
      ) : (
        <div className="space-y-4">
          {dates.map((dateStr) => {
            const items = grouped.get(dateStr) || [];
            const parsedDate = parseISO(dateStr);
            const isDateToday = isToday(parsedDate);

            return (
              <div
                key={dateStr}
                className={`bg-slate-900 border rounded-2xl overflow-hidden shadow-md transition-all ${
                  isDateToday
                    ? 'border-emerald-500/60 ring-1 ring-emerald-500/40'
                    : 'border-slate-800/80'
                }`}
              >
                {/* Date Header */}
                <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
                  isDateToday
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200 font-bold'
                    : 'bg-slate-800/70 border-slate-800 text-slate-300 font-semibold'
                } text-xs sm:text-sm`}>
                  <div className="flex items-center gap-2">
                    <span>{format(parsedDate, 'EEEE, MMMM d, yyyy')}</span>
                    {isDateToday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-normal">
                    {items.length} item{items.length === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Items on this Date */}
                <div className="divide-y divide-slate-800/60">
                  {items.map((item) => {
                    const isIncome = item.type === 'income';
                    const isLife = item.type === 'life_event';
                    const isDebt = item.type === 'debt';

                    return (
                      <div
                        key={item.id}
                        onClick={() => onSelectItem(item)}
                        className={`p-3.5 sm:px-4 sm:py-3 cursor-pointer flex items-center justify-between gap-3 hover:bg-slate-800/50 transition-colors ${
                          item.isPaid ? 'opacity-60 bg-slate-900/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          {/* Left Icon or Checkbox */}
                          {!isLife && !isIncome ? (
                            <button
                              type="button"
                              onClick={(e) => onTogglePaid(item, e)}
                              className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                                item.isPaid
                                  ? 'bg-emerald-500 text-slate-950 font-bold'
                                  : 'border border-slate-600 hover:border-emerald-400'
                              }`}
                              title={item.isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
                            >
                              {item.isPaid && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          ) : (
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${item.color}20`,
                                color: item.color,
                              }}
                            >
                              {isIncome ? (
                                <TrendingUp className="w-3.5 h-3.5" />
                              ) : isLife ? (
                                <Calendar className="w-3.5 h-3.5" />
                              ) : (
                                <CreditCard className="w-3.5 h-3.5" />
                              )}
                            </div>
                          )}

                          <div className="truncate">
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className={`text-xs sm:text-sm font-semibold truncate ${
                                  item.isPaid ? 'line-through text-slate-400' : 'text-slate-100'
                                }`}
                              >
                                {item.title}
                              </span>
                              {item.isBaseline && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium">
                                  Baseline Est.
                                </span>
                              )}
                              {isLife && item.layerName && (
                                <span
                                  className="text-[10px] px-2 py-0.2 rounded-full font-bold"
                                  style={{
                                    backgroundColor: `${item.color}20`,
                                    color: item.color,
                                  }}
                                >
                                  {item.layerName}
                                </span>
                              )}
                            </div>
                            {item.notes && (
                              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                {item.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Amount or Info */}
                        <div className="text-right shrink-0">
                          {item.amount !== undefined ? (
                            <div
                              className={`font-mono font-bold text-xs sm:text-sm ${
                                isIncome
                                  ? 'text-emerald-400'
                                  : isDebt
                                  ? 'text-pink-400'
                                  : item.isPaid
                                  ? 'line-through text-slate-500'
                                  : 'text-rose-400'
                              }`}
                            >
                              {isIncome ? '+' : '-'}${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Non-financial</span>
                          )}
                          <div className="text-[10px] text-slate-500">
                            {item.isPaid ? 'Paid' : isIncome ? 'Income' : isLife ? 'Life' : 'Pending'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
