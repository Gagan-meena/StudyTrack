export const COLORS = ['#6c63ff','#f87171','#4ade80','#fbbf24','#38bdf8','#f472b6','#a78bfa','#fb923c'];
export const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function fmtHM(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

export function getWeekDays(weekOffset = 0) {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - (weekOffset * 7 + i));
    days.push({ label: DAYS[d.getDay()], key: dateKey(d) });
  }
  return days;
}
