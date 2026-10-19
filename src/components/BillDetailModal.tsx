import React, { useState } from 'react';
import { CalendarItem, Bill, IncomeSource, LifeEvent, Debt } from '../types';
import { format, parseISO } from 'date-fns';
import {
  X,
  Check,
  Zap,
  Calendar,
  DollarSign,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  Tag,
  AlertCircle,
  Save,
} from 'lucide-react';

interface BillDetailModalProps {
  item: CalendarItem | null;
  onClose: () => void;
  onUpdateBillActual: (billId: string, dateKey: string, actualAmount: number) => void;
  onTogglePaid: (item: CalendarItem) => void;
  onDeleteItem: (item: CalendarItem) => void;
}

export const BillDetailModal: React.FC<BillDetailModalProps> = ({
  item,
  onClose,
  onUpdateBillActual,
  onTogglePaid,
  onDeleteItem,
}) => {
  if (!item) return null;

  const isBill = item.type === 'bill';
  const bill = isBill ? (item.rawItem as Bill) : null;
  const isFluctuating = bill?.isFluctuating || false;

  const [actualInput, setActualInput] = useState<string>(
    item.amount ? item.amount.toString() : ''
  );
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  const handleSaveActual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bill) return;
    const val = parseFloat(actualInput);
    if (!isNaN(val)) {
      onUpdateBillActual(bill.id, item.date, val);
      setIsSavedFeedback(true);
      setTimeout(() => setIsSavedFeedback(false), 2000);
    }
  };

  const getRecurrenceDescription = () => {
    if (!bill) return null;
    if (bill.recurrenceType === 'fixed_day') {
      return `Recurs every month on the ${bill.fixedDay === -1 ? 'last day' : `${bill.fixedDay}th`}`;
    }
    if (bill.recurrenceType === 'relative_day' && bill.relativeRule) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `Recurs on the ${bill.relativeRule.ordinal} ${days[bill.relativeRule.dayOfWeek]} of every month`;
    }
    if (bill.recurrenceType === 'biweekly') {
      return 'Recurs every 2 weeks (bi-weekly)';
    }
    return 'One-time bill';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-[280px]">
              {item.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Date & Type Info */}
          <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-sm">
                {format(parseISO(item.date), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                item.type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : item.type === 'debt'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                  : item.type === 'life_event'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : isFluctuating
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {item.type === 'life_event'
                ? `Life: ${item.layerName}`
                : isFluctuating
                ? 'Fluctuating Bill'
                : item.type}
            </span>
          </div>

          {/* BILL DETAILS */}
          {isBill && bill && (
            <>
              {/* Recurrence Rule Banner */}
              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Recurrence Schedule
                </span>
                <p className="text-white font-medium">
                  {getRecurrenceDescription()}
                </p>
                <div className="text-[11px] text-slate-400">
                  Category: <strong className="text-slate-300">{bill.category}</strong>
                </div>
              </div>

              {/* Fluctuating Bill: Baseline vs Real Actual Amount Editor */}
              {isFluctuating ? (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <Zap className="w-4 h-4" />
                      <span>Fluctuating Utility Bill</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Baseline: <strong className="text-white">${bill.baselineAmount.toFixed(2)}</strong>
                    </span>
                  </div>

                  <form onSubmit={handleSaveActual} className="space-y-2">
                    <label className="block text-[11px] text-amber-200">
                      Real Bill Amount for this Cycle ($):
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2 text-slate-500 font-mono text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={actualInput}
                          onChange={(e) => setActualInput(e.target.value)}
                          className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-slate-900 border border-amber-500/60 text-white font-mono text-sm font-bold focus:border-amber-400 outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Update</span>
                      </button>
                    </div>
                    {isSavedFeedback && (
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Actual amount updated! Cash flow recalculated.</span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400">
                      Plug in the actual invoice amount when it arrives. It will replace the baseline on the calendar and auto-recalculate your cash flow buffer.
                    </p>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                  <span className="text-slate-400">Fixed Cost:</span>
                  <span className="text-lg font-black font-mono text-white">
                    ${bill.baselineAmount.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Paid Status Toggle Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => onTogglePaid(item)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    item.isPaid
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center ${
                      item.isPaid ? 'bg-emerald-500 text-slate-950' : 'border border-slate-500'
                    }`}
                  >
                    {item.isPaid && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>{item.isPaid ? 'Marked as Paid' : 'Mark as Paid'}</span>
                </button>
              </div>
            </>
          )}

          {/* INCOME DETAILS */}
          {item.type === 'income' && (
            <div className="space-y-3">
              <div className="bg-emerald-950/30 p-4 rounded-xl border border-emerald-500/40 text-center">
                <span className="text-xs text-emerald-300 uppercase tracking-wider font-semibold">
                  Income Inflow
                </span>
                <div className="text-3xl font-black font-mono text-emerald-300 mt-1">
                  +${item.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              {item.notes && (
                <div className="p-3 rounded-xl bg-slate-800 text-slate-300">
                  <span className="text-slate-500 text-[10px] block mb-0.5">Notes</span>
                  {item.notes}
                </div>
              )}
            </div>
          )}

          {/* LIFE EVENT DETAILS */}
          {item.type === 'life_event' && (
            <div className="space-y-3">
              <div
                className="p-4 rounded-xl border space-y-2"
                style={{
                  backgroundColor: `${item.color}15`,
                  borderColor: `${item.color}40`,
                }}
              >
                <div className="text-base font-bold" style={{ color: item.color }}>
                  {item.title}
                </div>
                {item.notes && (
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Time: {item.notes}</span>
                  </div>
                )}
                {(item.rawItem as LifeEvent).location && (
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{(item.rawItem as LifeEvent).location}</span>
                  </div>
                )}
                {(item.rawItem as LifeEvent).description && (
                  <p className="text-slate-300 mt-1 italic">
                    {(item.rawItem as LifeEvent).description}
                  </p>
                )}
              </div>
              <div className="text-[11px] text-slate-400 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
                🛡️ This life event belongs to the <strong>{item.layerName}</strong> layer. It is for visual scheduling and does not impact your budget cash flow.
              </div>
            </div>
          )}

          {/* DEBT ITEM DETAILS */}
          {item.type === 'debt' && (
            <div className="space-y-3">
              <div className="bg-pink-950/30 p-4 rounded-xl border border-pink-500/40 text-center">
                <span className="text-xs text-pink-300 uppercase tracking-wider font-semibold">
                  Scheduled Debt Payment
                </span>
                <div className="text-3xl font-black font-mono text-pink-300 mt-1">
                  ${item.amount?.toFixed(2)}
                </div>
                <div className="text-xs text-pink-400 mt-1">{item.notes}</div>
              </div>
            </div>
          )}

          {/* Action buttons (Delete) */}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <button
              onClick={() => {
                if (confirm(`Remove "${item.title}"?`)) {
                  onDeleteItem(item);
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
