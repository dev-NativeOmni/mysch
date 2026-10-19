import { Schedule } from "./types";

const INDO_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

/**
 * Tanggal hari ini (YYYY-MM-DD) menurut jam perangkat.
 * Jangan pakai toISOString() karena itu UTC: sebelum jam 07.00 WIB tanggalnya masih kemarin.
 */
export function getLocalDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Nama hari dalam Bahasa Indonesia, sama dengan format Schedule.day_of_week */
export function getIndoDayName(date = new Date()): string {
  return INDO_DAYS[date.getDay()];
}

/** Jam sekarang dalam format "HH:MM" agar bisa dibandingkan langsung dengan start_time / end_time */
export function getCurrentTimeString(date = new Date()): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Normalisasi "7:30" atau "07.30" menjadi "07:30" */
function normalizeTime(time: string): string {
  const [h = "0", m = "0"] = time.replace(".", ":").split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

export type ScheduleTiming = "running" | "upcoming" | "past";

export function getScheduleTiming(schedule: Schedule, now = getCurrentTimeString()): ScheduleTiming {
  const start = normalizeTime(schedule.start_time);
  const end = normalizeTime(schedule.end_time);
  if (now < start) return "upcoming";
  if (now >= end) return "past";
  return "running";
}

export function sortSchedulesByTime(list: Schedule[]): Schedule[] {
  return [...list].sort((a, b) => normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time)));
}
