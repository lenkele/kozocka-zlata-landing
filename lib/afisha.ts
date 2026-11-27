type DatedPerformance = { dateIso: string; time: string };

function israelDateTime(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}T${value('hour')}:${value('minute')}`;
}

function startKey(row: DatedPerformance): string {
  const match = row.time.trim().match(/^(\d{1,2}):(\d{2})/);
  // A date without a known time remains upcoming throughout that day.
  const time = match ? `${match[1].padStart(2, '0')}:${match[2]}` : '23:59';
  return `${row.dateIso}T${time}`;
}

export function isPastPerformance(row: DatedPerformance, now = new Date()): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(row.dateIso) && startKey(row) < israelDateTime(now);
}

/** All upcoming performances first; fill remaining places with the most recent past performances. */
export function selectAfishaRows<T extends DatedPerformance>(rows: readonly T[], now = new Date(), minimum = 8): T[] {
  const current = israelDateTime(now);
  const valid = rows.filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.dateIso));
  const upcoming = valid.filter((row) => startKey(row) >= current).sort((a, b) => startKey(a).localeCompare(startKey(b)));
  const past = valid.filter((row) => startKey(row) < current).sort((a, b) => startKey(b).localeCompare(startKey(a)));
  return [...upcoming, ...past.slice(0, Math.max(0, minimum - upcoming.length))];
}
