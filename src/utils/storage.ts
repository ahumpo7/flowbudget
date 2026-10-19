import { Bill, IncomeSource, Debt, LifeLayer, LifeEvent, UserProfile } from '../types';

export interface AppState {
  initialBalance: number;
  incomes: IncomeSource[];
  bills: Bill[];
  debts: Debt[];
  lifeLayers: LifeLayer[];
  lifeEvents: LifeEvent[];
  lastSyncedAt?: string;
}

const STORAGE_PREFIX = 'flowbudget_userdata_';
const SESSION_KEY = 'flowbudget_active_google_session';
const GOOGLE_CLIENT_ID_KEY = 'flowbudget_google_client_id';

export const DEFAULT_LAYERS: LifeLayer[] = [
  {
    id: 'layer-football',
    name: 'Football Schedule',
    color: '#22c55e', // Green for football
    icon: 'Trophy',
    isVisible: true,
  },
  {
    id: 'layer-colorguard',
    name: 'Color Guard Schedule',
    color: '#a855f7', // Purple for color guard
    icon: 'Flag',
    isVisible: true,
  },
  {
    id: 'layer-family',
    name: 'Family & Life Stuff',
    color: '#38bdf8', // Sky Blue
    icon: 'Calendar',
    isVisible: true,
  },
];

export const EMPTY_USER_DATA: AppState = {
  initialBalance: 0,
  incomes: [],
  bills: [],
  debts: [],
  lifeLayers: DEFAULT_LAYERS,
  lifeEvents: [],
};

export const SAMPLE_DATA: AppState = {
  initialBalance: 3250,
  incomes: [
    {
      id: 'inc-1',
      name: 'Salary (Bi-Weekly)',
      amount: 2450,
      frequency: 'biweekly',
      anchorDate: '2026-10-02',
      isRecurring: true,
      color: '#10b981',
      notes: 'Direct deposit via employer payroll',
    },
    {
      id: 'inc-2',
      name: 'Freelance Design',
      amount: 400,
      frequency: 'one_time',
      anchorDate: '2026-10-21',
      isRecurring: false,
      color: '#06b6d4',
      notes: 'Client invoice paid via stripe',
    },
  ],
  bills: [
    {
      id: 'bill-1',
      name: 'Apartment Rent',
      category: 'Housing',
      isFluctuating: false,
      baselineAmount: 1350,
      recurrenceType: 'fixed_day',
      fixedDay: 1,
      color: '#ef4444',
      notes: 'Due on the 1st of every month via resident portal',
      paidDates: ['2026-10-01'],
    },
    {
      id: 'bill-2',
      name: 'Electric & Power',
      category: 'Utilities',
      isFluctuating: true,
      baselineAmount: 140,
      actualOverrides: {
        '2026-10': 168.50,
      },
      recurrenceType: 'relative_day',
      relativeRule: {
        ordinal: '2nd',
        dayOfWeek: 3,
      },
      color: '#f59e0b',
      notes: 'Fluctuating bill: $140 baseline estimate, actual bill updated to $168.50 for Oct',
      paidDates: ['2026-10-14'],
    },
    {
      id: 'bill-3',
      name: 'Water & City Services',
      category: 'Utilities',
      isFluctuating: true,
      baselineAmount: 75,
      actualOverrides: {},
      recurrenceType: 'relative_day',
      relativeRule: {
        ordinal: '1st',
        dayOfWeek: 4,
      },
      color: '#0284c7',
      notes: 'Fluctuating: baseline $75 pending meter reading',
    },
    {
      id: 'bill-4',
      name: 'High-Speed Fiber Internet',
      category: 'Utilities',
      isFluctuating: false,
      baselineAmount: 70,
      recurrenceType: 'fixed_day',
      fixedDay: 15,
      color: '#8b5cf6',
      notes: 'Fixed auto-pay on the 15th',
      paidDates: ['2026-10-15'],
    },
    {
      id: 'bill-5',
      name: 'Car Insurance (Geico)',
      category: 'Transportation',
      isFluctuating: false,
      baselineAmount: 125,
      recurrenceType: 'fixed_day',
      fixedDay: 18,
      color: '#f97316',
      notes: 'Monthly premium',
    },
    {
      id: 'bill-6',
      name: 'Phone Plan (Verizon)',
      category: 'Utilities',
      isFluctuating: false,
      baselineAmount: 85,
      recurrenceType: 'fixed_day',
      fixedDay: 24,
      color: '#6366f1',
      notes: 'Family unlimited plan',
    },
    {
      id: 'bill-7',
      name: 'Groceries (Bi-Weekly Allocation)',
      category: 'Food',
      isFluctuating: true,
      baselineAmount: 300,
      actualOverrides: {
        '2026-10-02': 285.40,
        '2026-10-16': 312.10,
      },
      recurrenceType: 'biweekly',
      anchorDate: '2026-10-02',
      color: '#14b8a6',
      notes: 'Bi-weekly grocery run synced to payday',
    },
  ],
  debts: [
    {
      id: 'debt-1',
      name: 'Visa Credit Card Payoff',
      initialBalance: 1000,
      currentBalance: 800,
      targetMonths: 5,
      apr: 0,
      suggestedPayment: 200,
      monthlyPayments: {
        '2026-09': 200,
      },
      dueDayOfMonth: 20,
      color: '#ec4899',
      notes: '$1,000 balance over 5 months = auto-suggested $200/month',
    },
  ],
  lifeLayers: DEFAULT_LAYERS,
  lifeEvents: [
    {
      id: 'event-1',
      layerId: 'layer-football',
      title: '🏈 Football Practice',
      date: '2026-10-06',
      time: '17:30',
      endTime: '19:30',
      description: 'Full pads at High School stadium',
      location: 'HS West Field',
    },
    {
      id: 'event-2',
      layerId: 'layer-football',
      title: '🏈 Football Practice',
      date: '2026-10-08',
      time: '17:30',
      endTime: '19:30',
      description: 'Field drills and walkthrough',
      location: 'HS West Field',
    },
    {
      id: 'event-3',
      layerId: 'layer-football',
      title: '🏆 Friday Night Football Game (Home)',
      date: '2026-10-09',
      time: '19:00',
      endTime: '21:30',
      description: 'Home game vs Bulldogs - booster concessions',
      location: 'Memorial Stadium',
    },
    {
      id: 'event-4',
      layerId: 'layer-football',
      title: '🏈 Football Practice',
      date: '2026-10-20',
      time: '17:30',
      endTime: '19:30',
      description: 'Scrimmage practice',
      location: 'HS West Field',
    },
    {
      id: 'event-5',
      layerId: 'layer-football',
      title: '🏆 Friday Football Game (Away)',
      date: '2026-10-23',
      time: '19:00',
      endTime: '21:30',
      description: 'Away game at Oak Ridge',
      location: 'Oak Ridge High',
    },
    {
      id: 'event-6',
      layerId: 'layer-colorguard',
      title: '🚩 Color Guard Sectionals',
      date: '2026-10-05',
      time: '18:00',
      endTime: '20:30',
      description: 'Rifle and sabre drill routine',
      location: 'Aux Gym',
    },
    {
      id: 'event-7',
      layerId: 'layer-colorguard',
      title: '🚩 Color Guard Rehearsal',
      date: '2026-10-12',
      time: '18:00',
      endTime: '20:30',
      description: 'Halftime routine polishing with marching band',
      location: 'Band Field',
    },
    {
      id: 'event-8',
      layerId: 'layer-colorguard',
      title: '🎖️ Regional Color Guard Invitational',
      date: '2026-10-17',
      time: '09:00',
      endTime: '16:00',
      description: 'Regional championship competition performance at 1:15pm',
      location: 'Civic Arena',
    },
    {
      id: 'event-9',
      layerId: 'layer-colorguard',
      title: '🚩 Color Guard Rehearsal',
      date: '2026-10-26',
      time: '18:00',
      endTime: '20:30',
      description: 'State finals routine practice',
      location: 'Band Field',
    },
    {
      id: 'event-10',
      layerId: 'layer-family',
      title: '🦷 Dentist Appointment (Kids)',
      date: '2026-10-13',
      time: '14:00',
      endTime: '15:30',
      description: 'Routine 6-month checkup and cleaning',
      location: 'Pinecrest Dental',
    },
    {
      id: 'event-11',
      layerId: 'layer-family',
      title: '🎂 Sarah Birthday Dinner',
      date: '2026-10-24',
      time: '18:30',
      endTime: '21:00',
      description: 'Family dinner celebration',
      location: 'Luigi Italian Trattoria',
    },
  ],
};

// Returns storage key strictly isolated by user ID
export function getUserStorageKey(userId: string): string {
  // Sanitize user ID to prevent key collision
  const safeId = encodeURIComponent(userId.trim());
  return `${STORAGE_PREFIX}${safeId}`;
}

// Loads financial data strictly for the specified authenticated user
export function loadUserAppState(userId: string): AppState {
  if (!userId) return EMPTY_USER_DATA;
  try {
    const key = getUserStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      // First time this user logs in: initialize their isolated storage
      return EMPTY_USER_DATA;
    }
    const parsed = JSON.parse(raw);
    return {
      ...EMPTY_USER_DATA,
      ...parsed,
    };
  } catch (err) {
    console.error(`Failed to load app state for user ${userId}:`, err);
    return EMPTY_USER_DATA;
  }
}

// Saves financial data strictly for the specified authenticated user
export function saveUserAppState(userId: string, state: AppState): void {
  if (!userId) return;
  try {
    const key = getUserStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (err) {
    console.error(`Failed to save app state for user ${userId}:`, err);
  }
}

// Active session storage
export function getActiveSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveActiveSession(user: UserProfile | null): void {
  try {
    if (!user) {
      localStorage.removeItem(SESSION_KEY);
    } else {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Failed to update active session:', err);
  }
}

export const DEFAULT_GOOGLE_CLIENT_ID = '893837704090-dq409ie08lvr9io6blkgiee7g3pbqgve.apps.googleusercontent.com';

// Google Client ID preference
export function getStoredGoogleClientId(): string {
  try {
    return localStorage.getItem(GOOGLE_CLIENT_ID_KEY) || DEFAULT_GOOGLE_CLIENT_ID;
  } catch {
    return DEFAULT_GOOGLE_CLIENT_ID;
  }
}

export function saveStoredGoogleClientId(clientId: string): void {
  try {
    if (clientId.trim()) {
      localStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId.trim());
    } else {
      localStorage.removeItem(GOOGLE_CLIENT_ID_KEY);
    }
  } catch (err) {
    console.error('Failed to save Google Client ID:', err);
  }
}

// Decodes standard Google Identity Services JWT credential
export function decodeGoogleCredential(credential: string): UserProfile | null {
  try {
    const parts = credential.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(decoded);

    return {
      id: parsed.sub || `google-${Date.now()}`,
      email: parsed.email || 'user@gmail.com',
      name: parsed.name || 'Google User',
      picture: parsed.picture,
      authProvider: 'google',
      lastSyncedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Failed to decode Google JWT credential:', err);
    return null;
  }
}
