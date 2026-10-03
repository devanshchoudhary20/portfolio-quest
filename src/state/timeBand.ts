export type TimeBand = 'day' | 'dusk' | 'night';

// a broken clock reads as day
export function timeBand(date: Date = new Date()): TimeBand {
  const hour = date.getHours();
  if (Number.isNaN(hour)) return 'day';
  if (hour >= 6 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'dusk';
  return 'night';
}
