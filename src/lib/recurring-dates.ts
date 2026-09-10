import type { RecurringFrequency } from '../context/finance-context';

export function advanceRecurringDate(date: Date, frequency: RecurringFrequency) {
  const next = new Date(date);

  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
  }

  if (frequency === 'monthly') {
    const day = next.getDate();
    const wasLastDay = day === new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(wasLastDay ? lastDay : Math.min(day, lastDay));
  }

  if (frequency === 'yearly') {
    const month = next.getMonth();
    const day = next.getDate();
    const wasLastDay = day === new Date(next.getFullYear(), month + 1, 0).getDate();
    next.setDate(1);
    next.setFullYear(next.getFullYear() + 1);
    next.setMonth(month);
    const lastDay = new Date(next.getFullYear(), month + 1, 0).getDate();
    next.setDate(wasLastDay ? lastDay : Math.min(day, lastDay));
  }

  return next;
}

export function recurringDatesBetween(
  firstDate: Date,
  frequency: RecurringFrequency,
  rangeStart: Date,
  rangeEnd: Date
) {
  const dates: Date[] = [];
  let current = new Date(firstDate);
  let guard = 0;

  while (current < rangeStart && guard < 1500) {
    current = advanceRecurringDate(current, frequency);
    guard += 1;
  }

  while (current < rangeEnd && guard < 1500) {
    dates.push(new Date(current));
    current = advanceRecurringDate(current, frequency);
    guard += 1;
  }

  return dates;
}
