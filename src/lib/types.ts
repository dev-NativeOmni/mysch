export type UserRole = "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "HEADMASTER";

export type AttendanceStatus = "H" | "S" | "I" | "A" | "D";

export interface Institution {
  id: string;
  token_lembaga: string; // e.g. "SMPHARAPAN"
  name: string; // e.g. "SMP Harapan 1"
  education_level: "SD" | "SMP" | "SMA" | "SMK" | "MI" | "MTs";
  npsn?: string;
  address?: string;
  phone?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: string;
  institution_id?: string; // null if SUPER_ADMIN
  nip: string;
  name: string;
  phone: string;
  pin: string; // 6 digits
  role: UserRole;
  avatar_url?: string;
  subject_name?: string; // fallback / legacy string
  subject_ids?: string[]; // Array ID mata pelajaran yang diampu (bisa > 1)
  is_active: boolean;
}

export interface ClassRoom {
  id: string;
  institution_id: string;
  name: string; // e.g. "VIII-A"
  grade_level: number;
  academic_year: string;
  homeroom_teacher_id?: string;
}

export interface Student {
  id: string;
  institution_id: string;
  class_id: string;
  nisn: string;
  nipd?: string;
  full_name: string;
  gender: "L" | "P";
  is_active: boolean;
}

export interface Subject {
  id: string;
  institution_id: string;
  code: string;
  name: string;
  category: "Wajib" | "Pilihan" | "Muatan Lokal";
}

export interface Schedule {
  id: string;
  institution_id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  day_of_week: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu";
  start_period: number; // e.g. 1
  end_period: number; // e.g. 2
  start_time: string; // e.g. "07:30"
  end_time: string; // e.g. "09:00"
  academic_year: string;
  semester: 1 | 2;
}

export interface AttendanceRecord {
  student_id: string;
  student_name: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface JournalEntry {
  id: string;
  institution_id: string;
  schedule_id: string;
  actual_teacher_id: string;
  teacher_name: string;
  class_name: string;
  subject_name: string;
  entry_date: string; // YYYY-MM-DD
  start_time: string;
  end_time: string;
  start_period: number;
  end_period: number;
  learning_objective: string;
  topic_materials: string;
  learning_activities: string[]; // e.g. ["Diskusi Kelompok", "Praktikum Lab"]
  student_present_count: number;
  student_sick_count: number;
  student_permit_count: number;
  student_absent_count: number;
  attendance_records: AttendanceRecord[];
  teacher_notes?: string;
  photo_url?: string;
  completion_rate?: number; // 100, 75, 50, 0
  is_locked: boolean;
  submitted_at: string;
}
