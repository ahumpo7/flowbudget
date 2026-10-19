export interface UserProfile {
  id: string; // Google unique subject ID
  email: string;
  name: string;
  picture?: string;
  authProvider: 'google';
  lastSyncedAt?: string;
}

export type RecurrenceType = 
  | 'fixed_day'      // Specific day of month (e.g., 1st, 15th, or -1 for last day)
  | 'relative_day'   // Relative day (e.g., 1st Thursday, 2nd Wednesday)
  | 'biweekly'       // Every 2 weeks from anchor date
  | 'weekly'         // Every week
  | 'one_time';      // One-off bill or income

export type OrdinalWeek = '1st' | '2nd' | '3rd' | '4th' | 'last';

export interface RelativeRule {
  ordinal: OrdinalWeek;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
}

export interface Bill {
  id: string;
  name: string;
  category: string;
  isFluctuating: boolean; // true = electric/utility baseline, false = fixed rent/mortgage
  baselineAmount: number; // baseline or fixed amount
  actualOverrides?: Record<string, number>; // dateKey ('YYYY-MM-DD' or 'YYYY-MM') -> actual amount entered
  recurrenceType: RecurrenceType;
  fixedDay?: number; // 1 to 31, or -1 for last day of month
  relativeRule?: RelativeRule;
  anchorDate?: string; // For biweekly/weekly or start reference (YYYY-MM-DD)
  paidDates?: string[]; // list of dateKey 'YYYY-MM-DD' marked as paid
  notes?: string;
  linkedDebtId?: string;
  color?: string;
}

export type IncomeFrequency = 'biweekly' | 'semimonthly' | 'monthly' | 'weekly' | 'one_time';

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  anchorDate?: string; // For bi-weekly calculation or start date
  semimonthlyDays?: [number, number]; // e.g. [15, -1] for 15th and last day, or [1, 15]
  dayOfMonth?: number; // For monthly
  dayOfWeek?: number; // For weekly
  isRecurring: boolean;
  color?: string;
  notes?: string;
}

export interface Debt {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  targetMonths: number;
  apr: number; // Annual Percentage Rate (e.g. 0 or 18.5)
  suggestedPayment: number;
  monthlyPayments: Record<string, number>; // 'YYYY-MM' -> amount paid
  dueDayOfMonth: number; // Day of month this payment is due on calendar
  color?: string;
  notes?: string;
}

export interface LifeLayer {
  id: string;
  name: string;
  color: string; // e.g., '#22c55e' (green for football), '#a855f7' (purple for color guard)
  icon?: string;
  isVisible: boolean;
}

export interface LifeEvent {
  id: string;
  layerId: string;
  title: string;
  date: string; // 'YYYY-MM-DD'
  time?: string; // '17:00'
  endTime?: string;
  description?: string;
  location?: string;
  recurringDays?: number[]; // Days of week if weekly repeating (optional)
}

export interface CalendarItem {
  id: string;
  type: 'income' | 'bill' | 'debt' | 'life_event';
  title: string;
  date: string; // 'YYYY-MM-DD'
  amount?: number;
  isFluctuating?: boolean;
  isBaseline?: boolean;
  isPaid?: boolean;
  color: string;
  layerName?: string;
  rawItem: Bill | IncomeSource | Debt | LifeEvent;
  notes?: string;
}

export interface PayCycle {
  id: string;
  incomeId: string;
  incomeName: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  payDate: string;
  incomeAmount: number;
  billsDueAmount: number;
  debtDueAmount: number;
  totalExpenses: number;
  netBuffer: number; // income - totalExpenses
  isSurplus: boolean;
  items: CalendarItem[];
}

export interface DayFinancialSummary {
  date: string;
  startingBalance: number;
  endingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  incomes: CalendarItem[];
  bills: CalendarItem[];
  lifeEvents: CalendarItem[];
}
