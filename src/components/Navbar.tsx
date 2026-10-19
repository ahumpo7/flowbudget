import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  CreditCard,
  Plus,
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Download,
  Upload,
  Settings,
  ShieldCheck,
  LogOut,
  Cloud,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { UserProfile } from '../types';

interface NavbarProps {
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  activeView: 'month' | 'paycycles' | 'debt' | 'schedule';
  onViewChange: (view: 'month' | 'paycycles' | 'debt' | 'schedule') => void;
  onOpenAddModal: () => void;
  onToggleLayers: () => void;
  initialBalance: number;
  onUpdateInitialBalance: (balance: number) => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeLayersCount: number;
  totalLayersCount: number;
  user: UserProfile | null;
  onLogout: () => void;
  onSyncGoogle: () => void;
  lastSyncedAt?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  onDateChange,
  activeView,
  onViewChange,
  onOpenAddModal,
  onToggleLayers,
  initialBalance,
  onUpdateInitialBalance,
  onResetData,
  onExportData,
  onImportData,
  activeLayersCount,
  user,
  onLogout,
  onSyncGoogle,
  lastSyncedAt,
}) => {
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [tempBalance, setTempBalance] = useState(initialBalance.toString());
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handlePrevMonth = () => onDateChange(subMonths(currentDate, 1));
  const handleNextMonth = () => onDateChange(addMonths(currentDate, 1));
  const handleToday = () => onDateChange(new Date());

  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(tempBalance);
    if (!isNaN(parsed)) {
      onUpdateInitialBalance(parsed);
    }
    setIsEditingBalance(false);
  };

  const triggerSync = () => {
    setIsSyncing(true);
    onSyncGoogle();
    setTimeout(() => setIsSyncing(false), 800);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow text-white font-black text-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">FlowBudget</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Calendar-First Cash Flow
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Paydays, flexible bills & family schedule harmony
              </p>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60 shadow-inner">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-3 py-1 font-semibold text-sm sm:text-base min-w-[120px] text-center text-slate-100">
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="ml-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            >
              Today
            </button>
          </div>

          {/* Balance & Action Controls */}
          <div className="flex items-center gap-2">
            {/* Starting Balance Display / Editor */}
            <div className="hidden md:flex items-center bg-slate-800/70 border border-slate-700/70 rounded-xl px-3 py-1.5">
              <span className="text-xs text-slate-400 mr-2 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Starting Balance:
              </span>
              {isEditingBalance ? (
                <form onSubmit={handleSaveBalance} className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    className="w-24 px-1.5 py-0.5 text-xs rounded bg-slate-900 border border-emerald-500 text-white font-mono"
                    value={tempBalance}
                    onChange={(e) => setTempBalance(e.target.value)}
                    autoFocus
                    onBlur={handleSaveBalance}
                  />
                  <button type="submit" className="text-xs text-emerald-400 hover:underline font-medium">
                    Save
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setTempBalance(initialBalance.toString());
                    setIsEditingBalance(true);
                  }}
                  className="font-mono font-bold text-sm text-emerald-300 hover:text-emerald-200 hover:underline"
                  title="Click to adjust starting bank balance"
                >
                  ${initialBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </button>
              )}
            </div>

            {/* Life Layers Toggle Button */}
            <button
              onClick={onToggleLayers}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/70 transition-colors text-xs font-medium shadow-sm"
              title="Toggle family schedule layers & calendar filters"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Layers</span>
              <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[10px] font-bold text-purple-300 flex items-center justify-center">
                {activeLayersCount}
              </span>
            </button>

            {/* Add Transaction Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add</span>
            </button>

            {/* Google Sync Button */}
            <button
              onClick={triggerSync}
              className={`p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition-colors ${
                isSyncing ? 'text-emerald-400 rotate-180 transition-transform duration-500' : ''
              }`}
              title="Sync with Google Account"
            >
              <Cloud className="w-4 h-4" />
            </button>

            {/* Google User Avatar / Account Profile */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 transition-colors"
                  title={`Logged in as ${user.email} (Google Account)`}
                >
                  <span className="text-xs font-semibold text-slate-200 hidden lg:inline max-w-[100px] truncate">
                    {user.name}
                  </span>
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-500/50"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl py-3 z-50 text-xs text-slate-200"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div className="px-4 pb-3 border-b border-slate-700/80 space-y-1">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span className="font-bold text-white truncate">{user.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                      <div className="pt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Private Google Vault Active</span>
                      </div>
                    </div>

                    <div className="px-2 pt-2 space-y-1">
                      <button
                        onClick={() => {
                          triggerSync();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-700/80 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Sync Data Now</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {lastSyncedAt ? format(new Date(lastSyncedAt), 'HH:mm') : 'Active'}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          onExportData();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-700/80 rounded-xl flex items-center gap-2"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Export Google Vault Backup</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm('Log out of this Google Account? Your financial data will be immediately locked and cleared from memory.')) {
                            onLogout();
                          }
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-400 rounded-xl flex items-center gap-2 font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out & Lock Vault</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Settings / Data Menu */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                title="Options & Data Backup"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettingsMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-2 z-50 text-xs text-slate-200"
                  onMouseLeave={() => setShowSettingsMenu(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-700/80 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                    Vault Data Options
                  </div>
                  <button
                    onClick={() => {
                      onExportData();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700/80 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export Vault (JSON)</span>
                  </button>
                  <label className="w-full text-left px-3 py-2 hover:bg-slate-700/80 flex items-center gap-2 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Import Backup File</span>
                    <input type="file" accept=".json" onChange={onImportData} className="hidden" />
                  </label>
                  <button
                    onClick={() => {
                      if (confirm('Reset your account data to sample template (includes football, color guard, fluctuating electric bill, and $1,000 debt payoff)?')) {
                        onResetData();
                      }
                      setShowSettingsMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-400 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Load Sample Template</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-1 py-2 border-t border-slate-800/80 overflow-x-auto no-scrollbar text-xs font-medium">
          <button
            onClick={() => onViewChange('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'month'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Month Calendar</span>
          </button>

          <button
            onClick={() => onViewChange('paycycles')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'paycycles'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pay Cycle Cash Flow</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/30 text-emerald-200 font-mono">
              Over/Under
            </span>
          </button>

          <button
            onClick={() => onViewChange('debt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'debt'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-pink-400" />
            <span>Debt Payoff Tracker</span>
          </button>

          <button
            onClick={() => onViewChange('schedule')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'schedule'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Schedule / Agenda</span>
          </button>
        </div>
      </div>
    </header>
  );
};
