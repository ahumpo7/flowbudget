import React, { useState } from 'react';
import {
  Bill,
  IncomeSource,
  LifeEvent,
  LifeLayer,
  Debt,
  OrdinalWeek,
  RecurrenceType,
  IncomeFrequency,
} from '../types';
import { calculateDebtPlan } from '../utils/dateRules';
import { format } from 'date-fns';
import {
  X,
  Plus,
  Receipt,
  DollarSign,
  Calendar,
  CreditCard,
  Zap,
  Clock,
  MapPin,
  Check,
} from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
  lifeLayers: LifeLayer[];
  onAddBill: (bill: Bill) => void;
  onAddIncome: (income: IncomeSource) => void;
  onAddLifeEvent: (event: LifeEvent) => void;
  onAddDebt: (debt: Debt) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultDate = new Date(),
  lifeLayers,
  onAddBill,
  onAddIncome,
  onAddLifeEvent,
  onAddDebt,
}) => {
  const [activeTab, setActiveTab] = useState<'bill' | 'income' | 'life' | 'debt'>('bill');

  // Format default date string
  const defaultDateStr = format(defaultDate, 'yyyy-MM-dd');

  // Bill Form State
  const [billName, setBillName] = useState('');
  const [billCategory, setBillCategory] = useState('Utilities');
  const [billAmount, setBillAmount] = useState('');
  const [isFluctuating, setIsFluctuating] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('fixed_day');
  const [fixedDay, setFixedDay] = useState('1');
  const [relativeOrdinal, setRelativeOrdinal] = useState<OrdinalWeek>('1st');
  const [relativeDayOfWeek, setRelativeDayOfWeek] = useState(3); // Wednesday
  const [billAnchorDate, setBillAnchorDate] = useState(defaultDateStr);
  const [billNotes, setBillNotes] = useState('');

  // Income Form State
  const [incomeName, setIncomeName] = useState('Paycheck');
  const [incomeAmount, setIncomeAmount] = useState('2400');
  const [incomeFrequency, setIncomeFrequency] = useState<IncomeFrequency>('biweekly');
  const [incomeAnchorDate, setIncomeAnchorDate] = useState(defaultDateStr);
  const [isRecurringIncome, setIsRecurringIncome] = useState(true);
  const [incomeDayOfMonth, setIncomeDayOfMonth] = useState('1');

  // Life Event Form State
  const [lifeTitle, setLifeTitle] = useState('');
  const [lifeLayerId, setLifeLayerId] = useState(lifeLayers[0]?.id || '');
  const [lifeDate, setLifeDate] = useState(defaultDateStr);
  const [lifeTime, setLifeTime] = useState('18:00');
  const [lifeEndTime, setLifeEndTime] = useState('20:00');
  const [lifeLocation, setLifeLocation] = useState('');
  const [lifeDescription, setLifeDescription] = useState('');

  // Debt Form State
  const [debtName, setDebtName] = useState('');
  const [debtBalance, setDebtBalance] = useState('1000');
  const [debtMonths, setDebtMonths] = useState('5');
  const [debtApr, setDebtApr] = useState('0');
  const [debtDueDay, setDebtDueDay] = useState('15');

  if (!isOpen) return null;

  const handleSubmitBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(billAmount) || 0;

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      name: billName.trim() || 'New Bill',
      category: billCategory,
      isFluctuating,
      baselineAmount: amount,
      actualOverrides: {},
      recurrenceType,
      fixedDay: recurrenceType === 'fixed_day' ? parseInt(fixedDay) : undefined,
      relativeRule:
        recurrenceType === 'relative_day'
          ? {
              ordinal: relativeOrdinal,
              dayOfWeek: Number(relativeDayOfWeek),
            }
          : undefined,
      anchorDate:
        recurrenceType === 'biweekly' || recurrenceType === 'one_time'
          ? billAnchorDate
          : undefined,
      notes: billNotes.trim() || undefined,
      paidDates: [],
      color: isFluctuating ? '#f59e0b' : '#ef4444',
    };

    onAddBill(newBill);
    onClose();
  };

  const handleSubmitIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(incomeAmount) || 0;

    const newIncome: IncomeSource = {
      id: `inc-${Date.now()}`,
      name: incomeName.trim() || 'Income',
      amount,
      frequency: incomeFrequency,
      anchorDate: incomeAnchorDate,
      dayOfMonth: incomeFrequency === 'monthly' ? parseInt(incomeDayOfMonth) : undefined,
      semimonthlyDays: incomeFrequency === 'semimonthly' ? [15, -1] : undefined,
      isRecurring: isRecurringIncome,
      color: '#10b981',
    };

    onAddIncome(newIncome);
    onClose();
  };

  const handleSubmitLifeEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lifeTitle.trim()) return;

    const newEvent: LifeEvent = {
      id: `event-${Date.now()}`,
      layerId: lifeLayerId || lifeLayers[0]?.id || 'default',
      title: lifeTitle.trim(),
      date: lifeDate,
      time: lifeTime || undefined,
      endTime: lifeEndTime || undefined,
      location: lifeLocation.trim() || undefined,
      description: lifeDescription.trim() || undefined,
    };

    onAddLifeEvent(newEvent);
    onClose();
  };

  const handleSubmitDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(debtBalance) || 0;
    const months = parseInt(debtMonths) || 1;
    const apr = parseFloat(debtApr) || 0;
    const dueDay = parseInt(debtDueDay) || 15;

    const plan = calculateDebtPlan(balance, months, apr);

    const newDebt: Debt = {
      id: `debt-${Date.now()}`,
      name: debtName.trim() || 'Debt Account',
      initialBalance: balance,
      currentBalance: balance,
      targetMonths: months,
      apr,
      suggestedPayment: plan.monthlyPayment,
      monthlyPayments: {},
      dueDayOfMonth: dueDay,
      color: '#ec4899',
    };

    onAddDebt(newDebt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Plus className="w-5 h-5" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Add to Calendar & Cash Flow
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-4 bg-slate-800/80 p-1 border-b border-slate-800 text-xs font-bold text-center">
          <button
            onClick={() => setActiveTab('bill')}
            className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'bill'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Bill</span>
          </button>

          <button
            onClick={() => setActiveTab('income')}
            className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'income'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Income</span>
          </button>

          <button
            onClick={() => setActiveTab('life')}
            className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'life'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Life Event</span>
          </button>

          <button
            onClick={() => setActiveTab('debt')}
            className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'debt'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Debt</span>
          </button>
        </div>

        {/* Tab 1: ADD BILL */}
        {activeTab === 'bill' && (
          <form onSubmit={handleSubmitBill} className="p-4 sm:p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Bill Name</label>
                <input
                  type="text"
                  placeholder="e.g. Electric Power, Rent, Gym"
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <select
                  value={billCategory}
                  onChange={(e) => setBillCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-rose-500 outline-none"
                >
                  <option value="Housing">Housing (Rent/Mortgage)</option>
                  <option value="Utilities">Utilities (Electric, Water, Gas)</option>
                  <option value="Food">Food & Groceries</option>
                  <option value="Transportation">Transportation & Auto</option>
                  <option value="Insurance">Insurance & Health</option>
                  <option value="Subscriptions">Subscriptions & Streaming</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>
            </div>

            {/* Fixed vs Fluctuating Toggle */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <span className="block text-slate-300 font-semibold">Bill Type</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsFluctuating(false)}
                  className={`py-2 px-3 rounded-lg text-left border flex items-center justify-between ${
                    !isFluctuating
                      ? 'bg-rose-500/20 border-rose-500/60 text-rose-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="font-bold">Fixed Cost</div>
                    <div className="text-[10px] text-slate-400">Exact same every month</div>
                  </div>
                  {!isFluctuating && <Check className="w-4 h-4 text-rose-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsFluctuating(true)}
                  className={`py-2 px-3 rounded-lg text-left border flex items-center justify-between ${
                    isFluctuating
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="font-bold">Fluctuating Bill</div>
                    <div className="text-[10px] text-slate-400">Baseline + actual later</div>
                  </div>
                  {isFluctuating && <Check className="w-4 h-4 text-amber-400" />}
                </button>
              </div>
            </div>

            {/* Amount / Baseline */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isFluctuating ? 'Baseline Estimate Amount ($)' : 'Fixed Monthly Amount ($)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="150.00"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  required
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:border-rose-500 outline-none"
                />
              </div>
              {isFluctuating && (
                <p className="text-[11px] text-amber-300/80 mt-1">
                  💡 This baseline will show on your calendar until the real bill arrives, which you can update anytime with 1 click.
                </p>
              )}
            </div>

            {/* Recurrence Rule */}
            <div className="space-y-2">
              <label className="block text-slate-300 font-semibold">Recurrence Schedule</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRecurrenceType('fixed_day')}
                  className={`p-2 rounded-lg border text-center ${
                    recurrenceType === 'fixed_day'
                      ? 'bg-slate-700 border-rose-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Set Date (1st, 15th)
                </button>

                <button
                  type="button"
                  onClick={() => setRecurrenceType('relative_day')}
                  className={`p-2 rounded-lg border text-center ${
                    recurrenceType === 'relative_day'
                      ? 'bg-slate-700 border-rose-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Relative (1st Thu, 2nd Wed)
                </button>

                <button
                  type="button"
                  onClick={() => setRecurrenceType('biweekly')}
                  className={`p-2 rounded-lg border text-center ${
                    recurrenceType === 'biweekly'
                      ? 'bg-slate-700 border-rose-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Bi-Weekly / Payday
                </button>
              </div>

              {/* Specific rule inputs */}
              {recurrenceType === 'fixed_day' && (
                <div className="pt-1">
                  <label className="block text-slate-400 text-[11px] mb-1">Day of Month</label>
                  <select
                    value={fixedDay}
                    onChange={(e) => setFixedDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                        {d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of month
                      </option>
                    ))}
                    <option value="-1">Last day of month</option>
                  </select>
                </div>
              )}

              {recurrenceType === 'relative_day' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Occurrence</label>
                    <select
                      value={relativeOrdinal}
                      onChange={(e) => setRelativeOrdinal(e.target.value as OrdinalWeek)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value="1st">1st</option>
                      <option value="2nd">2nd</option>
                      <option value="3rd">3rd</option>
                      <option value="4th">4th</option>
                      <option value="last">Last</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Day of Week</label>
                    <select
                      value={relativeDayOfWeek}
                      onChange={(e) => setRelativeDayOfWeek(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value={0}>Sunday</option>
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                    </select>
                  </div>
                </div>
              )}

              {recurrenceType === 'biweekly' && (
                <div className="pt-1">
                  <label className="block text-slate-400 text-[11px] mb-1">
                    Anchor Reference Date (occurs every 14 days)
                  </label>
                  <input
                    type="date"
                    value={billAnchorDate}
                    onChange={(e) => setBillAnchorDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg"
              >
                Save Bill
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: ADD INCOME */}
        {activeTab === 'income' && (
          <form onSubmit={handleSubmitIncome} className="p-4 sm:p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Income Label</label>
                <input
                  type="text"
                  placeholder="e.g. Salary, Side Gig, Bonus"
                  value={incomeName}
                  onChange={(e) => setIncomeName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2400.00"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                    required
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Recurring vs One-time */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <span className="block text-slate-300 font-semibold">Frequency & Type</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecurringIncome(true)}
                  className={`py-2 px-3 rounded-lg text-left border flex items-center justify-between ${
                    isRecurringIncome
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="font-bold">Recurring Payday</div>
                    <div className="text-[10px] text-slate-400">Regular salary / pay cycle</div>
                  </div>
                  {isRecurringIncome && <Check className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRecurringIncome(false);
                    setIncomeFrequency('one_time');
                  }}
                  className={`py-2 px-3 rounded-lg text-left border flex items-center justify-between ${
                    !isRecurringIncome
                      ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="font-bold">Manual Log / One-Off</div>
                    <div className="text-[10px] text-slate-400">Bonus, freelance, tips</div>
                  </div>
                  {!isRecurringIncome && <Check className="w-4 h-4 text-cyan-400" />}
                </button>
              </div>

              {isRecurringIncome && (
                <div className="pt-2">
                  <label className="block text-slate-400 text-[11px] mb-1">Pay Frequency</label>
                  <select
                    value={incomeFrequency}
                    onChange={(e) => setIncomeFrequency(e.target.value as IncomeFrequency)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="biweekly">Bi-Weekly (Every 2 weeks, e.g. every other Friday)</option>
                    <option value="semimonthly">Semi-Monthly (15th & Last day of month)</option>
                    <option value="monthly">Monthly (e.g. 1st of month)</option>
                    <option value="weekly">Weekly (Every week)</option>
                  </select>
                </div>
              )}

              <div className="pt-1">
                <label className="block text-slate-400 text-[11px] mb-1">
                  {isRecurringIncome ? 'Next / Anchor Pay Date' : 'Deposit Date'}
                </label>
                <input
                  type="date"
                  value={incomeAnchorDate}
                  onChange={(e) => setIncomeAnchorDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg"
              >
                Save Income
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: ADD LIFE EVENT (FAMILY LAYER) */}
        {activeTab === 'life' && (
          <form onSubmit={handleSubmitLifeEvent} className="p-4 sm:p-5 space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-[11px]">
              ✨ <strong>Life & Family Layer:</strong> This event appears with its layer color on the calendar to see life alongside finances, but has <strong>zero effect</strong> on your budget math!
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Event Title</label>
              <input
                type="text"
                placeholder="e.g. 🏈 Football Game, 🚩 Color Guard Competition, Birthday Party"
                value={lifeTitle}
                onChange={(e) => setLifeTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-purple-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Schedule Layer</label>
                <select
                  value={lifeLayerId}
                  onChange={(e) => setLifeLayerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-purple-500 outline-none"
                >
                  {lifeLayers.map((layer) => (
                    <option key={layer.id} value={layer.id}>
                      {layer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={lifeDate}
                  onChange={(e) => setLifeDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Start Time</label>
                <input
                  type="time"
                  value={lifeTime}
                  onChange={(e) => setLifeTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">End Time</label>
                <input
                  type="time"
                  value={lifeEndTime}
                  onChange={(e) => setLifeEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Location / Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. High School Stadium, Aux Gym"
                value={lifeLocation}
                onChange={(e) => setLifeLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg"
              >
                Save Life Event
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: ADD DEBT */}
        {activeTab === 'debt' && (
          <form onSubmit={handleSubmitDebt} className="p-4 sm:p-5 space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Debt / Credit Account</label>
              <input
                type="text"
                placeholder="e.g. Visa Credit Card, Car Loan"
                value={debtName}
                onChange={(e) => setDebtName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-pink-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Total Balance ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="1000"
                  value={debtBalance}
                  onChange={(e) => setDebtBalance(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Payoff Months</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  placeholder="5"
                  value={debtMonths}
                  onChange={(e) => setDebtMonths(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Interest Rate (APR %)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  value={debtApr}
                  onChange={(e) => setDebtApr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Calendar Due Day of Month</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="20"
                  value={debtDueDay}
                  onChange={(e) => setDebtDueDay(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            {/* Auto-suggest preview */}
            {(() => {
              const b = parseFloat(debtBalance) || 0;
              const m = parseInt(debtMonths) || 1;
              const apr = parseFloat(debtApr) || 0;
              const plan = calculateDebtPlan(b, m, apr);
              return (
                <div className="p-3 rounded-xl bg-pink-950/30 border border-pink-500/40 text-center">
                  <span className="text-[11px] text-pink-300 uppercase tracking-wider font-semibold">
                    Auto-Suggested Monthly Payment
                  </span>
                  <div className="text-xl font-bold font-mono text-pink-200 mt-0.5">
                    ${plan.monthlyPayment.toFixed(2)} / month
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold shadow-lg"
              >
                Create Debt Plan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
