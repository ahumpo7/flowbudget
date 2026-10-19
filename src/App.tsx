import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
} from 'date-fns';
import {
  Bill,
  IncomeSource,
  LifeEvent,
  LifeLayer,
  Debt,
  CalendarItem,
  UserProfile,
} from './types';
import {
  getBillOccurrences,
  getIncomeOccurrences,
  getDebtOccurrences,
  getLifeEventOccurrences,
  buildDailySummaries,
  buildPayCycles,
} from './utils/dateRules';
import {
  loadUserAppState,
  saveUserAppState,
  getActiveSession,
  saveActiveSession,
  EMPTY_USER_DATA,
  SAMPLE_DATA,
  AppState,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { CashFlowBanner } from './components/CashFlowBanner';
import { CalendarGrid } from './components/CalendarGrid';
import { PayCycleView } from './components/PayCycleView';
import { DebtTrackerView } from './components/DebtTrackerView';
import { ScheduleView } from './components/ScheduleView';
import { LayersDrawer } from './components/LayersDrawer';
import { AddTransactionModal } from './components/AddTransactionModal';
import { BillDetailModal } from './components/BillDetailModal';
import { GoogleAuthLockScreen } from './components/GoogleAuthLockScreen';
import {
  requestDriveAccessToken,
  loadFromGoogleDrive,
  saveToGoogleDrive,
  isDriveConnected,
  clearDriveAccessToken,
  getDriveAccessToken,
} from './utils/googleDriveSync';

export const App: React.FC = () => {
  // Authentication & Active User Profile
  const [user, setUser] = useState<UserProfile | null>(() => getActiveSession());

  // Per-User Scoped State (Blank canvas if no user or first time user)
  const [appState, setAppState] = useState<AppState>(() => {
    const session = getActiveSession();
    return session ? loadUserAppState(session.id) : EMPTY_USER_DATA;
  });

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [activeView, setActiveView] = useState<'month' | 'paycycles' | 'debt' | 'schedule'>('month');

  // Modals & Panels
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalDefaultDate, setAddModalDefaultDate] = useState<Date>(new Date());
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [isDriveActive, setIsDriveActive] = useState<boolean>(() => isDriveConnected());
  const [isDriveSyncing, setIsDriveSyncing] = useState<boolean>(false);

  // Sync state strictly to this specific user's isolated local storage AND debounced Google Drive
  useEffect(() => {
    if (user && user.id) {
      saveUserAppState(user.id, appState);

      const token = getDriveAccessToken();
      if (token) {
        const timer = setTimeout(async () => {
          try {
            await saveToGoogleDrive(token, appState);
          } catch (err) {
            console.warn('Background Drive save error:', err);
          }
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, appState]);

  // Handle Login: strictly switch to this user's private data
  const handleLogin = (newUser: UserProfile) => {
    saveActiveSession(newUser);
    setUser(newUser);
    // Load this user's isolated data (no data leaks from previous user)
    const existingData = loadUserAppState(newUser.id);
    setAppState(existingData);
  };

  // Handle Login + Initialize with Sample Data (if requested)
  const handleLoginWithSample = (newUser: UserProfile) => {
    saveActiveSession(newUser);
    setUser(newUser);
    const populated = { ...SAMPLE_DATA, lastSyncedAt: new Date().toISOString() };
    saveUserAppState(newUser.id, populated);
    setAppState(populated);
  };

  // Handle Logout: immediately clear financial data and Drive tokens from active memory
  const handleLogout = () => {
    if (user) {
      // Save user state before exit
      saveUserAppState(user.id, appState);
    }
    clearDriveAccessToken();
    setIsDriveActive(false);
    // Wipe active session & memory state
    saveActiveSession(null);
    setUser(null);
    setAppState(EMPTY_USER_DATA);
    setSelectedItem(null);
    setIsLayersOpen(false);
    setIsAddModalOpen(false);
  };

  // Connect Google Drive AppData folder for permanent cross-device sync
  const handleConnectDrive = useCallback(async () => {
    if (!user) return;
    try {
      setIsDriveSyncing(true);
      setSyncToast('Connecting to your Google Drive AppData...');
      const token = await requestDriveAccessToken();
      setIsDriveActive(true);

      // Check if Drive already has a vault file
      const driveVault = await loadFromGoogleDrive(token);
      if (driveVault && Array.isArray(driveVault.bills)) {
        setAppState(driveVault);
        saveUserAppState(user.id, driveVault);
        setSyncToast('Connected! Restored latest budget from your Google Drive.');
      } else {
        // Upload current state to Drive
        await saveToGoogleDrive(token, appState);
        setSyncToast('Connected! Budget permanently backed up to your Google Drive.');
      }
    } catch (err: any) {
      console.error('Google Drive sync error:', err);
      setSyncToast(`Drive note: ${err.message || 'Could not connect'}`);
    } finally {
      setIsDriveSyncing(false);
      setTimeout(() => setSyncToast(null), 4000);
    }
  }, [user, appState]);

  // Sync with Google Account & Drive
  const handleSyncGoogle = useCallback(async () => {
    if (!user) return;
    const nowIso = new Date().toISOString();
    const updatedUser = { ...user, lastSyncedAt: nowIso };
    setUser(updatedUser);
    saveActiveSession(updatedUser);

    setAppState((prev) => {
      const updatedState = { ...prev, lastSyncedAt: nowIso };
      saveUserAppState(user.id, updatedState);
      return updatedState;
    });

    const token = getDriveAccessToken();
    if (token) {
      try {
        setIsDriveSyncing(true);
        await saveToGoogleDrive(token, appState);
        setSyncToast('Saved & Synced to your Google Drive');
      } catch (err: any) {
        setSyncToast('Synced locally. Drive: ' + (err.message || 'Error'));
      } finally {
        setIsDriveSyncing(false);
        setTimeout(() => setSyncToast(null), 3000);
      }
    } else {
      handleConnectDrive();
    }
  }, [user, appState, handleConnectDrive]);

  // Compute Calendar Window Dates
  const { calendarStart, calendarEnd, daysInGrid } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calStart, end: calEnd });
    return {
      calendarStart: calStart,
      calendarEnd: calEnd,
      daysInGrid: days,
    };
  }, [currentDate]);

  // Expand Recurring Items into Calendar Items
  const allCalendarItems = useMemo(() => {
    const items: CalendarItem[] = [];

    // 1. Incomes
    appState.incomes.forEach((inc) => {
      items.push(...getIncomeOccurrences(inc, calendarStart, calendarEnd));
    });

    // 2. Bills
    appState.bills.forEach((bill) => {
      items.push(...getBillOccurrences(bill, calendarStart, calendarEnd));
    });

    // 3. Debts (due payments)
    appState.debts.forEach((debt) => {
      items.push(...getDebtOccurrences(debt, calendarStart, calendarEnd));
    });

    // 4. Life Events (filtered by visible layers)
    items.push(
      ...getLifeEventOccurrences(
        appState.lifeEvents,
        appState.lifeLayers,
        calendarStart,
        calendarEnd
      )
    );

    return items;
  }, [appState, calendarStart, calendarEnd]);

  // Daily Financial Summaries
  const dailySummaries = useMemo(() => {
    return buildDailySummaries(
      daysInGrid,
      allCalendarItems,
      appState.initialBalance
    );
  }, [daysInGrid, allCalendarItems, appState.initialBalance]);

  // Pay Cycles (Payday-to-Payday)
  const payCycles = useMemo(() => {
    return buildPayCycles(allCalendarItems, calendarStart, calendarEnd);
  }, [allCalendarItems, calendarStart, calendarEnd]);

  // Layers Counts
  const activeLayersCount = appState.lifeLayers.filter((l) => l.isVisible).length;
  const totalLayersCount = appState.lifeLayers.length;

  // Handlers: Toggle Paid
  const handleTogglePaid = (item: CalendarItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (item.type !== 'bill') return;

    const bill = item.rawItem as Bill;
    const paidList = bill.paidDates ? [...bill.paidDates] : [];
    const dateIndex = paidList.indexOf(item.date);

    if (dateIndex >= 0) {
      paidList.splice(dateIndex, 1);
    } else {
      paidList.push(item.date);
    }

    setAppState((prev) => ({
      ...prev,
      bills: prev.bills.map((b) =>
        b.id === bill.id ? { ...b, paidDates: paidList } : b
      ),
    }));

    if (selectedItem && selectedItem.id === item.id) {
      setSelectedItem((prev) => (prev ? { ...prev, isPaid: dateIndex < 0 } : null));
    }
  };

  // Handlers: Update Fluctuating Bill Real Actual Amount
  const handleUpdateBillActual = (
    billId: string,
    dateKey: string,
    actualAmount: number
  ) => {
    const monthKey = dateKey.substring(0, 7);
    setAppState((prev) => ({
      ...prev,
      bills: prev.bills.map((b) => {
        if (b.id !== billId) return b;
        return {
          ...b,
          actualOverrides: {
            ...(b.actualOverrides || {}),
            [monthKey]: actualAmount,
            [dateKey]: actualAmount,
          },
        };
      }),
    }));

    if (selectedItem && selectedItem.rawItem.id === billId) {
      setSelectedItem((prev) =>
        prev
          ? {
              ...prev,
              amount: actualAmount,
              isBaseline: false,
            }
          : null
      );
    }
  };

  // Handlers: Delete Item
  const handleDeleteItem = (item: CalendarItem) => {
    if (item.type === 'bill') {
      setAppState((prev) => ({
        ...prev,
        bills: prev.bills.filter((b) => b.id !== item.rawItem.id),
      }));
    } else if (item.type === 'income') {
      setAppState((prev) => ({
        ...prev,
        incomes: prev.incomes.filter((i) => i.id !== item.rawItem.id),
      }));
    } else if (item.type === 'life_event') {
      setAppState((prev) => ({
        ...prev,
        lifeEvents: prev.lifeEvents.filter((e) => e.id !== item.id),
      }));
    } else if (item.type === 'debt') {
      setAppState((prev) => ({
        ...prev,
        debts: prev.debts.filter((d) => d.id !== item.rawItem.id),
      }));
    }
    setSelectedItem(null);
  };

  // Quick Add for specific date
  const handleQuickAddForDate = (date: Date) => {
    setAddModalDefaultDate(date);
    setIsAddModalOpen(true);
  };

  // Handlers: Add items
  const handleAddBill = (newBill: Bill) => {
    setAppState((prev) => ({
      ...prev,
      bills: [...prev.bills, newBill],
    }));
  };

  const handleAddIncome = (newIncome: IncomeSource) => {
    setAppState((prev) => ({
      ...prev,
      incomes: [...prev.incomes, newIncome],
    }));
  };

  const handleAddLifeEvent = (newEvent: LifeEvent) => {
    setAppState((prev) => ({
      ...prev,
      lifeEvents: [...prev.lifeEvents, newEvent],
    }));
  };

  const handleAddDebt = (newDebt: Debt) => {
    setAppState((prev) => ({
      ...prev,
      debts: [...prev.debts, newDebt],
    }));
  };

  const handleUpdateDebt = (updated: Debt) => {
    setAppState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => (d.id === updated.id ? updated : d)),
    }));
  };

  const handleDeleteDebt = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
    }));
  };

  // Handlers: Layers
  const handleToggleLayer = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      lifeLayers: prev.lifeLayers.map((l) =>
        l.id === id ? { ...l, isVisible: !l.isVisible } : l
      ),
    }));
  };

  const handleAddLayer = (newLayer: LifeLayer) => {
    setAppState((prev) => ({
      ...prev,
      lifeLayers: [...prev.lifeLayers, newLayer],
    }));
  };

  const handleDeleteLayer = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      lifeLayers: prev.lifeLayers.filter((l) => l.id !== id),
      lifeEvents: prev.lifeEvents.filter((e) => e.layerId !== id),
    }));
  };

  const handleUpdateLayerColor = (id: string, color: string) => {
    setAppState((prev) => ({
      ...prev,
      lifeLayers: prev.lifeLayers.map((l) =>
        l.id === id ? { ...l, color } : l
      ),
    }));
  };

  const handleShowAllLayers = () => {
    setAppState((prev) => ({
      ...prev,
      lifeLayers: prev.lifeLayers.map((l) => ({ ...l, isVisible: true })),
    }));
  };

  const handleHideAllLayers = () => {
    setAppState((prev) => ({
      ...prev,
      lifeLayers: prev.lifeLayers.map((l) => ({ ...l, isVisible: false })),
    }));
  };

  // Handlers: Export / Import / Reset for this user
  const handleExportData = () => {
    if (!user) return;
    const backupPayload = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      exportedAt: new Date().toISOString(),
      vault: appState,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `flowbudget-google-vault-${user.email}-${format(new Date(), 'yyyy-MM-dd')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          // Handle both raw AppState and wrapped backup payload
          const vault = parsed.vault ? parsed.vault : parsed;
          if (vault && typeof vault === 'object') {
            setAppState(vault);
            alert('Vault successfully restored into your Google Account!');
          }
        } catch (err) {
          alert('Failed to parse backup file. Please ensure it is valid JSON.');
        }
      };
    }
  };

  const handleResetData = () => {
    setAppState({ ...SAMPLE_DATA, lastSyncedAt: new Date().toISOString() });
  };

  // If not authenticated, render Google Auth Lock Screen
  if (!user) {
    return (
      <GoogleAuthLockScreen
        onLogin={handleLogin}
        onLoadSampleForUser={handleLoginWithSample}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#fff"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
          <span>{syncToast}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenAddModal={() => {
          setAddModalDefaultDate(new Date());
          setIsAddModalOpen(true);
        }}
        onToggleLayers={() => setIsLayersOpen(true)}
        initialBalance={appState.initialBalance}
        onUpdateInitialBalance={(val) =>
          setAppState((prev) => ({ ...prev, initialBalance: val }))
        }
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
        activeLayersCount={activeLayersCount}
        totalLayersCount={totalLayersCount}
        user={user}
        onLogout={handleLogout}
        onSyncGoogle={handleSyncGoogle}
        lastSyncedAt={user.lastSyncedAt || appState.lastSyncedAt}
        isDriveActive={isDriveActive}
        onConnectDrive={handleConnectDrive}
      />

      {/* Cash Flow Summary Metrics Banner */}
      <CashFlowBanner
        currentDate={currentDate}
        calendarItems={allCalendarItems}
        dailySummaries={dailySummaries}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col pb-20 md:pb-6">
        {activeView === 'month' && (
          <CalendarGrid
            currentDate={currentDate}
            calendarItems={allCalendarItems}
            dailySummaries={dailySummaries}
            onSelectDay={handleQuickAddForDate}
            onSelectItem={setSelectedItem}
            onTogglePaid={handleTogglePaid}
            onQuickAddForDate={handleQuickAddForDate}
          />
        )}

        {activeView === 'paycycles' && (
          <PayCycleView
            payCycles={payCycles}
            onSelectItem={setSelectedItem}
            onTogglePaid={handleTogglePaid}
            onOpenAddModal={() => {
              setAddModalDefaultDate(new Date());
              setIsAddModalOpen(true);
            }}
          />
        )}

        {activeView === 'debt' && (
          <DebtTrackerView
            debts={appState.debts}
            onUpdateDebt={handleUpdateDebt}
            onAddDebt={handleAddDebt}
            onDeleteDebt={handleDeleteDebt}
          />
        )}

        {activeView === 'schedule' && (
          <ScheduleView
            calendarItems={allCalendarItems}
            onSelectItem={setSelectedItem}
            onTogglePaid={handleTogglePaid}
            onOpenAddModal={() => {
              setAddModalDefaultDate(new Date());
              setIsAddModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Layers Drawer (Life Schedule Toggles & Color Coding) */}
      <LayersDrawer
        isOpen={isLayersOpen}
        onClose={() => setIsLayersOpen(false)}
        layers={appState.lifeLayers}
        onToggleLayer={handleToggleLayer}
        onAddLayer={handleAddLayer}
        onDeleteLayer={handleDeleteLayer}
        onUpdateLayerColor={handleUpdateLayerColor}
        onShowAllLayers={handleShowAllLayers}
        onHideAllLayers={handleHideAllLayers}
      />

      {/* Add Transaction / Event Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultDate={addModalDefaultDate}
        lifeLayers={appState.lifeLayers}
        onAddBill={handleAddBill}
        onAddIncome={handleAddIncome}
        onAddLifeEvent={handleAddLifeEvent}
        onAddDebt={handleAddDebt}
      />

      {/* Bill & Item Detail Modal */}
      <BillDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdateBillActual={handleUpdateBillActual}
        onTogglePaid={handleTogglePaid}
        onDeleteItem={handleDeleteItem}
      />
    </div>
  );
};

export default App;
