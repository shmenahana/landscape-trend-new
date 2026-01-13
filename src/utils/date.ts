export const parseDate = (dateString: string): Date | null => {
  if (!dateString || dateString.trim() === '') {
    return null;
  }

  const trimmed = dateString.trim();

  // Try parsing as ISO format first (YYYY-MM-DD)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try MM/DD/YYYY or M/D/YYYY
  const usMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try DD/MM/YYYY or D/M/YYYY
  const euMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (euMatch) {
    const [, day, month, year] = euMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try native Date parsing as last resort
  const nativeDate = new Date(trimmed);
  if (!isNaN(nativeDate.getTime())) {
    return nativeDate;
  }

  return null;
};

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCalendarYearRange = (transactions: Array<{ date: string }>): {
  start: string;
  end: string;
} | null => {
  if (transactions.length === 0) return null;

  const dates = transactions.map(t => new Date(t.date)).filter(d => !isNaN(d.getTime()));
  if (dates.length === 0) return null;

  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  const year = maxDate.getFullYear();

  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
};

export const getRolling12MonthRange = (transactions: Array<{ date: string }>): {
  start: string;
  end: string;
} | null => {
  if (transactions.length === 0) return null;

  const dates = transactions.map(t => new Date(t.date)).filter(d => !isNaN(d.getTime()));
  if (dates.length === 0) return null;

  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  const minDate = new Date(maxDate);
  minDate.setFullYear(minDate.getFullYear() - 1);
  minDate.setDate(minDate.getDate() + 1); // Start from day after

  return {
    start: formatDate(minDate),
    end: formatDate(maxDate),
  };
};

export const calculateCoverageMonths = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const months = Math.round(diffDays / 30.44); // Average days per month

  return months;
};
