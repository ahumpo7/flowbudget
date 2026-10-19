import React, { useState } from 'react';
import { Debt } from '../types';
import { calculateDebtPlan, recalculatePayoffTimeline } from '../utils/dateRules';
import {
  CreditCard,
  TrendingDown,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  Percent,
  Sliders,
  History,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DebtTrackerViewProps {
  debts: Debt[];
  onUpdateDebt: (updated: Debt) => void;
  onAddDebt: (newDebt: Debt) => void;
  onDeleteDebt: (id: string) => void;
}

export const DebtTrackerView: React.FC<DebtTrackerViewProps> = ({
  debts,
  onUpdateDebt,
  onAddDebt,
  onDeleteDebt,
}) => {
  const [selectedDebtId, setSelectedDebtId] = useState<string>(
    debts.length > 0 ? debts[0].id : ''
  );
  const [simulatedPayment, setSimulatedPayment] = useState<number>(250);
  const [showAddForm, setShowAddForm] = useState(false);

  // New debt form state
  const [newDebtName, setNewDebtName] = useState('');
  const [newBalance, setNewBalance] = useState('1000');
  const [newTargetMonths, setNewTargetMonths] = useState('5');
  const [newApr, setNewApr] = useState('0');
  const [newDueDay, setNewDueDay] = useState('20');

  const currentDebt = debts.find((d) => d.id === selectedDebtId) || debts[0];

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(newBalance) || 0;
    const months = parseInt(newTargetMonths) || 1;
    const apr = parseFloat(newApr) || 0;
    const dueDay = parseInt(newDueDay) || 15;

    const plan = calculateDebtPlan(balance, months, apr);

    const created: Debt = {
      id: `debt-${Date.now()}`,
      name: newDebtName.trim() || 'New Debt Account',
      initialBalance: balance,
      currentBalance: balance,
      targetMonths: months,
      apr,
      suggestedPayment: plan.monthlyPayment,
      monthlyPayments: {},
      dueDayOfMonth: dueDay,
      color: '#ec4899',
    };

    onAddDebt(created);
    setSelectedDebtId(created.id);
    setShowAddForm(false);
    setNewDebtName('');
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleTargetMonthsChange = (debt: Debt, newMonths: number) => {
    const plan = calculateDebtPlan(debt.currentBalance, newMonths, debt.apr);
    onUpdateDebt({
      ...debt,
      targetMonths: newMonths,
      suggestedPayment: plan.monthlyPayment,
    });
  };

  const handleLogPayment = (debt: Debt, monthKey: string, amount: number) => {
    const updatedPayments = { ...debt.monthlyPayments, [monthKey]: amount };
    // Recalculate balance
    const totalPaid = Object.values(updatedPayments).reduce((a, b) => a + b, 0);
    const newBal = Math.max(0, debt.initialBalance - totalPaid);

    if (newBal === 0) {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }

    const plan = calculateDebtPlan(newBal, debt.targetMonths, debt.apr);

    onUpdateDebt({
      ...debt,
      currentBalance: newBal,
      monthlyPayments: updatedPayments,
      suggestedPayment: newBal > 0 ? plan.monthlyPayment : 0,
    });
  };

  // Pre-generate months for payment log
  const pastMonths = [
    '2026-08',
    '2026-09',
    '2026-10',
    '2026-11',
    '2026-12',
    '2027-01',
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
                <CreditCard className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Debt Payoff Tracker & Auto-Amortization
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Log your balance and desired payoff timeline. FlowBudget auto-suggests your exact monthly payment,
              synchronizes it to your calendar cash flow, and recalculates dynamically whenever you pay more or less.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-pink-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Debt Account</span>
          </button>
        </div>
      </div>

      {/* Add Debt Form Modal / Card */}
      {showAddForm && (
        <div className="bg-slate-800 border border-pink-500/40 rounded-2xl p-5 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-pink-400" />
            Add New Debt Payoff Plan
          </h3>
          <form onSubmit={handleCreateDebt} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Debt Name / Card
              </label>
              <input
                type="text"
                placeholder="e.g. Visa Credit Card, Car Loan"
                value={newDebtName}
                onChange={(e) => setNewDebtName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-pink-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Balance ($)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="1000"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm font-mono focus:border-pink-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Payoff Months
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={newTargetMonths}
                onChange={(e) => setNewTargetMonths(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm font-mono focus:border-pink-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Interest Rate (APR %)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={newApr}
                onChange={(e) => setNewApr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm font-mono focus:border-pink-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-5 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow"
              >
                Save & Calculate Plan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Debt Tabs if multiple */}
      {debts.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {debts.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDebtId(d.id);
                setSimulatedPayment(Math.round(d.suggestedPayment * 1.25));
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-2 ${
                d.id === (currentDebt?.id || '')
                  ? 'bg-pink-600/20 border-pink-500 text-pink-200 shadow-md'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{d.name}</span>
              <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-slate-900/60 text-pink-300">
                ${d.currentBalance.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Selected Debt Active Detail & Simulator */}
      {currentDebt && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Debt Status & Auto-suggested Payment */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{currentDebt.name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Due on the <strong className="text-pink-300">{currentDebt.dueDayOfMonth}th</strong> of every month</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Remove debt tracker for ${currentDebt.name}?`)) {
                      onDeleteDebt(currentDebt.id);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                  title="Delete debt"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Balances */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider">Initial Balance</span>
                  <div className="text-lg font-black font-mono text-slate-200 mt-0.5">
                    ${currentDebt.initialBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-pink-500/30">
                  <span className="text-[11px] text-pink-400 uppercase tracking-wider font-semibold">Remaining</span>
                  <div className="text-lg font-black font-mono text-pink-300 mt-0.5">
                    ${currentDebt.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>Payoff Progress</span>
                  <span className="font-bold text-pink-300 font-mono">
                    {Math.round(
                      ((currentDebt.initialBalance - currentDebt.currentBalance) /
                        (currentDebt.initialBalance || 1)) *
                        100
                    )}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-rose-400 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          ((currentDebt.initialBalance - currentDebt.currentBalance) /
                            (currentDebt.initialBalance || 1)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Target Months Adjuster */}
              <div className="pt-2 border-t border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Target Payoff Months:
                  </label>
                  <span className="text-sm font-bold text-white font-mono px-2 py-0.5 rounded bg-slate-700">
                    {currentDebt.targetMonths} months
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="36"
                  value={currentDebt.targetMonths}
                  onChange={(e) =>
                    handleTargetMonthsChange(currentDebt, parseInt(e.target.value))
                  }
                  className="w-full accent-pink-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>1 month (aggressive)</span>
                  <span>12 mo</span>
                  <span>36 mo</span>
                </div>
              </div>

              {/* Auto-suggested Monthly Payment Box */}
              <div className="p-4 rounded-xl bg-pink-950/40 border border-pink-500/50 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-300">
                  Auto-Suggested Monthly Payment
                </span>
                <div className="text-3xl font-black font-mono text-pink-200 mt-1">
                  ${currentDebt.suggestedPayment.toFixed(2)}
                  <span className="text-xs font-normal text-pink-400"> / mo</span>
                </div>
                <p className="text-[11px] text-pink-300/80 mt-1">
                  Pays off the entire ${currentDebt.currentBalance.toLocaleString()} balance in exactly {currentDebt.targetMonths} months!
                </p>
              </div>
            </div>
          </div>

          {/* Right Columns: Dynamic Recalculation Simulator & Monthly Log */}
          <div className="lg:col-span-2 space-y-4">
            {/* Dynamic Recalculation Simulator */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Sliders className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-white">
                  Dynamic Recalculation: What If You Pay More or Less?
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Test different monthly amounts below. FlowBudget automatically computes how quickly you’ll become debt-free.
              </p>

              {/* Slider for simulated payment */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Simulate Monthly Payment:
                  </span>
                  <div className="flex items-center gap-1 font-mono text-lg font-bold text-emerald-400">
                    <span>$</span>
                    <input
                      type="number"
                      step="10"
                      min="10"
                      value={simulatedPayment}
                      onChange={(e) => setSimulatedPayment(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-0.5 rounded bg-slate-800 border border-emerald-500/50 text-white text-right"
                    />
                    <span className="text-xs text-slate-400 font-sans">/mo</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="20"
                  max={Math.max(500, Math.round(currentDebt.initialBalance))}
                  step="10"
                  value={simulatedPayment}
                  onChange={(e) => setSimulatedPayment(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />

                {/* Recalculation Result Box */}
                {(() => {
                  const simResult = recalculatePayoffTimeline(
                    currentDebt.currentBalance,
                    simulatedPayment,
                    currentDebt.apr
                  );

                  const diffMonths = currentDebt.targetMonths - simResult.monthsToPayoff;

                  return (
                    <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-400">
                          Timeline with ${simulatedPayment}/mo:
                        </div>
                        <div className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                          <span>Payoff in {simResult.monthsToPayoff} months</span>
                          {diffMonths > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300">
                              🚀 {diffMonths} month{diffMonths === 1 ? '' : 's'} sooner!
                            </span>
                          )}
                          {diffMonths < 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300">
                              ⚠️ {Math.abs(diffMonths)} month{Math.abs(diffMonths) === 1 ? '' : 's'} longer
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onUpdateDebt({
                            ...currentDebt,
                            suggestedPayment: simulatedPayment,
                            targetMonths: simResult.monthsToPayoff,
                          });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow shrink-0"
                      >
                        Apply to Calendar
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Monthly Payment History & Dynamic Balance Tracker */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <History className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Actual Payment Log & Real-Time Recalculation
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Update payments to see remaining debt shrink
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {pastMonths.map((mKey) => {
                  const loggedPayment = currentDebt.monthlyPayments[mKey] ?? '';
                  return (
                    <div
                      key={mKey}
                      className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between"
                    >
                      <div className="text-[11px] font-semibold text-slate-400">
                        {mKey}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-slate-500 font-mono">$</span>
                        <input
                          type="number"
                          placeholder={currentDebt.suggestedPayment.toString()}
                          value={loggedPayment}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            handleLogPayment(
                              currentDebt,
                              mKey,
                              isNaN(val) ? 0 : val
                            );
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:border-pink-500 outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
