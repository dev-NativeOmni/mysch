import { isFirebaseConfigured, db } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import {
  Institution,
  User,
  ClassRoom,
  Student,
  Subject,
  Schedule,
  JournalEntry,
} from "./types";
import {
  INITIAL_INSTITUTIONS,
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_STUDENTS_8A,
  INITIAL_SCHEDULES,
  INITIAL_JOURNALS,
} from "./mockData";

const STORAGE_KEYS = {
  INSTITUTIONS: "jg_institutions",
  USERS: "jg_users",
  CLASSES: "jg_classes",
  SUBJECTS: "jg_subjects",
  STUDENTS: "jg_students",
  SCHEDULES: "jg_schedules",
  JOURNALS: "jg_journals",
  ACTIVE_TOKEN: "jg_active_token",
  SESSION: "jg_session",
};

// Inisialisasi awal ke localStorage jika kosong
function initLocalStorage() {
  if (typeof window === "undefined") return;

  const rawInst = localStorage.getItem(STORAGE_KEYS.INSTITUTIONS);
  if (
    !rawInst ||
    rawInst.includes("SMPHARAPAN") ||
    rawInst.includes("inst-smp-1") ||
    rawInst.includes("SMAHARAPAN")
  ) {
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(INITIAL_INSTITUTIONS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS_8A));
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(INITIAL_SCHEDULES));
    localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(INITIAL_JOURNALS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBJECTS)) {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS_8A));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SCHEDULES)) {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(INITIAL_SCHEDULES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.JOURNALS)) {
    localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(INITIAL_JOURNALS));
  }
}

// ==========================================
// 1. LEMBAGA (INSTITUTION) CRUD
// ==========================================
export async function getInstitutions(): Promise<Institution[]> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "institutions"));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Institution));
      }
    } catch (e) {
      console.warn("Firestore fallback to local:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.INSTITUTIONS);
  return raw ? JSON.parse(raw) : INITIAL_INSTITUTIONS;
}

export async function getInstitutionByToken(token: string): Promise<Institution | null> {
  const list = await getInstitutions();
  const clean = token.trim().toUpperCase();
  return list.find((item) => item.token_lembaga.toUpperCase() === clean && item.is_active) || null;
}

export async function saveInstitution(inst: Institution): Promise<void> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "institutions", inst.id), inst);
    } catch (e) {
      console.warn("Firestore write error:", e);
    }
  }
  const list = await getInstitutions();
  const idx = list.findIndex((i) => i.id === inst.id);
  if (idx >= 0) {
    list[idx] = inst;
  } else {
    list.push(inst);
  }
  localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(list));
}

export async function deleteInstitution(instId: string): Promise<void> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "institutions", instId));
    } catch (e) {
      console.warn("Firestore delete error:", e);
    }
  }
  const list = await getInstitutions();
  const filtered = list.filter((i) => i.id !== instId);
  localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(filtered));
}

// ==========================================
// 2. PENGGUNA (USERS / GURU / ADMIN) CRUD
// ==========================================
export async function getUsers(institutionId?: string): Promise<User[]> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      const q = institutionId
        ? query(collection(db, "users"), where("institution_id", "==", institutionId))
        : collection(db, "users");
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
      }
    } catch (e) {
      console.warn("Firestore fallback to local:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.USERS);
  const all: User[] = raw ? JSON.parse(raw) : INITIAL_USERS;
  if (!institutionId) return all;
  return all.filter((u) => u.institution_id === institutionId || u.role === "SUPER_ADMIN");
}

export async function saveUser(user: User): Promise<void> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "users", user.id), user);
    } catch (e) {
      console.warn("Firestore write error:", e);
    }
  }
  const list = await getUsers();
  const idx = list.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    list[idx] = user;
  } else {
    list.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
}

export async function deleteUser(userId: string): Promise<void> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (e) {
      console.warn("Firestore delete user error:", e);
    }
  }
  const list = await getUsers();
  const filtered = list.filter((u) => u.id !== userId);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
}

export async function resetUserPin(userId: string, newPin: string): Promise<void> {
  initLocalStorage();
  const list = await getUsers();
  const user = list.find((u) => u.id === userId);
  if (user) {
    user.pin = newPin;
    await saveUser(user);
  }
}

// ==========================================
// 3. JADWAL (SCHEDULES) CRUD
// ==========================================
export async function getSchedules(institutionId: string, teacherId?: string): Promise<Schedule[]> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "schedules"));
      if (!snap.empty) {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Schedule));
        return all.filter(
          (s) => s.institution_id === institutionId && (!teacherId || s.teacher_id === teacherId)
        );
      }
    } catch (e) {
      console.warn("Firestore fallback to local:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
  const all: Schedule[] = raw ? JSON.parse(raw) : INITIAL_SCHEDULES;
  return all.filter(
    (s) => s.institution_id === institutionId && (!teacherId || s.teacher_id === teacherId)
  );
}

export async function saveSchedule(schedule: Schedule): Promise<void> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "schedules", schedule.id), schedule);
    } catch (e) {
      console.warn("Firestore write error:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
  const all: Schedule[] = raw ? JSON.parse(raw) : INITIAL_SCHEDULES;
  const idx = all.findIndex((s) => s.id === schedule.id);
  if (idx >= 0) {
    all[idx] = schedule;
  } else {
    all.push(schedule);
  }
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(all));
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "schedules", scheduleId));
    } catch (e) {
      console.warn("Firestore delete schedule error:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
  const all: Schedule[] = raw ? JSON.parse(raw) : INITIAL_SCHEDULES;
  const filtered = all.filter((s) => s.id !== scheduleId);
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(filtered));
}

// ==========================================
// 4. JURNAL MENGAJAR (JOURNALS) CRUD
// ==========================================
export async function getJournals(institutionId: string, teacherId?: string): Promise<JournalEntry[]> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "journals"));
      if (!snap.empty) {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JournalEntry));
        return all.filter(
          (j) => j.institution_id === institutionId && (!teacherId || j.actual_teacher_id === teacherId)
        );
      }
    } catch (e) {
      console.warn("Firestore fallback to local:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.JOURNALS);
  const all: JournalEntry[] = raw ? JSON.parse(raw) : INITIAL_JOURNALS;
  return all.filter(
    (j) => j.institution_id === institutionId && (!teacherId || j.actual_teacher_id === teacherId)
  );
}

export async function saveJournal(entry: JournalEntry): Promise<void> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "journals", entry.id), entry);
    } catch (e) {
      console.warn("Firestore write error:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.JOURNALS);
  const all: JournalEntry[] = raw ? JSON.parse(raw) : INITIAL_JOURNALS;
  const idx = all.findIndex((j) => j.id === entry.id);
  if (idx >= 0) {
    all[idx] = entry;
  } else {
    all.unshift(entry);
  }
  localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(all));
}

// ==========================================
// 5. KELAS & ROMBEL (CLASSES) CRUD
// ==========================================
export async function getClasses(institutionId: string): Promise<ClassRoom[]> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "classes"));
      if (!snap.empty) {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassRoom));
        return all.filter((c) => c.institution_id === institutionId);
      }
    } catch (e) {
      console.warn("Firestore fallback classes:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
  const all: ClassRoom[] = raw ? JSON.parse(raw) : INITIAL_CLASSES;
  return all.filter((c) => c.institution_id === institutionId);
}

export async function saveClass(cls: ClassRoom): Promise<void> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "classes", cls.id), cls);
    } catch (e) {
      console.warn("Firestore save class error:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
  const all: ClassRoom[] = raw ? JSON.parse(raw) : INITIAL_CLASSES;
  const idx = all.findIndex((c) => c.id === cls.id);
  if (idx >= 0) {
    all[idx] = cls;
  } else {
    all.push(cls);
  }
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(all));
}

export async function deleteClass(classId: string): Promise<void> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "classes", classId));
    } catch (e) {
      console.warn("Firestore delete class error:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
  const all: ClassRoom[] = raw ? JSON.parse(raw) : INITIAL_CLASSES;
  const filtered = all.filter((c) => c.id !== classId);
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(filtered));
}

// ==========================================
// 6. MATA PELAJARAN (SUBJECTS) CRUD
// ==========================================
export async function getSubjects(institutionId: string): Promise<Subject[]> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "subjects"));
      if (!snap.empty) {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subject));
        return all.filter((s) => s.institution_id === institutionId);
      }
    } catch (e) {
      console.warn("Firestore fallback subjects:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
  const all: Subject[] = raw ? JSON.parse(raw) : INITIAL_SUBJECTS;
  return all.filter((s) => s.institution_id === institutionId);
}

export async function saveSubject(sub: Subject): Promise<void> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "subjects", sub.id), sub);
    } catch (e) {
      console.warn("Firestore save subject error:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
  const all: Subject[] = raw ? JSON.parse(raw) : INITIAL_SUBJECTS;
  const idx = all.findIndex((s) => s.id === sub.id);
  if (idx >= 0) {
    all[idx] = sub;
  } else {
    all.push(sub);
  }
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(all));
}

export async function deleteSubject(subjectId: string): Promise<void> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "subjects", subjectId));
    } catch (e) {
      console.warn("Firestore delete subject error:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
  const all: Subject[] = raw ? JSON.parse(raw) : INITIAL_SUBJECTS;
  const filtered = all.filter((s) => s.id !== subjectId);
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(filtered));
}

// ==========================================
// 7. SISWA (STUDENTS) CRUD
// ==========================================
export async function getAllStudents(institutionId: string): Promise<Student[]> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "students"));
      if (!snap.empty) {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
        return all.filter((s) => s.institution_id === institutionId);
      }
    } catch (e) {
      console.warn("Firestore fallback students:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  const all: Student[] = raw ? JSON.parse(raw) : INITIAL_STUDENTS_8A;
  return all.filter((s) => s.institution_id === institutionId);
}

export async function getStudentsByClass(classId: string): Promise<Student[]> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "students"));
      if (!snap.empty) {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
        return all.filter((s) => s.class_id === classId && s.is_active);
      }
    } catch (e) {
      console.warn("Firestore fallback students by class:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  const all: Student[] = raw ? JSON.parse(raw) : INITIAL_STUDENTS_8A;
  return all.filter((s) => s.class_id === classId && s.is_active);
}

export async function saveStudent(student: Student): Promise<void> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "students", student.id), student);
    } catch (e) {
      console.warn("Firestore save student error:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  const all: Student[] = raw ? JSON.parse(raw) : INITIAL_STUDENTS_8A;
  const idx = all.findIndex((s) => s.id === student.id);
  if (idx >= 0) {
    all[idx] = student;
  } else {
    all.push(student);
  }
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(all));
}

export async function deleteStudent(studentId: string): Promise<void> {
  initLocalStorage();
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "students", studentId));
    } catch (e) {
      console.warn("Firestore delete student error:", e);
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  const all: Student[] = raw ? JSON.parse(raw) : INITIAL_STUDENTS_8A;
  const filtered = all.filter((s) => s.id !== studentId);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(filtered));
}

// ==========================================
// 8. TOKEN AKTIF & SESI LOKAL
// ==========================================
export function getSavedToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_TOKEN);
}

export function saveActiveToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.ACTIVE_TOKEN, token.toUpperCase());
}

export function clearActiveToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_TOKEN);
}

export function getSavedSession(): { user: User; institution: Institution } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
  return raw ? JSON.parse(raw) : null;
}

export function saveSession(user: User, institution: Institution): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ user, institution }));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}
