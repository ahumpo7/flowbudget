import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  getDay,
  getDate,
  addDays,
  differenceInCalendarDays,
  parseISO,
  isSameDay,
  isAfter,
  isBefore,
  addMonths,
} from 'date-fns';
import {
  Bill,
  IncomeSource,
  Debt,
  LifeEvent,
  LifeLayer,
  CalendarItem,
  PayCycle,
  DayFinancialSummary,
  OrdinalWeek,
} from '../types';

/**
 * Returns the exact date of a relative day in a month (e.g., "1st Thursday", "2nd Wednesday", "last Friday")
 */
export function getRelativeDayOfMonth(
  year: number,
  month: number, // 0-indexed (0 = Jan, 11 = Dec)
  ordinal: OrdinalWeek,
  targetDayOfWeek: number // 0 = Sun, 1 = Mon, ... 6 = Sat
): Date {
  const monthStart = new Date(year, month, 1);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Find all dates in the month matching the day of week
  const matchingDays = daysInMonth.filter((d) => getDay(d) === targetDayOfWeek);

  if (matchingDays.length === 0) return monthStart;

  switch (ordinal) {
    case '1st':
      return matchingDays[0];
    case '2nd':
      return matchingDays[1] || matchingDays[0];
    case '3rd':
      return matchingDays[2] || matchingDays[matchingDays.length - 1];
    case '4th':
      return matchingDays[3] || matchingDays[matchingDays.length - 1];
    case 'last':
      return matchingDays[matchingDays.length - 1];
    default:
      return matchingDays[0];
  }
}

/**
 * Generates all occurrences of a Bill within a date range [rangeStart, rangeEnd]
 */
export function getBillOccurrences(
  bill: Bill,
  rangeStart: Date,
  rangeEnd: Date
): CalendarItem[] {
  const items: CalendarItem[] = [];
  const startYear = rangeStart.getFullYear();
  const endYear = rangeEnd.getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1);
      if (isAfter(monthDate, rangeEnd) && !isSameDay(monthDate, rangeEnd)) {
        continue;
      }
      if (isBefore(endOfMonth(monthDate), rangeStart) && !isSameDay(endOfMonth(monthDate), rangeStart)) {
        continue;
      }

      let occurrenceDate: Date | null = null;

      if (bill.recurrenceType === 'fixed_day') {
        const lastDay = getDate(endOfMonth(monthDate));
        const targetDay = bill.fixedDay === -1 ? lastDay : Math.min(bill.fixedDay || 1, lastDay);
        occurrenceDate = new Date(year, month, targetDay);
      } else if (bill.recurrenceType === 'relative_day' && bill.relativeRule) {
        occurrenceDate = getRelativeDayOfMonth(
          year,
          month,
          bill.relativeRule.ordinal,
          bill.relativeRule.dayOfWeek
        );
      } else if (bill.recurrenceType === 'one_time' && bill.anchorDate) {
        const parsed = parseISO(bill.anchorDate);
        if (parsed.getFullYear() === year && parsed.getMonth() === month) {
          occurrenceDate = parsed;
        }
      }

      if (
        occurrenceDate &&
        (isAfter(occurrenceDate, rangeStart) || isSameDay(occurrenceDate, rangeStart)) &&
        (isBefore(occurrenceDate, rangeEnd) || isSameDay(occurrenceDate, rangeEnd))
      ) {
        const dateKey = format(occurrenceDate, 'yyyy-MM-dd');
        const monthKey = format(occurrenceDate, 'yyyy-MM');
        
        // Determine amount: check for actual override
        const overrideAmount = bill.actualOverrides?.[dateKey] ?? bill.actualOverrides?.[monthKey];
        const isActualPresent = overrideAmount !== undefined && overrideAmount !== null;
        const amount = isActualPresent ? overrideAmount : bill.baselineAmount;

        const isPaid = bill.paidDates?.includes(dateKey) || false;

        items.push({
          id: `${bill.id}-${dateKey}`,
          type: 'bill',
          title: bill.name,
          date: dateKey,
          amount,
          isFluctuating: bill.isFluctuating,
          isBaseline: bill.isFluctuating && !isActualPresent,
          isPaid,
          color: bill.color || '#f43f5e',
          rawItem: bill,
          notes: bill.notes,
        });
      }
    }
  }

  // Handle biweekly bills if any
  if (bill.recurrenceType === 'biweekly' && bill.anchorDate) {
    const anchor = parseISO(bill.anchorDate);
    let curr = anchor;
    // Step backwards if anchor is after rangeStart
    while (isAfter(curr, rangeStart)) {
      curr = addDays(curr, -14);
    }
    // Step forward
    while (isBefore(curr, rangeEnd) || isSameDay(curr, rangeEnd)) {
      if (isAfter(curr, rangeStart) || isSameDay(curr, rangeStart)) {
        const dateKey = format(curr, 'yyyy-MM-dd');
        const monthKey = format(curr, 'yyyy-MM');
        const overrideAmount = bill.actualOverrides?.[dateKey] ?? bill.actualOverrides?.[monthKey];
        const isActualPresent = overrideAmount !== undefined && overrideAmount !== null;
        const amount = isActualPresent ? overrideAmount : bill.baselineAmount;
        const isPaid = bill.paidDates?.includes(dateKey) || false;

        items.push({
          id: `${bill.id}-${dateKey}`,
          type: 'bill',
          title: bill.name,
          date: dateKey,
          amount,
          isFluctuating: bill.isFluctuating,
          isBaseline: bill.isFluctuating && !isActualPresent,
          isPaid,
          color: bill.color || '#f43f5e',
          rawItem: bill,
          notes: bill.notes,
        });
      }
      curr = addDays(curr, 14);
    }
  }

  return items;
}

/**
 * Generates all occurrences of an IncomeSource within a date range [rangeStart, rangeEnd]
 */
export function getIncomeOccurrences(
  income: IncomeSource,
  rangeStart: Date,
  rangeEnd: Date
): CalendarItem[] {
  const items: CalendarItem[] = [];

  if (!income.isRecurring || income.frequency === 'one_time') {
    if (income.anchorDate) {
      const parsed = parseISO(income.anchorDate);
      if (
        (isAfter(parsed, rangeStart) || isSameDay(parsed, rangeStart)) &&
        (isBefore(parsed, rangeEnd) || isSameDay(parsed, rangeEnd))
      ) {
        items.push({
          id: `${income.id}-${income.anchorDate}`,
          type: 'income',
          title: income.name,
          date: income.anchorDate,
          amount: income.amount,
          color: income.color || '#10b981',
          rawItem: income,
          notes: income.notes,
        });
      }
    }
    return items;
  }

  // Biweekly frequency (common for salary / paychecks)
  if (income.frequency === 'biweekly' && income.anchorDate) {
    const anchor = parseISO(income.anchorDate);
    let curr = anchor;
    // Align backwards to before rangeStart
    while (isAfter(curr, rangeStart)) {
      curr = addDays(curr, -14);
    }
    // Walk forward
    while (isBefore(curr, rangeEnd) || isSameDay(curr, rangeEnd)) {
      if (isAfter(curr, rangeStart) || isSameDay(curr, rangeStart)) {
        const dateKey = format(curr, 'yyyy-MM-dd');
        items.push({
          id: `${income.id}-${dateKey}`,
          type: 'income',
          title: income.name,
          date: dateKey,
          amount: income.amount,
          color: income.color || '#10b981',
          rawItem: income,
          notes: income.notes,
        });
      }
      curr = addDays(curr, 14);
    }
    return items;
  }

  // Weekly frequency
  if (income.frequency === 'weekly' && income.anchorDate) {
    const anchor = parseISO(income.anchorDate);
    let curr = anchor;
    while (isAfter(curr, rangeStart)) {
      curr = addDays(curr, -7);
    }
    while (isBefore(curr, rangeEnd) || isSameDay(curr, rangeEnd)) {
      if (isAfter(curr, rangeStart) || isSameDay(curr, rangeStart)) {
        const dateKey = format(curr, 'yyyy-MM-dd');
        items.push({
          id: `${income.id}-${dateKey}`,
          type: 'income',
          title: income.name,
          date: dateKey,
          amount: income.amount,
          color: income.color || '#10b981',
          rawItem: income,
          notes: income.notes,
        });
      }
      curr = addDays(curr, 7);
    }
    return items;
  }

  // Monthly and Semimonthly
  const startYear = rangeStart.getFullYear();
  const endYear = rangeEnd.getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const lastDay = getDate(endOfMonth(monthStart));

      if (income.frequency === 'monthly') {
        const day = Math.min(income.dayOfMonth || 1, lastDay);
        const occurrence = new Date(year, month, day);
        if (
          (isAfter(occurrence, rangeStart) || isSameDay(occurrence, rangeStart)) &&
          (isBefore(occurrence, rangeEnd) || isSameDay(occurrence, rangeEnd))
        ) {
          const dateKey = format(occurrence, 'yyyy-MM-dd');
          items.push({
            id: `${income.id}-${dateKey}`,
            type: 'income',
            title: income.name,
            date: dateKey,
            amount: income.amount,
            color: income.color || '#10b981',
            rawItem: income,
            notes: income.notes,
          });
        }
      } else if (income.frequency === 'semimonthly') {
        const days = income.semimonthlyDays || [15, -1];
        days.forEach((targetDay) => {
          const actualDay = targetDay === -1 ? lastDay : Math.min(targetDay, lastDay);
          const occurrence = new Date(year, month, actualDay);
          if (
            (isAfter(occurrence, rangeStart) || isSameDay(occurrence, rangeStart)) &&
            (isBefore(occurrence, rangeEnd) || isSameDay(occurrence, rangeEnd))
          ) {
            const dateKey = format(occurrence, 'yyyy-MM-dd');
            items.push({
              id: `${income.id}-${dateKey}`,
              type: 'income',
              title: income.name,
              date: dateKey,
              amount: income.amount,
              color: income.color || '#10b981',
              rawItem: income,
              notes: income.notes,
            });
          }
        });
      }
    }
  }

  return items;
}

/**
 * Generates debt payment occurrences for the calendar
 */
export function getDebtOccurrences(
  debt: Debt,
  rangeStart: Date,
  rangeEnd: Date
): CalendarItem[] {
  const items: CalendarItem[] = [];
  const startYear = rangeStart.getFullYear();
  const endYear = rangeEnd.getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const lastDay = getDate(endOfMonth(monthStart));
      const dueDay = Math.min(debt.dueDayOfMonth || 15, lastDay);
      const occurrence = new Date(year, month, dueDay);

      if (
        (isAfter(occurrence, rangeStart) || isSameDay(occurrence, rangeStart)) &&
        (isBefore(occurrence, rangeEnd) || isSameDay(occurrence, rangeEnd))
      ) {
        const dateKey = format(occurrence, 'yyyy-MM-dd');
        const monthKey = format(occurrence, 'yyyy-MM');
        const customPayment = debt.monthlyPayments?.[monthKey];
        const amount = customPayment !== undefined ? customPayment : debt.suggestedPayment;

        items.push({
          id: `${debt.id}-${dateKey}`,
          type: 'debt',
          title: `${debt.name} (Payoff)`,
          date: dateKey,
          amount,
          color: debt.color || '#ec4899',
          rawItem: debt,
          notes: `Remaining balance: $${Math.max(0, debt.currentBalance).toLocaleString()}`,
        });
      }
    }
  }

  return items;
}

/**
 * Converts Life Events into calendar items (filtered by layer visibility)
 */
export function getLifeEventOccurrences(
  events: LifeEvent[],
  layers: LifeLayer[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarItem[] {
  const layerMap = new Map(layers.map((l) => [l.id, l]));

  return events
    .filter((event) => {
      const layer = layerMap.get(event.layerId);
      if (!layer || !layer.isVisible) return false;
      const parsed = parseISO(event.date);
      return (
        (isAfter(parsed, rangeStart) || isSameDay(parsed, rangeStart)) &&
        (isBefore(parsed, rangeEnd) || isSameDay(parsed, rangeEnd))
      );
    })
    .map((event) => {
      const layer = layerMap.get(event.layerId);
      return {
        id: event.id,
        type: 'life_event',
        title: event.title,
        date: event.date,
        color: layer ? layer.color : '#3b82f6',
        layerName: layer ? layer.name : 'General',
        rawItem: event,
        notes: event.time ? `${event.time}${event.endTime ? ` - ${event.endTime}` : ''}` : undefined,
      };
    });
}

/**
 * Debt payoff calculation:
 * Suggests monthly payment based on initial balance, target months, and APR.
 * Also calculates projected timeline if actual payment differs.
 */
export function calculateDebtPlan(
  balance: number,
  targetMonths: number,
  aprPercent: number = 0
) {
  if (balance <= 0 || targetMonths <= 0) {
    return {
      monthlyPayment: 0,
      totalInterest: 0,
      totalCost: 0,
      projectedMonths: 0,
    };
  }

  const r = aprPercent > 0 ? aprPercent / 100 / 12 : 0;

  if (r === 0) {
    const payment = Math.ceil((balance / targetMonths) * 100) / 100;
    return {
      monthlyPayment: payment,
      totalInterest: 0,
      totalCost: balance,
      projectedMonths: targetMonths,
    };
  }

  // Amortization formula: P = r * PV / (1 - (1 + r)^(-n))
  const payment = (r * balance) / (1 - Math.pow(1 + r, -targetMonths));
  const roundedPayment = Math.ceil(payment * 100) / 100;
  const totalCost = roundedPayment * targetMonths;
  const totalInterest = Math.max(0, totalCost - balance);

  return {
    monthlyPayment: roundedPayment,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    projectedMonths: targetMonths,
  };
}

/**
 * Dynamically recalculate payoff timeline if user pays a specific monthly amount
 */
export function recalculatePayoffTimeline(
  currentBalance: number,
  actualPayment: number,
  aprPercent: number = 0
) {
  if (currentBalance <= 0 || actualPayment <= 0) {
    return { monthsToPayoff: 0, totalInterest: 0, isImpossible: false };
  }

  const r = aprPercent > 0 ? aprPercent / 100 / 12 : 0;

  // If payment doesn't even cover 1 month of interest
  if (r > 0 && actualPayment <= currentBalance * r) {
    return { monthsToPayoff: Infinity, totalInterest: Infinity, isImpossible: true };
  }

  if (r === 0) {
    const months = Math.ceil(currentBalance / actualPayment);
    return { monthsToPayoff: months, totalInterest: 0, isImpossible: false };
  }

  // n = -log(1 - (r * PV / P)) / log(1 + r)
  const numerator = -Math.log(1 - (r * currentBalance) / actualPayment);
  const denominator = Math.log(1 + r);
  const months = Math.ceil(numerator / denominator);
  const totalCost = months * actualPayment;
  const totalInterest = Math.max(0, totalCost - currentBalance);

  return {
    monthsToPayoff: months,
    totalInterest: Math.round(totalInterest * 100) / 100,
    isImpossible: false,
  };
}

/**
 * Partitions the calendar timeline into distinct Pay Cycles (payday-to-payday)
 * and calculates if the user is over or under for covering bills in that cycle.
 */
export function buildPayCycles(
  allCalendarItems: CalendarItem[],
  viewStart: Date,
  viewEnd: Date
): PayCycle[] {
  // Extract all income items sorted by date
  const incomeItems = allCalendarItems
    .filter((item) => item.type === 'income')
    .sort((a, b) => a.date.localeCompare(b.date));

  if (incomeItems.length === 0) return [];

  const cycles: PayCycle[] = [];

  for (let i = 0; i < incomeItems.length; i++) {
    const currentIncome = incomeItems[i];
    const cycleStartDate = currentIncome.date;
    
    // Cycle ends the day before next income, or viewEnd
    let cycleEndDate: string;
    if (i < incomeItems.length - 1) {
      const nextIncomeDate = parseISO(incomeItems[i + 1].date);
      cycleEndDate = format(addDays(nextIncomeDate, -1), 'yyyy-MM-dd');
    } else {
      // Last pay cycle extends until end of current view or 14 days later
      const lastPayDate = parseISO(currentIncome.date);
      cycleEndDate = format(addDays(lastPayDate, 14), 'yyyy-MM-dd');
    }

    // Find all expense items (bills & debt) within this pay cycle window [cycleStartDate, cycleEndDate]
    const cycleExpenses = allCalendarItems.filter(
      (item) =>
        (item.type === 'bill' || item.type === 'debt') &&
        item.date >= cycleStartDate &&
        item.date <= cycleEndDate
    );

    let billsDue = 0;
    let debtDue = 0;

    cycleExpenses.forEach((item) => {
      const amt = item.amount || 0;
      if (item.type === 'bill') billsDue += amt;
      if (item.type === 'debt') debtDue += amt;
    });

    const incomeAmount = currentIncome.amount || 0;
    const totalExpenses = billsDue + debtDue;
    const netBuffer = incomeAmount - totalExpenses;

    cycles.push({
      id: `cycle-${currentIncome.id}`,
      incomeId: currentIncome.rawItem.id,
      incomeName: currentIncome.title,
      startDate: cycleStartDate,
      endDate: cycleEndDate,
      payDate: currentIncome.date,
      incomeAmount,
      billsDueAmount: billsDue,
      debtDueAmount: debtDue,
      totalExpenses,
      netBuffer,
      isSurplus: netBuffer >= 0,
      items: [currentIncome, ...cycleExpenses],
    });
  }

  return cycles;
}

/**
 * Builds daily running financial balance projections across the month
 */
export function buildDailySummaries(
  days: Date[],
  allCalendarItems: CalendarItem[],
  initialBalance: number = 2500
): DayFinancialSummary[] {
  const itemsByDate: Record<string, CalendarItem[]> = {};

  allCalendarItems.forEach((item) => {
    if (!itemsByDate[item.date]) {
      itemsByDate[item.date] = [];
    }
    itemsByDate[item.date].push(item);
  });

  let runningBalance = initialBalance;
  const summaries: DayFinancialSummary[] = [];

  days.forEach((day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayItems = itemsByDate[dateKey] || [];

    const incomes = dayItems.filter((i) => i.type === 'income');
    const bills = dayItems.filter((i) => i.type === 'bill' || i.type === 'debt');
    const lifeEvents = dayItems.filter((i) => i.type === 'life_event');

    const totalInflow = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalOutflow = bills.reduce((sum, i) => sum + (i.amount || 0), 0);

    const startBal = runningBalance;
    runningBalance = runningBalance + totalInflow - totalOutflow;
    const endBal = runningBalance;

    summaries.push({
      date: dateKey,
      startingBalance: startBal,
      endingBalance: endBal,
      totalInflow,
      totalOutflow,
      incomes,
      bills,
      lifeEvents,
    });
  });

  return summaries;
}
