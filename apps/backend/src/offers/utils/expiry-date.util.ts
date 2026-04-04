export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnlyToEndOfDay(value: string): Date {
  if (!DATE_ONLY_PATTERN.test(value)) {
    throw new Error('Invalid date-only value.');
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error('Invalid calendar date.');
  }

  date.setHours(23, 59, 59, 999);

  return date;
}
