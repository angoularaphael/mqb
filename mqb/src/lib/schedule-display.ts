/** Pause méridienne affichée entre matin et après-midi si les deux existent. */
export const LUNCH_START = '12:00';
export const LUNCH_END = '13:30';

export type ScheduleSlotLike = {
  id: string;
  startTime: string;
  endTime: string;
  course: string;
  room?: string;
};

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Insère un créneau « pause » après le dernier cours finissant avant LUNCH_START si un cours commence après LUNCH_END le même jour. */
export function withLunchBreak<T extends ScheduleSlotLike>(slots: T[]): (T | (ScheduleSlotLike & { isBreak: true }))[] {
  if (slots.length === 0) return slots;
  const sorted = [...slots].sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));
  const lunchStart = timeToMin(LUNCH_START);
  const lunchEnd = timeToMin(LUNCH_END);
  const hasMorning = sorted.some((s) => timeToMin(s.endTime) <= lunchStart);
  const hasAfternoon = sorted.some((s) => timeToMin(s.startTime) >= lunchEnd);
  if (!hasMorning || !hasAfternoon) return sorted;

  const out: (T | (ScheduleSlotLike & { isBreak: true }))[] = [];
  let inserted = false;
  for (const s of sorted) {
    if (!inserted && timeToMin(s.startTime) >= lunchEnd) {
      out.push({
        id: `break-${LUNCH_START}`,
        startTime: LUNCH_START,
        endTime: LUNCH_END,
        course: 'Pause méridienne',
        room: '',
        isBreak: true,
      });
      inserted = true;
    }
    out.push(s);
  }
  return out;
}

export function dedupeTeacherSchedules<
  T extends {
    id: string;
    course_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room_id: string;
    start_date: string;
    end_date: string;
  },
>(rows: T[]): (T & { merged_schedule_ids: string[]; start_date: string; end_date: string })[] {
  const map = new Map<
    string,
    T & { merged_schedule_ids: string[]; start_date: string; end_date: string }
  >();
  for (const s of rows) {
    const key = `${s.day_of_week}|${s.start_time}|${s.end_time}|${s.course_id}|${s.room_id}`;
    const ex = map.get(key);
    if (!ex) {
      map.set(key, {
        ...s,
        merged_schedule_ids: [s.id],
        start_date: s.start_date,
        end_date: s.end_date,
      });
    } else {
      ex.merged_schedule_ids.push(s.id);
      if (s.start_date < ex.start_date) ex.start_date = s.start_date;
      if (s.end_date > ex.end_date) ex.end_date = s.end_date;
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    return a.start_time.localeCompare(b.start_time);
  });
}
