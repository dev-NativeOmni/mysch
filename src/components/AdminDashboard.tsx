"use client";

import React, { useState, useEffect } from "react";
import { Institution, User, Schedule, ClassRoom, Subject, JournalEntry } from "@/lib/types";
import {
  getSchedules,
  getUsers,
  getClasses,
  getSubjects,
  getJournals,
  saveSchedule,
  saveUser,
  saveInstitution,
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
  QrCode,
  School,
  Sparkles,
} from "lucide-react";

interface AdminDashboardProps {
  user: User;
  activeInstitution: Institution;
  institutions: Institution[];
  onRefreshInstitutions: () => void;
  onSwitchInstitution: (inst: Institution) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  activeInstitution,
  institutions,
  onRefreshInstitutions,
  onSwitchInstitution,
}) => {
  const [activeTab, setActiveTab] = useState<"jadwal" | "guru" | "monitor" | "lembaga">("jadwal");

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);

  // Modal Tambah Jadwal
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

  // Modal Tambah Guru
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherNip, setNewTeacherNip] = useState("");
  const [newTeacherPhone, setNewTeacherPhone] = useState("");
  const [newTeacherSubject, setNewTeacherSubject] = useState("");

  // Modal Tambah Lembaga
  const [showAddInstModal, setShowAddInstModal] = useState(false);
  const [newInstName, setNewInstName] = useState("");
  const [newInstToken, setNewInstToken] = useState("");
  const [newInstLevel, setNewInstLevel] = useState<"SD" | "SMP" | "SMA" | "SMK">("SMP");

  const [copiedToken, setCopiedToken] = useState(false);

  const loadData = async () => {
    try {
      const [schList, uList, clsList, subList, jrnList] = await Promise.all([
        getSchedules(activeInstitution.id),
        getUsers(activeInstitution.id),
        getClasses(activeInstitution.id),
        getSubjects(activeInstitution.id),
        getJournals(activeInstitution.id),
      ]);

      setSchedules(schList);
      setTeachers(uList.filter((u) => u.role === "TEACHER" || u.role === "ADMIN"));
      setClasses(clsList);
      setSubjects(subList);
      setJournals(jrnList);

      if (clsList.length > 0 && !newSchClassId) setNewSchClassId(clsList[0].id);
      if (uList.length > 0 && !newSchTeacherId) setNewSchTeacherId(uList[0].id);
      if (subList.length > 0 && !newSchSubjectId) setNewSchSubjectId(subList[0].id);
    } catch (e) {
      console.error(e);
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
    const text = `Halo Bapak/Ibu Guru ${activeInstitution.name}. Silakan isi jurnal mengajar harian menggunakan Token Lembaga: *${activeInstitution.token_lembaga}* di aplikasi MySch.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Helper Lookups
  const getTeacherName = (tId: string) => teachers.find((t) => t.id === tId)?.name || "Guru";
  const getClassName = (cId: string) => classes.find((c) => c.id === cId)?.name || "Kelas";
  const getSubjectName = (sId: string) => subjects.find((s) => s.id === sId)?.name || "Mapel";

  // Check schedule conflict in real-time
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

  // Simpan Jadwal Baru
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const conflict = checkConflict(newSchTeacherId, newSchDay, newSchStartPeriod, newSchEndPeriod);
    if (conflict) {
      setConflictWarning(conflict);
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
    setConflictWarning("");
    loadData();
  };

  // Simpan Guru Baru
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const newT: User = {
      id: "user-" + Date.now(),
      institution_id: activeInstitution.id,
      nip: newTeacherNip.trim(),
      name: newTeacherName.trim(),
      phone: newTeacherPhone.trim() || "081200000000",
      pin: "123456",
      role: "TEACHER",
      subject_name: newTeacherSubject.trim(),
      is_active: true,
    };
    await saveUser(newT);
    setShowAddTeacherModal(false);
    loadData();
  };

  // Simpan Lembaga Baru
  const handleSaveInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    const newInst: Institution = {
      id: "inst-" + Date.now(),
      token_lembaga: newInstToken.trim().toUpperCase(),
      name: newInstName.trim(),
      education_level: newInstLevel,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    await saveInstitution(newInst);
    setShowAddInstModal(false);
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
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Panel Kurikulum & Penjadwalan Guru • NPSN: {activeInstitution.npsn || "20108891"}
              </p>
            </div>
          </div>

          {/* Token Lembaga Card */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                TOKEN LEMBAGA GURU:
              </p>
              <p className="font-mono text-base font-black text-teal-900 tracking-wider">
                {activeInstitution.token_lembaga}
              </p>
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
                <span>Bagikan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigasi Tab Admin */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab("jadwal")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "jadwal"
              ? "bg-teal-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-4 h-4" /> Matriks Jadwal Guru ({schedules.length})
        </button>

        <button
          onClick={() => setActiveTab("guru")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "guru"
              ? "bg-teal-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" /> Data Guru ({teachers.length})
        </button>

        <button
          onClick={() => setActiveTab("monitor")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "monitor"
              ? "bg-teal-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Monitoring Hari Ini
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
            <Building2 className="w-4 h-4" /> Kelola Multi-Lembaga ({institutions.length})
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
                Dilengkapi mesin validasi bentrok jadwal otomatis.
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

          {/* Grid Jadwal Mingguan */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {daysList.map((day) => {
              const daySchedules = schedules.filter((s) => s.day_of_week === day);
              return (
                <div
                  key={day}
                  className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-sm text-slate-900">{day}</span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {daySchedules.length} Sesi
                    </span>
                  </div>

                  <div className="space-y-2">
                    {daySchedules.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center italic">Kosong</p>
                    ) : (
                      daySchedules.map((sch) => (
                        <div
                          key={sch.id}
                          className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded">
                              Jam {sch.start_period}-{sch.end_period}
                            </span>
                            <span className="font-bold text-slate-800">
                              Kelas {getClassName(sch.class_id)}
                            </span>
                          </div>
                          <p className="font-bold text-teal-950 truncate">
                            {getSubjectName(sch.subject_id)}
                          </p>
                          <p className="text-[11px] text-slate-600 truncate">
                            {getTeacherName(sch.teacher_id)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {sch.start_time} - {sch.end_time}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: DATA GURU ================= */}
      {activeTab === "guru" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Daftar Guru Terdaftar
              </h2>
              <p className="text-xs text-slate-500">
                Guru dapat login menggunakan Token Lembaga dan NIP masing-masing.
              </p>
            </div>
            <button
              onClick={() => setShowAddTeacherModal(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
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
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-4">Beban Jam</th>
                    <th className="py-3 px-4">Status PIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map((t) => {
                    const teacherSchedules = schedules.filter((s) => s.teacher_id === t.id);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {t.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{t.nip}</td>
                        <td className="py-3 px-4">{t.subject_name || "Guru Pengampu"}</td>
                        <td className="py-3 px-4 font-bold text-teal-700">
                          {teacherSchedules.length * 2} Jam Pelajaran
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            PIN: {t.pin}
                          </span>
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

      {/* ================= TAB 3: MONITORING HARI INI ================= */}
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
                        <span className="font-bold text-sm text-slate-900">
                          {tName}
                        </span>
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
                              const msg = `Halo ${tName}, mohon mengisi jurnal mengajar harian untuk Kelas ${cName} (${sName}).`;
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

      {/* ================= TAB 4: KELOLA MULTI-LEMBAGA ================= */}
      {activeTab === "lembaga" && user.role === "SUPER_ADMIN" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Manajemen Lembaga Terdaftar (Multi-Tenancy)
              </h2>
              <p className="text-xs text-slate-500">
                Kelola seluruh sekolah di bawah naungan yayasan Anda dengan masing-masing token unik.
              </p>
            </div>
            <button
              onClick={() => setShowAddInstModal(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Daftarkan Lembaga Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {institutions.map((inst) => {
              const isCurrent = inst.id === activeInstitution.id;
              return (
                <div
                  key={inst.id}
                  className={`p-4 rounded-2xl border transition shadow-2xs space-y-3 ${
                    isCurrent ? "bg-teal-50/50 border-teal-300 ring-1 ring-teal-300" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{inst.logo_url || "🏫"}</span>
                    <span className="text-[11px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                      Jenjang {inst.education_level}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{inst.name}</h3>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Token:</span>
                      <span className="font-mono text-xs font-black text-teal-900 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        {inst.token_lembaga}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    {isCurrent ? (
                      <span className="text-xs font-bold text-teal-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Sedang Dikelola
                      </span>
                    ) : (
                      <button
                        onClick={() => onSwitchInstitution(inst)}
                        className="w-full py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
                      >
                        Beralih ke Lembaga Ini
                      </button>
                    )}
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
              <h3 className="text-base font-bold text-slate-900">
                Tambah Slot Jadwal Mengajar
              </h3>
              <button
                onClick={() => setShowAddScheduleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Guru Pengampu</label>
                <select
                  value={newSchTeacherId}
                  onChange={(e) => setNewSchTeacherId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  required
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subject_name || "Guru"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={newSchClassId}
                    onChange={(e) => setNewSchClassId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                    required
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <select
                    value={newSchSubjectId}
                    onChange={(e) => setNewSchSubjectId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                    required
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hari</label>
                  <select
                    value={newSchDay}
                    onChange={(e) => setNewSchDay(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  >
                    {daysList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Ke-</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newSchStartPeriod}
                    onChange={(e) => setNewSchStartPeriod(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sampai Ke-</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newSchEndPeriod}
                    onChange={(e) => setNewSchEndPeriod(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={newSchStartTime}
                    onChange={(e) => setNewSchStartTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={newSchEndTime}
                    onChange={(e) => setNewSchEndTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              {conflictWarning && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{conflictWarning}</span>
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
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH GURU ================= */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Daftarkan Guru Baru</h3>
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Subagyo, S.Pd"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIP atau ID Guru</label>
                <input
                  type="text"
                  placeholder="Contoh: 198504122010011002"
                  value={newTeacherNip}
                  onChange={(e) => setNewTeacherNip(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp</label>
                <input
                  type="text"
                  placeholder="081234567890"
                  value={newTeacherPhone}
                  onChange={(e) => setNewTeacherPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran Pokok</label>
                <input
                  type="text"
                  placeholder="Contoh: Bahasa Inggris"
                  value={newTeacherSubject}
                  onChange={(e) => setNewTeacherSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-400">
                PIN masuk default guru baru adalah <strong>123456</strong>. Guru dapat mengubahnya nanti.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Daftarkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH LEMBAGA ================= */}
      {showAddInstModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Lembaga Baru</h3>
              <button
                onClick={() => setShowAddInstModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInstitution} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lembaga / Sekolah</label>
                <input
                  type="text"
                  placeholder="Contoh: SMA Harapan 2"
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Token Lembaga (Kode Unik Guru)</label>
                <input
                  type="text"
                  placeholder="Contoh: SMAHARAPAN2"
                  value={newInstToken}
                  onChange={(e) => setNewInstToken(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono uppercase font-bold"
                  required
                />
              </div>

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

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddInstModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Simpan Lembaga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
