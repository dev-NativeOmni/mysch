"use client";

import React, { useState, useEffect } from "react";
import {
  Institution,
  User,
  Schedule,
  ClassRoom,
  Subject,
  JournalEntry,
  Student,
} from "@/lib/types";
import {
  getSchedules,
  getUsers,
  getClasses,
  getSubjects,
  getJournals,
  getAllStudents,
  getStudentsByClass,
  saveSchedule,
  deleteSchedule,
  saveUser,
  deleteUser,
  resetUserPin,
  saveClass,
  deleteClass,
  saveSubject,
  deleteSubject,
  saveStudent,
  deleteStudent,
  saveInstitution,
  deleteInstitution,
  saveActiveToken,
} from "@/lib/storage";
import {
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Copy,
  Share2,
  Clock,
  ShieldCheck,
  Eye,
  FileSpreadsheet,
  AlertTriangle,
  School,
  Sparkles,
  BookOpen,
  GraduationCap,
  Key,
  Trash2,
  Edit3,
  UserPlus,
  X,
  Search,
  Check,
} from "lucide-react";

interface AdminDashboardProps {
  user: User;
  activeInstitution: Institution;
  institutions: Institution[];
  onRefreshInstitutions: () => void;
  onSwitchInstitution: (inst: Institution) => void;
}

type AdminTab = "jadwal" | "kelas" | "mapel" | "guru" | "monitor" | "lembaga";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  activeInstitution,
  institutions,
  onRefreshInstitutions,
  onSwitchInstitution,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>("jadwal");

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  // ================= MODAL JADWAL =================
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [newSchClassId, setNewSchClassId] = useState("");
  const [newSchTeacherId, setNewSchTeacherId] = useState("");
  const [newSchSubjectId, setNewSchSubjectId] = useState("");
  const [newSchDay, setNewSchDay] = useState<"Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat">("Senin");
  const [newSchStartPeriod, setNewSchStartPeriod] = useState(1);
  const [newSchEndPeriod, setNewSchEndPeriod] = useState(2);
  const [newSchStartTime, setNewSchStartTime] = useState("07:00");
  const [newSchEndTime, setNewSchEndTime] = useState("08:30");
  const [conflictWarning, setConflictWarning] = useState("");

  // ================= MODAL KELAS =================
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [className, setClassName] = useState("");
  const [classGrade, setClassGrade] = useState<number>(7);
  const [classYear, setClassYear] = useState("2026/2027");
  const [classHomeroomId, setClassHomeroomId] = useState("");

  // ================= MODAL KELOLA SISWA PER KELAS =================
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<ClassRoom | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [newStudentNisn, setNewStudentNisn] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGender, setNewStudentGender] = useState<"L" | "P">("L");

  // ================= MODAL MAPEL =================
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCategory, setSubjectCategory] = useState<"Wajib" | "Pilihan" | "Muatan Lokal">("Wajib");

  // ================= MODAL GURU / USER =================
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [teacherName, setTeacherName] = useState("");
  const [teacherNip, setTeacherNip] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [teacherRole, setTeacherRole] = useState<"TEACHER" | "ADMIN" | "HEADMASTER">("TEACHER");
  const [teacherSelectedSubjectIds, setTeacherSelectedSubjectIds] = useState<string[]>([]);
  const [teacherCustomSubject, setTeacherCustomSubject] = useState("");

  // ================= MODAL RESET PIN =================
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [targetUserForReset, setTargetUserForReset] = useState<User | null>(null);
  const [newPinValue, setNewPinValue] = useState("123456");
  const [resetSuccessMsg, setResetSuccessMsg] = useState("");

  // ================= MODAL HAPUS GURU =================
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // ================= MODAL TAMBAH, EDIT & HAPUS LEMBAGA =================
  const [showAddInstModal, setShowAddInstModal] = useState(false);
  const [editingInst, setEditingInst] = useState<Institution | null>(null);
  const [newInstName, setNewInstName] = useState("");
  const [newInstToken, setNewInstToken] = useState("");
  const [newInstLevel, setNewInstLevel] = useState<"SD" | "SMP" | "SMA" | "SMK">("SMK");
  const [newInstNpsn, setNewInstNpsn] = useState("");

  const [instToDelete, setInstToDelete] = useState<Institution | null>(null);
  const [deleteInstConfirmInput, setDeleteInstConfirmInput] = useState("");

  const [copiedToken, setCopiedToken] = useState(false);

  // Load all data
  const loadData = async () => {
    try {
      const [schList, uList, clsList, subList, jrnList, stdList] = await Promise.all([
        getSchedules(activeInstitution.id),
        getUsers(activeInstitution.id),
        getClasses(activeInstitution.id),
        getSubjects(activeInstitution.id),
        getJournals(activeInstitution.id),
        getAllStudents(activeInstitution.id),
      ]);

      setSchedules(schList);
      setTeachers(uList.filter((u) => u.role === "TEACHER" || u.role === "ADMIN" || u.role === "HEADMASTER"));
      setClasses(clsList);
      setSubjects(subList);
      setJournals(jrnList);
      setAllStudents(stdList);

      if (clsList.length > 0 && !newSchClassId) setNewSchClassId(clsList[0].id);
      if (uList.length > 0 && !newSchTeacherId) setNewSchTeacherId(uList[0].id);
      if (subList.length > 0 && !newSchSubjectId) setNewSchSubjectId(subList[0].id);
    } catch (e) {
      console.error("Error loading admin data:", e);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInstitution.id]);

  // Copy token to clipboard
  const handleCopyToken = () => {
    navigator.clipboard.writeText(activeInstitution.token_lembaga);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // Share via WhatsApp
  const handleShareWA = () => {
    const text = `Halo Bapak/Ibu Guru ${activeInstitution.name}. Silakan isi jurnal mengajar harian menggunakan Token Lembaga: *${activeInstitution.token_lembaga}* di aplikasi MySch (https://myschoolid.web.app).`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Helper Lookups
  const getTeacherName = (tId: string) => teachers.find((t) => t.id === tId)?.name || "Guru";
  const getClassName = (cId: string) => classes.find((c) => c.id === cId)?.name || "Kelas";
  const getSubjectName = (sId: string) => subjects.find((s) => s.id === sId)?.name || "Mapel";

  // Check schedule conflict
  const checkConflict = (teacherId: string, day: string, startP: number, endP: number) => {
    const conflict = schedules.find(
      (s) =>
        s.teacher_id === teacherId &&
        s.day_of_week === day &&
        ((startP >= s.start_period && startP <= s.end_period) ||
          (endP >= s.start_period && endP <= s.end_period))
    );

    if (conflict) {
      const cls = getClassName(conflict.class_id);
      return `⚠️ BENTROK: Guru ini sudah terjadwal di Kelas ${cls} pada ${day} Jam Ke ${conflict.start_period}-${conflict.end_period}!`;
    }
    return "";
  };

  // ================= ACTIONS: JADWAL =================
  const handleTeacherChangeInSchedule = (tId: string) => {
    setNewSchTeacherId(tId);
    const teacher = teachers.find((t) => t.id === tId);
    if (teacher && teacher.subject_ids && teacher.subject_ids.length > 0) {
      setNewSchSubjectId(teacher.subject_ids[0]);
    }
    const warning = checkConflict(tId, newSchDay, newSchStartPeriod, newSchEndPeriod);
    setConflictWarning(warning);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const warning = checkConflict(newSchTeacherId, newSchDay, newSchStartPeriod, newSchEndPeriod);
    if (warning) {
      setConflictWarning(warning);
      return;
    }

    const newSch: Schedule = {
      id: "sch-" + Date.now(),
      institution_id: activeInstitution.id,
      teacher_id: newSchTeacherId,
      class_id: newSchClassId,
      subject_id: newSchSubjectId,
      day_of_week: newSchDay,
      start_period: Number(newSchStartPeriod),
      end_period: Number(newSchEndPeriod),
      start_time: newSchStartTime,
      end_time: newSchEndTime,
      academic_year: "2026/2027",
      semester: 1,
    };

    await saveSchedule(newSch);
    setShowAddScheduleModal(false);
    loadData();
  };

  const handleDeleteSchedule = async (schId: string) => {
    if (window.confirm("Hapus jadwal ini dari matriks?")) {
      await deleteSchedule(schId);
      loadData();
    }
  };

  // ================= ACTIONS: KELAS =================
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassName("");
    setClassGrade(activeInstitution.education_level === "SD" ? 1 : activeInstitution.education_level === "SMA" || activeInstitution.education_level === "SMK" ? 10 : 7);
    setClassYear("2026/2027");
    setClassHomeroomId(teachers[0]?.id || "");
    setShowClassModal(true);
  };

  const handleOpenEditClass = (cls: ClassRoom) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setClassGrade(cls.grade_level);
    setClassYear(cls.academic_year);
    setClassHomeroomId(cls.homeroom_teacher_id || "");
    setShowClassModal(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const cls: ClassRoom = {
      id: editingClass ? editingClass.id : "cls-" + Date.now(),
      institution_id: activeInstitution.id,
      name: className.trim(),
      grade_level: Number(classGrade),
      academic_year: classYear.trim(),
      homeroom_teacher_id: classHomeroomId || undefined,
    };
    await saveClass(cls);
    setShowClassModal(false);
    loadData();
  };

  const handleDeleteClass = async (cls: ClassRoom) => {
    if (window.confirm(`Yakin ingin menghapus kelas ${cls.name}? Seluruh jadwal yang menggunakan kelas ini perlu disesuaikan.`)) {
      await deleteClass(cls.id);
      loadData();
    }
  };

  // ================= ACTIONS: KELOLA SISWA =================
  const handleOpenStudentsModal = async (cls: ClassRoom) => {
    setSelectedClassForStudents(cls);
    const students = await getStudentsByClass(cls.id);
    setClassStudents(students);
    setNewStudentNisn("");
    setNewStudentName("");
    setNewStudentGender("L");
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForStudents || !newStudentName.trim()) return;

    const std: Student = {
      id: "std-" + Date.now(),
      institution_id: activeInstitution.id,
      class_id: selectedClassForStudents.id,
      nisn: newStudentNisn.trim() || "00" + Math.floor(10000000 + Math.random() * 90000000),
      full_name: newStudentName.trim(),
      gender: newStudentGender,
      is_active: true,
    };

    await saveStudent(std);
    const updated = await getStudentsByClass(selectedClassForStudents.id);
    setClassStudents(updated);
    setNewStudentNisn("");
    setNewStudentName("");
    loadData();
  };

  const handleDeleteStudent = async (stdId: string) => {
    if (!selectedClassForStudents) return;
    await deleteStudent(stdId);
    const updated = await getStudentsByClass(selectedClassForStudents.id);
    setClassStudents(updated);
    loadData();
  };

  // ================= ACTIONS: MAPEL =================
  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubjectCode("");
    setSubjectName("");
    setSubjectCategory("Wajib");
    setShowSubjectModal(true);
  };

  const handleOpenEditSubject = (sub: Subject) => {
    setEditingSubject(sub);
    setSubjectCode(sub.code);
    setSubjectName(sub.name);
    setSubjectCategory(sub.category);
    setShowSubjectModal(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const sub: Subject = {
      id: editingSubject ? editingSubject.id : "sub-" + Date.now(),
      institution_id: activeInstitution.id,
      code: subjectCode.trim().toUpperCase(),
      name: subjectName.trim(),
      category: subjectCategory,
    };
    await saveSubject(sub);
    setShowSubjectModal(false);
    loadData();
  };

  const handleDeleteSubject = async (sub: Subject) => {
    if (window.confirm(`Yakin ingin menghapus mata pelajaran ${sub.name} (${sub.code})?`)) {
      await deleteSubject(sub.id);
      loadData();
    }
  };

  // ================= ACTIONS: GURU (MULTI-MAPEL & RESET PIN) =================
  const handleOpenAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherName("");
    setTeacherNip("");
    setTeacherPhone("");
    setTeacherRole("TEACHER");
    setTeacherSelectedSubjectIds([]);
    setTeacherCustomSubject("");
    setShowTeacherModal(true);
  };

  const handleOpenEditTeacher = (t: User) => {
    setEditingTeacher(t);
    setTeacherName(t.name);
    setTeacherNip(t.nip);
    setTeacherPhone(t.phone);
    setTeacherRole(t.role === "SUPER_ADMIN" ? "ADMIN" : t.role);
    setTeacherSelectedSubjectIds(t.subject_ids || []);
    setTeacherCustomSubject(t.subject_name || "");
    setShowTeacherModal(true);
  };

  const toggleSubjectForTeacher = (subId: string) => {
    setTeacherSelectedSubjectIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    // Generate text summary for subjects
    const chosenNames = subjects
      .filter((s) => teacherSelectedSubjectIds.includes(s.id))
      .map((s) => s.name);
    const summaryText = chosenNames.length > 0 ? chosenNames.join(" & ") : teacherCustomSubject.trim() || "Guru Pengampu";

    const t: User = {
      id: editingTeacher ? editingTeacher.id : "user-" + Date.now(),
      institution_id: activeInstitution.id,
      nip: teacherNip.trim(),
      name: teacherName.trim(),
      phone: teacherPhone.trim(),
      pin: editingTeacher ? editingTeacher.pin : "123456",
      role: teacherRole,
      subject_ids: teacherSelectedSubjectIds,
      subject_name: summaryText,
      is_active: true,
      avatar_url: editingTeacher?.avatar_url,
    };

    await saveUser(t);
    setShowTeacherModal(false);
    loadData();
  };

  const handleOpenResetPin = (t: User) => {
    setTargetUserForReset(t);
    setNewPinValue("123456");
    setResetSuccessMsg("");
    setShowResetPinModal(true);
  };

  const handleExecuteResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForReset) return;
    await resetUserPin(targetUserForReset.id, newPinValue.trim());
    setResetSuccessMsg(`PIN akun ${targetUserForReset.name} berhasil diubah ke: ${newPinValue.trim()}`);
    loadData();
  };

  const handleShareResetPinWA = () => {
    if (!targetUserForReset) return;
    const msg = `Halo ${targetUserForReset.name}, akun MySch Anda di ${activeInstitution.name} telah direset.\n\n*Token Lembaga:* ${activeInstitution.token_lembaga}\n*NIP / ID:* ${targetUserForReset.nip}\n*PIN Baru:* ${newPinValue}\n\nSilakan masuk melalui: https://myschoolid.web.app`;
    window.open(`https://wa.me/${targetUserForReset.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    await deleteUser(userToDelete.id);
    setUserToDelete(null);
    loadData();
  };

  // ================= ACTIONS: LEMBAGA =================
  const handleOpenAddInst = () => {
    setEditingInst(null);
    setNewInstName("");
    setNewInstToken("");
    setNewInstLevel("SMK");
    setNewInstNpsn("");
    setShowAddInstModal(true);
  };

  const handleOpenEditInst = (inst: Institution) => {
    setEditingInst(inst);
    setNewInstName(inst.name);
    setNewInstToken(inst.token_lembaga);
    setNewInstLevel(inst.education_level as any);
    setNewInstNpsn(inst.npsn || "");
    setShowAddInstModal(true);
  };

  const handleSaveInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = newInstToken.trim().toUpperCase();
    if (!cleanToken) {
      alert("Token Lembaga tidak boleh kosong.");
      return;
    }

    const instToSave: Institution = {
      id: editingInst ? editingInst.id : "inst-" + Date.now(),
      token_lembaga: cleanToken,
      name: newInstName.trim(),
      education_level: newInstLevel,
      npsn: newInstNpsn.trim() || undefined,
      logo_url: editingInst?.logo_url || "⚙️",
      is_active: true,
      created_at: editingInst?.created_at || new Date().toISOString(),
    };

    await saveInstitution(instToSave);
    setShowAddInstModal(false);

    // If edited institution is current active institution, sync it immediately
    if (activeInstitution.id === instToSave.id) {
      saveActiveToken(instToSave.token_lembaga);
      onSwitchInstitution(instToSave);
    }

    onRefreshInstitutions();
  };

  const handleDeleteInstitution = async () => {
    if (!instToDelete) return;
    if (deleteInstConfirmInput.trim() !== instToDelete.name.trim()) {
      alert("Nama lembaga tidak sesuai dengan konfirmasi.");
      return;
    }
    await deleteInstitution(instToDelete.id);
    setInstToDelete(null);
    setDeleteInstConfirmInput("");
    onRefreshInstitutions();
  };

  const daysList: ("Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat")[] = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Banner Info Lembaga & Token Cepat */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center text-2xl shrink-0">
              {activeInstitution.logo_url || "🏫"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {activeInstitution.name}
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Jenjang {activeInstitution.education_level}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  NPSN: {activeInstitution.npsn || "20108891"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Panel Administrasi & Manajemen Akademik Lengkap • MySch
              </p>
            </div>
          </div>

          {/* Token Lembaga Card */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                TOKEN LEMBAGA GURU:
              </p>
              <div className="flex items-center gap-1.5">
                <p className="font-mono text-base font-black text-teal-900 tracking-wider">
                  {activeInstitution.token_lembaga}
                </p>
                {user.role === "SUPER_ADMIN" && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditInst(activeInstitution)}
                    className="p-1 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-slate-200 transition cursor-pointer"
                    title="Ubah Token Lembaga (Super Admin)"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyToken}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition cursor-pointer"
                title="Salin Token"
              >
                {copiedToken ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShareWA}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                title="Kirim ke WhatsApp Guru"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan WA</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigasi Tab Admin Lengkap */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab("jadwal")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "jadwal"
              ? "bg-teal-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-4 h-4" /> Matriks Jadwal ({schedules.length})
        </button>

        <button
          onClick={() => setActiveTab("kelas")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "kelas"
              ? "bg-teal-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Kelola Kelas ({classes.length})
        </button>

        <button
          onClick={() => setActiveTab("mapel")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "mapel"
              ? "bg-teal-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Mata Pelajaran ({subjects.length})
        </button>

        <button
          onClick={() => setActiveTab("guru")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "guru"
              ? "bg-teal-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" /> Data Guru & Akun ({teachers.length})
        </button>

        <button
          onClick={() => setActiveTab("monitor")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "monitor"
              ? "bg-teal-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Monitoring Harian
        </button>

        {user.role === "SUPER_ADMIN" && (
          <button
            onClick={() => setActiveTab("lembaga")}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "lembaga"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-4 h-4" /> Kelola Lembaga ({institutions.length})
          </button>
        )}
      </div>

      {/* ================= TAB 1: MATRIKS JADWAL MINGGUAN ================= */}
      {activeTab === "jadwal" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Penyusun Jadwal Mingguan (Timetable)
              </h2>
              <p className="text-xs text-slate-500">
                Dilengkapi mesin pencegah bentrok guru otomatis.
              </p>
            </div>
            <button
              onClick={() => {
                setConflictWarning("");
                setShowAddScheduleModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Tambah Slot Jadwal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {daysList.map((day) => {
              const daySchedules = schedules.filter((s) => s.day_of_week === day);
              return (
                <div
                  key={day}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs"
                >
                  <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-800">{day}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {daySchedules.length} Sesi
                    </span>
                  </div>

                  <div className="p-2 space-y-2 flex-1 min-h-[140px] bg-slate-50/40">
                    {daySchedules.length === 0 ? (
                      <div className="h-full flex items-center justify-center p-4 text-center">
                        <p className="text-[11px] text-slate-400 italic">Tidak ada jadwal</p>
                      </div>
                    ) : (
                      daySchedules
                        .sort((a, b) => a.start_period - b.start_period)
                        .map((sch) => {
                          const tName = getTeacherName(sch.teacher_id);
                          const cName = getClassName(sch.class_id);
                          const sName = getSubjectName(sch.subject_id);

                          return (
                            <div
                              key={sch.id}
                              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 shadow-2xs transition group relative"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-black text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                                  Kelas {cName}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {sch.start_time}-{sch.end_time}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteSchedule(sch.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-50 rounded transition"
                                    title="Hapus Jadwal"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <p className="font-bold text-xs text-slate-900 leading-tight">
                                {sName}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                👤 {tName}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                                Jam Ke: {sch.start_period} - {sch.end_period}
                              </p>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: KELOLA KELAS & SISWA ================= */}
      {activeTab === "kelas" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Manajemen Kelas & Rombongan Belajar (Rombel)
              </h2>
              <p className="text-xs text-slate-500">
                Kelola daftar kelas, tingkat, wali kelas, serta daftar nama siswa per rombel.
              </p>
            </div>
            <button
              onClick={handleOpenAddClass}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Tambah Kelas Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const count = allStudents.filter((s) => s.class_id === cls.id).length;
              const homeroom = teachers.find((t) => t.id === cls.homeroom_teacher_id);
              const classSchedulesCount = schedules.filter((s) => s.class_id === cls.id).length;

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900">{cls.name}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                          Tingkat {cls.grade_level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tahun Ajaran: {cls.academic_year}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditClass(cls)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100"
                        title="Edit Kelas"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Wali Kelas:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[170px]">
                        {homeroom ? homeroom.name : "Belum ditentukan"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Jumlah Siswa:</span>
                      <span className="font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                        {count} Siswa
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Beban Jadwal:</span>
                      <span className="font-bold text-slate-700">{classSchedulesCount} Sesi / Pekan</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenStudentsModal(cls)}
                    className="w-full py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-teal-200 transition cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" /> Kelola Daftar Siswa ({count})
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: MATA PELAJARAN ================= */}
      {activeTab === "mapel" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Manajemen Mata Pelajaran (Kurikulum)
              </h2>
              <p className="text-xs text-slate-500">
                Atur kode, nama mata pelajaran, dan lihat guru yang mengampunya. Tiap guru bisa mengampu lebih dari 1 mata pelajaran.
              </p>
            </div>
            <button
              onClick={handleOpenAddSubject}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Tambah Mata Pelajaran
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Kode Mapel</th>
                    <th className="py-3 px-4">Nama Mata Pelajaran</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Guru Pengampu Terdaftar</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((sub) => {
                    const assignedTeachers = teachers.filter(
                      (t) =>
                        (t.subject_ids && t.subject_ids.includes(sub.id)) ||
                        (t.subject_name && t.subject_name.toLowerCase().includes(sub.name.toLowerCase()))
                    );

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                          <span className="bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                            {sub.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                          {sub.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              sub.category === "Wajib"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : sub.category === "Pilihan"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {sub.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {assignedTeachers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedTeachers.map((at) => (
                                <span
                                  key={at.id}
                                  className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                                >
                                  {at.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Belum ada guru yang ditugaskan
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditSubject(sub)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100"
                              title="Edit Mapel"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubject(sub)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Hapus Mapel"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: DATA GURU & AKUN PENGGUNA ================= */}
      {activeTab === "guru" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Data Guru, Multi-Mata Pelajaran & Manajemen Akun
              </h2>
              <p className="text-xs text-slate-500">
                Guru dapat mengampu lebih dari 1 mata pelajaran. Kelola PIN/password lupa akun, dan profil guru.
              </p>
            </div>
            <button
              onClick={handleOpenAddTeacher}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Daftarkan Guru Baru
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Nama Guru</th>
                    <th className="py-3 px-4">NIP / ID</th>
                    <th className="py-3 px-4">Mata Pelajaran yang Diampu</th>
                    <th className="py-3 px-4">Beban Jam</th>
                    <th className="py-3 px-4">Status & PIN</th>
                    <th className="py-3 px-4 text-right">Aksi Akun</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map((t) => {
                    const teacherSchedules = schedules.filter((s) => s.teacher_id === t.id);
                    // Determine subjects
                    const assignedSubjectNames = (t.subject_ids || [])
                      .map((id) => subjects.find((s) => s.id === id)?.name)
                      .filter(Boolean);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0">
                              {t.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{t.name}</p>
                              <p className="text-[10px] text-slate-400">{t.phone || "No WA belum diisi"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{t.nip}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {assignedSubjectNames.length > 0 ? (
                              assignedSubjectNames.map((sn, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md"
                                >
                                  {sn}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-600">
                                {t.subject_name || "Guru Umum"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-teal-700">
                          {teacherSchedules.length * 2} Jam Pelajaran
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                            PIN: {t.pin}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenResetPin(t)}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1 transition"
                              title="Reset Password / PIN Guru"
                            >
                              <Key className="w-3 h-3" /> Reset PIN
                            </button>
                            <button
                              onClick={() => handleOpenEditTeacher(t)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100"
                              title="Edit Profil & Mapel Guru"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setUserToDelete(t)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Hapus Akun Guru"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: MONITORING HARI INI ================= */}
      {activeTab === "monitor" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Live Monitoring Pengisian Jurnal Hari Ini
              </h2>
              <p className="text-xs text-slate-500">
                Pantau kepatuhan guru dan keterisian jam belajar kelas secara real-time.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Cetak / Ekspor Rekapitulasi
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-bold text-emerald-800 uppercase">Jurnal Lengkap</p>
              <p className="text-2xl font-black text-emerald-950 mt-1">{journals.length}</p>
              <p className="text-[11px] text-emerald-700">Sudah diisi guru hari ini</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-bold text-amber-800 uppercase">Belum Diisi</p>
              <p className="text-2xl font-black text-amber-950 mt-1">
                {Math.max(0, schedules.length - journals.length)}
              </p>
              <p className="text-[11px] text-amber-700">Memerlukan pengisian / colek</p>
            </div>
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
              <p className="text-xs font-bold text-teal-800 uppercase">Persentase Kepatuhan</p>
              <p className="text-2xl font-black text-teal-950 mt-1">
                {schedules.length > 0
                  ? Math.round((journals.length / schedules.length) * 100)
                  : 100}
                %
              </p>
              <p className="text-[11px] text-teal-700">Standar supervisi sekolah</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="divide-y divide-slate-100">
              {schedules.map((sch) => {
                const jrn = journals.find((j) => j.schedule_id === sch.id);
                const isFilled = Boolean(jrn);
                const tName = getTeacherName(sch.teacher_id);
                const cName = getClassName(sch.class_id);
                const sName = getSubjectName(sch.subject_id);

                return (
                  <div
                    key={sch.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{tName}</span>
                        <span className="text-xs font-mono text-slate-500">
                          (Kelas {cName} • {sName})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {sch.day_of_week}, Jam Ke {sch.start_period}-{sch.end_period} ({sch.start_time} - {sch.end_time} WIB)
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isFilled ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Jurnal Lengkap ({jrn?.student_present_count} Hadir)
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> Belum Diisi
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const msg = `Halo ${tName}, mohon mengisi jurnal mengajar harian untuk Kelas ${cName} (${sName}) di aplikasi MySch.`;
                              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                          >
                            Colek WA
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: KELOLA MULTI-LEMBAGA ================= */}
      {activeTab === "lembaga" && user.role === "SUPER_ADMIN" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Manajemen Lembaga Terdaftar (Multi-Tenancy Super Admin)
              </h2>
              <p className="text-xs text-slate-500">
                Kelola seluruh sekolah, buat lembaga baru, atau hapus lembaga yang sudah tidak aktif.
              </p>
            </div>
            <button
              onClick={handleOpenAddInst}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Daftarkan Lembaga Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {institutions.map((inst) => {
              const isCurrent = inst.id === activeInstitution.id;
              return (
                <div
                  key={inst.id}
                  className={`bg-white rounded-2xl p-5 border shadow-2xs space-y-4 flex flex-col justify-between ${
                    isCurrent ? "border-teal-500 ring-2 ring-teal-500/20" : "border-slate-200"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-xl">
                        {inst.logo_url || "🏫"}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {inst.education_level}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                            Aktif
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{inst.name}</h3>
                      <p className="text-xs text-slate-500">NPSN: {inst.npsn || "20108891"}</p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Token Guru:</p>
                      <p className="font-mono text-sm font-black text-teal-900 tracking-wider">
                        {inst.token_lembaga}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
                    {!isCurrent && (
                      <button
                        onClick={() => onSwitchInstitution(inst)}
                        className="py-1.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer"
                      >
                        Beralih
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditInst(inst)}
                      className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                      title="Edit Token & Informasi Lembaga"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Token
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inst.token_lembaga);
                        alert(`Token ${inst.token_lembaga} berhasil disalin!`);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                      title="Salin Token"
                    >
                      Salin
                    </button>
                    <button
                      onClick={() => {
                        setInstToDelete(inst);
                        setDeleteInstConfirmInput("");
                      }}
                      className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                      title="Hapus Lembaga Ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH JADWAL ================= */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Slot Jadwal Baru</h3>
              <button
                onClick={() => setShowAddScheduleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Guru Pengampu</label>
                <select
                  value={newSchTeacherId}
                  onChange={(e) => handleTeacherChangeInSchedule(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subject_name || "Guru"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kelas / Rombel</label>
                <select
                  value={newSchClassId}
                  onChange={(e) => setNewSchClassId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Kelas {c.name} (Tingkat {c.grade_level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <select
                  value={newSchSubjectId}
                  onChange={(e) => setNewSchSubjectId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hari</label>
                  <select
                    value={newSchDay}
                    onChange={(e) => {
                      const dayVal = e.target.value as any;
                      setNewSchDay(dayVal);
                      const warning = checkConflict(newSchTeacherId, dayVal, newSchStartPeriod, newSchEndPeriod);
                      setConflictWarning(warning);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  >
                    {daysList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Ke (Awal)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newSchStartPeriod}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewSchStartPeriod(val);
                      const warning = checkConflict(newSchTeacherId, newSchDay, val, newSchEndPeriod);
                      setConflictWarning(warning);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Ke (Akhir)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newSchEndPeriod}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewSchEndPeriod(val);
                      const warning = checkConflict(newSchTeacherId, newSchDay, newSchStartPeriod, val);
                      setConflictWarning(warning);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Mulai</label>
                  <input
                    type="time"
                    value={newSchStartTime}
                    onChange={(e) => setNewSchStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Selesai</label>
                  <input
                    type="time"
                    value={newSchEndTime}
                    onChange={(e) => setNewSchEndTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              {conflictWarning && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold">
                  {conflictWarning}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddScheduleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={Boolean(conflictWarning)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold disabled:opacity-50"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH / EDIT KELAS ================= */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingClass ? "Edit Data Kelas" : "Tambah Kelas Baru"}
              </h3>
              <button
                onClick={() => setShowClassModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Rombel / Kelas</label>
                <input
                  type="text"
                  placeholder="Contoh: VII-A atau X-MIPA-1"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat Kelas</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={classGrade}
                    onChange={(e) => setClassGrade(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={classYear}
                    onChange={(e) => setClassYear(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Wali Kelas</label>
                <select
                  value={classHomeroomId}
                  onChange={(e) => setClassHomeroomId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                >
                  <option value="">-- Pilih Wali Kelas (Opsional) --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  {editingClass ? "Simpan Perubahan" : "Buat Kelas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KELOLA DAFTAR SISWA KELAS ================= */}
      {selectedClassForStudents && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Daftar Siswa Kelas {selectedClassForStudents.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Total: {classStudents.length} siswa ({classStudents.filter((s) => s.gender === "L").length} Laki-laki, {classStudents.filter((s) => s.gender === "P").length} Perempuan)
                </p>
              </div>
              <button
                onClick={() => setSelectedClassForStudents(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Form Tambah Siswa Baru */}
            <form onSubmit={handleAddStudent} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-2 items-end text-xs">
              <div className="flex-1 min-w-[140px]">
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Maulana"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>
              <div className="w-32">
                <label className="block font-bold text-slate-700 mb-1">NISN (Opsional)</label>
                <input
                  type="text"
                  placeholder="0081234567"
                  value={newStudentNisn}
                  onChange={(e) => setNewStudentNisn(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>
              <div className="w-24">
                <label className="block font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={newStudentGender}
                  onChange={(e) => setNewStudentGender(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            </form>

            {/* Tabel Siswa */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">NISN</th>
                    <th className="py-2.5 px-3">Nama Lengkap</th>
                    <th className="py-2.5 px-3">L/P</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{s.nisn}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{s.full_name}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.gender === "L" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                          }`}
                        >
                          {s.gender === "L" ? "L" : "P"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleDeleteStudent(s.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {classStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        Belum ada siswa di kelas ini. Tambahkan siswa pertama di atas!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedClassForStudents(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH / EDIT MAPEL ================= */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingSubject ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}
              </h3>
              <button
                onClick={() => setShowSubjectModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Mata Pelajaran</label>
                <input
                  type="text"
                  placeholder="Contoh: MAT-01 atau IPA-01"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  placeholder="Contoh: Matematika"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Kurikulum</label>
                <select
                  value={subjectCategory}
                  onChange={(e) => setSubjectCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                >
                  <option value="Wajib">Wajib (Nasional)</option>
                  <option value="Pilihan">Pilihan / Peminatan</option>
                  <option value="Muatan Lokal">Muatan Lokal</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  {editingSubject ? "Simpan Perubahan" : "Tambah Mapel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH / EDIT GURU (MULTI-MAPEL) ================= */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingTeacher ? "Edit Profil & Mapel Guru" : "Daftarkan Guru Baru"}
              </h3>
              <button
                onClick={() => setShowTeacherModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-3 text-xs flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Subagyo, S.Pd"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIP atau ID Guru (Untuk Login)</label>
                <input
                  type="text"
                  placeholder="Contoh: 198504122010011002"
                  value={teacherNip}
                  onChange={(e) => setTeacherNip(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp</label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={teacherPhone}
                    onChange={(e) => setTeacherPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran / Hak Akses</label>
                  <select
                    value={teacherRole}
                    onChange={(e) => setTeacherRole(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="TEACHER">Guru Pengajar</option>
                    <option value="ADMIN">Admin Kurikulum</option>
                    <option value="HEADMASTER">Kepala Sekolah</option>
                  </select>
                </div>
              </div>

              {/* Multi-Mapel Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mata Pelajaran yang Diampu (Bisa Pilih &gt; 1):
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 max-h-36 overflow-y-auto">
                  {subjects.map((s) => {
                    const isSelected = teacherSelectedSubjectIds.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleSubjectForTeacher(s.id)}
                        className={`p-2 rounded-xl text-left border flex items-center justify-between text-[11px] transition cursor-pointer ${
                          isSelected
                            ? "bg-teal-50 border-teal-500 text-teal-900 font-bold"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span className="truncate">{s.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                      </button>
                    );
                  })}
                  {subjects.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic col-span-2">
                      Belum ada mata pelajaran terdaftar di lembaga ini.
                    </p>
                  )}
                </div>
              </div>

              {!editingTeacher && (
                <p className="text-[11px] text-slate-400">
                  PIN masuk default guru baru adalah <strong>123456</strong>. Guru dapat mengubahnya nanti atau admin dapat meresetnya jika lupa password.
                </p>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  {editingTeacher ? "Simpan Perubahan" : "Daftarkan Guru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL RESET PIN GURU ================= */}
      {showResetPinModal && targetUserForReset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reset PIN / Password Guru</h3>
                  <p className="text-xs text-slate-500">{targetUserForReset.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowResetPinModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteResetPin} className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-slate-600">
                  <strong>NIP:</strong> {targetUserForReset.nip}
                </p>
                <p className="text-slate-600">
                  <strong>Token Lembaga:</strong> {activeInstitution.token_lembaga}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN Baru (6 Digit)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={newPinValue}
                  onChange={(e) => setNewPinValue(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-center text-lg font-bold tracking-widest"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewPinValue("123456")}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Set Default (123456)
                </button>
              </div>

              {resetSuccessMsg && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold space-y-2">
                  <p>{resetSuccessMsg}</p>
                  <button
                    type="button"
                    onClick={handleShareResetPinWA}
                    className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Kirim Akun via WhatsApp ke Guru
                  </button>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResetPinModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Simpan PIN Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS GURU ================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Hapus Akun Guru?</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus akun guru <strong>{userToDelete.name}</strong> (NIP: {userToDelete.nip})?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH LEMBAGA (SUPER ADMIN) ================= */}
      {showAddInstModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingInst ? "Edit Lembaga & Token Akses" : "Daftarkan Lembaga Baru"}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingInst
                    ? "Ubah Token Lembaga atau data identitas sekolah secara fleksibel."
                    : "Tambahkan cabang sekolah baru di bawah naungan yayasan Anda."}
                </p>
              </div>
              <button
                onClick={() => setShowAddInstModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInstitution} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lembaga / Sekolah</label>
                <input
                  type="text"
                  placeholder="Contoh: SMK Pancasila 5 Wonogiri"
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Token Lembaga (Kode Akses Guru Masuk)</label>
                <input
                  type="text"
                  placeholder="Contoh: SMKPAN5"
                  value={newInstToken}
                  onChange={(e) => setNewInstToken(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono uppercase font-black text-teal-900 text-sm tracking-wider"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Token ini dimasukkan guru saat login. Anda dapat mengubahnya kapan saja agar fleksibel menyesuaikan (misal: <strong>SMKPAN5</strong>, <strong>SMKPANCASILA5</strong>, dll).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenjang Pendidikan</label>
                  <select
                    value={newInstLevel}
                    onChange={(e) => setNewInstLevel(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="SD">SD / MI</option>
                    <option value="SMP">SMP / MTs</option>
                    <option value="SMA">SMA / MA</option>
                    <option value="SMK">SMK</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NPSN (Opsional)</label>
                  <input
                    type="text"
                    placeholder="20311283"
                    value={newInstNpsn}
                    onChange={(e) => setNewInstNpsn(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddInstModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                >
                  {editingInst ? "Simpan Perubahan Token" : "Daftarkan Lembaga"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL HAPUS LEMBAGA (SUPER ADMIN) ================= */}
      {instToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Lembaga</h3>
                <p className="text-xs text-slate-500">Tindakan ini permanen dan tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
              <p>
                Anda akan menghapus lembaga: <strong>{instToDelete.name}</strong> (Token: {instToDelete.token_lembaga}).
              </p>
              <p>
                Untuk melanjutkan, ketik persis nama lembaga di bawah ini:
              </p>
              <input
                type="text"
                placeholder={instToDelete.name}
                value={deleteInstConfirmInput}
                onChange={(e) => setDeleteInstConfirmInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-rose-300 bg-white font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setInstToDelete(null);
                  setDeleteInstConfirmInput("");
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteInstConfirmInput.trim() !== instToDelete.name.trim()}
                onClick={handleDeleteInstitution}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-40"
              >
                Hapus Lembaga Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
