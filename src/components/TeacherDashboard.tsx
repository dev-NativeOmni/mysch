"use client";

import React, { useState, useEffect } from "react";
import { User, Institution, Schedule, JournalEntry, ClassRoom, Subject, SubstituteAssignment } from "@/lib/types";
import { getSchedules, getJournals, getClasses, getSubjects, getUsers, getSubstitutions } from "@/lib/storage";
import {
  getLocalDateString,
  getIndoDayName,
  getCurrentTimeString,
  getScheduleTiming,
  sortSchedulesByTime,
} from "@/lib/dateUtils";
import { JournalWizardModal } from "./JournalWizardModal";
import { JournalHistoryModal } from "./JournalHistoryModal";
import { ProfileModal } from "./ProfileModal";
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  PenTool,
  History,
  ChevronRight,
  User as UserIcon,
  PartyPopper,
  UserCheck,
  Search,
  X,
} from "lucide-react";

interface TeacherDashboardProps {
  user: User;
  activeInstitution: Institution;
  onUserUpdated?: (user: User) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  activeInstitution,
  onUserUpdated,
}) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [allJournals, setAllJournals] = useState<JournalEntry[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [substitutions, setSubstitutions] = useState<SubstituteAssignment[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Jam sekarang, diperbarui tiap menit agar status "Sedang Berlangsung" ikut berganti
  const [now, setNow] = useState(() => new Date());

  // Modal Wizard & Inval State
  const [activeWizardSchedule, setActiveWizardSchedule] = useState<Schedule | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showInvalPickerModal, setShowInvalPickerModal] = useState(false);
  const [invalSearchQuery, setInvalSearchQuery] = useState("");

  // Load teacher's schedules and journals
  const loadData = async () => {
    setLoading(true);
    try {
      const [instSchedules, instJournals, clsList, subList, userList, subAssignments] = await Promise.all([
        getSchedules(activeInstitution.id),
        getJournals(activeInstitution.id),
        getClasses(activeInstitution.id),
        getSubjects(activeInstitution.id),
        getUsers(activeInstitution.id),
        getSubstitutions(activeInstitution.id),
      ]);

      setAllSchedules(instSchedules);
      setSchedules(instSchedules.filter((s) => s.teacher_id === user.id));
      setAllJournals(instJournals);
      setJournals(instJournals.filter((j) => j.actual_teacher_id === user.id));
      setClasses(clsList);
      setSubjects(subList);
      setTeachers(userList);
      setSubstitutions(subAssignments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, activeInstitution.id]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Helper name lookups
  const getClassName = (classId: string) => classes.find((c) => c.id === classId)?.name || "-";
  const getSubjectName = (subjectId: string) =>
    subjects.find((s) => s.id === subjectId)?.name || user.subject_name || "Mata Pelajaran";
  const getTeacherName = (teacherId: string) =>
    teachers.find((t) => t.id === teacherId)?.name || "Guru Jadwal";

  // Hanya jadwal untuk HARI INI, urut dari jam paling pagi
  const todayStr = getLocalDateString(now);
  const todayName = getIndoDayName(now);
  const nowTime = getCurrentTimeString(now);
  const todaySchedules = sortSchedulesByTime(schedules.filter((s) => s.day_of_week === todayName));

  const getJournalForSchedule = (scheduleId: string) =>
    allJournals.find((j) => j.schedule_id === scheduleId && j.entry_date === todayStr);

  // Jadwal Inval (ditugaskan Admin hari ini atau sudah diisi sendiri sebagai pengganti hari ini)
  const todayAssignedInvalIds = new Set(
    substitutions
      .filter((sub) => sub.assign_date === todayStr && sub.substitute_teacher_id === user.id)
      .map((sub) => sub.schedule_id)
  );
  const invalSchedulesToday = sortSchedulesByTime(
    allSchedules.filter((sch) => {
      if (sch.day_of_week !== todayName || sch.teacher_id === user.id) return false;
      if (todayAssignedInvalIds.has(sch.id)) return true;
      const jrn = getJournalForSchedule(sch.id);
      return Boolean(jrn && jrn.actual_teacher_id === user.id);
    })
  );

  // Daftar jadwal guru lain hari ini yang belum terisi (untuk modal Bantu Mengajar / Inval)
  const availableInvalCandidates = sortSchedulesByTime(
    allSchedules.filter(
      (sch) =>
        sch.day_of_week === todayName &&
        sch.teacher_id !== user.id &&
        !getJournalForSchedule(sch.id)
    )
  ).filter((sch) => {
    if (!invalSearchQuery.trim()) return true;
    const q = invalSearchQuery.toLowerCase();
    return (
      getTeacherName(sch.teacher_id).toLowerCase().includes(q) ||
      getClassName(sch.class_id).toLowerCase().includes(q) ||
      getSubjectName(sch.subject_id).toLowerCase().includes(q)
    );
  });

  // Pilih jadwal untuk kartu utama:
  // 1) yang sedang berlangsung & belum diisi, 2) yang sudah lewat tapi belum diisi,
  // 3) yang sedang berlangsung (sudah diisi), 4) yang berikutnya belum diisi
  const runningSchedule = todaySchedules.find((s) => getScheduleTiming(s, nowTime) === "running");
  const runningUnfilled = todaySchedules.find(
    (s) => getScheduleTiming(s, nowTime) === "running" && !getJournalForSchedule(s.id)
  );
  const pastUnfilled = todaySchedules.find(
    (s) => getScheduleTiming(s, nowTime) === "past" && !getJournalForSchedule(s.id)
  );
  const nextUnfilled = todaySchedules.find(
    (s) => getScheduleTiming(s, nowTime) === "upcoming" && !getJournalForSchedule(s.id)
  );
  const activeSchedule =
    runningUnfilled ||
    pastUnfilled ||
    runningSchedule ||
    nextUnfilled ||
    null;
  const activeTiming = activeSchedule ? getScheduleTiming(activeSchedule, nowTime) : null;
  const todayJournalOfActive = activeSchedule ? getJournalForSchedule(activeSchedule.id) : undefined;

  const filledTodayCount = todaySchedules.filter((s) => getJournalForSchedule(s.id)).length;
  const allFilled = todaySchedules.length > 0 && filledTodayCount === todaySchedules.length;

  // Format tanggal Indonesia
  const currentDateFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* 1. Header Salam Guru */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
            <Calendar className="w-4 h-4" />
            <span>{currentDateFormatted}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Selamat Bertugas, {user.name.split(",")[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{activeInstitution.name}</p>
        </div>

        {/* Tombol Profil, Inval & Riwayat Jurnal */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => {
              setInvalSearchQuery("");
              setShowInvalPickerModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-sm font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Bantu Mengajar (Inval)</span>
          </button>
          <button
            onClick={() => setShowProfileModal(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-sm font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <UserIcon className="w-4 h-4" />
            <span>Profil & PIN</span>
          </button>
          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-600" />
            <span>Riwayat Jurnal</span>
          </button>
        </div>
      </div>

      {/* 2. Kartu Utama */}
      {loading ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-sm text-slate-500">
          Memuat jadwal hari ini...
        </div>
      ) : activeSchedule ? (
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-teal-700 to-teal-900 text-white p-6 shadow-xl shadow-teal-900/15">
          {/* Subtle background decoration */}
          <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/5 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between gap-2 mb-3">
            {activeTiming === "running" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-400 text-teal-950 shadow-sm animate-pulse-subtle">
                <span className="w-2 h-2 rounded-full bg-teal-950 animate-ping" />
                Sedang Berlangsung
              </span>
            ) : activeTiming === "past" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-300 text-amber-950 shadow-sm">
                Sudah Selesai, Jurnal Belum Diisi
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 text-white">
                Jadwal Berikutnya
              </span>
            )}
          </div>

          <div className="space-y-1 mb-5">
            <p className="text-base font-semibold text-teal-100">
              {getSubjectName(activeSchedule.subject_id)}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Kelas {getClassName(activeSchedule.class_id)}
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-teal-100 pt-1">
              <Clock className="w-4 h-4" /> Pukul {activeSchedule.start_time} - {activeSchedule.end_time}
            </p>
          </div>

          {/* Tombol Aksi Utama */}
          {todayJournalOfActive ? (
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-white/15">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-400 text-teal-950 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">Jurnal sudah diisi</p>
                  <p className="text-sm text-teal-100 truncate">
                    {todayJournalOfActive.student_present_count} siswa hadir • {todayJournalOfActive.topic_materials}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveWizardSchedule(activeSchedule)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-teal-900 font-bold text-sm hover:bg-teal-50 transition cursor-pointer"
              >
                Lihat / Ubah
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveWizardSchedule(activeSchedule)}
              className="w-full py-4 px-5 rounded-2xl bg-white hover:bg-teal-50 active:bg-teal-100 text-teal-950 font-black text-base shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <PenTool className="w-5 h-5 text-teal-700" />
              <span>Isi Jurnal Sekarang</span>
            </button>
          )}
        </div>
      ) : allFilled ? (
        <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-200 text-center space-y-2">
          <PartyPopper className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-emerald-900">Semua jurnal hari ini sudah diisi</h3>
          <p className="text-sm text-emerald-800">Terima kasih, Bapak/Ibu. Selamat beristirahat!</p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Hari ini tidak ada jadwal mengajar</h3>
          <p className="text-sm text-slate-500">
            Jika menurut Anda ini keliru, hubungi Wakasek Kurikulum agar jadwal Anda didaftarkan.
          </p>
        </div>
      )}

      {/* 3. Daftar Jadwal Mengajar Hari Ini */}
      {todaySchedules.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" /> Jadwal Hari Ini
            </h3>
            <span className="text-sm text-slate-500">
              {filledTodayCount} dari {todaySchedules.length} sudah diisi
            </span>
          </div>

          <div className="space-y-2.5">
            {todaySchedules.map((sch) => {
              const jrn = getJournalForSchedule(sch.id);
              const timing = getScheduleTiming(sch, nowTime);

              let badge: { text: string; className: string };
              if (jrn) {
                badge = {
                  text: `Sudah diisi • ${jrn.student_present_count} hadir`,
                  className: "text-emerald-700 bg-emerald-50 border-emerald-200",
                };
              } else if (timing === "running") {
                badge = { text: "Sedang berlangsung", className: "text-teal-700 bg-teal-50 border-teal-200" };
              } else if (timing === "past") {
                badge = { text: "Belum diisi", className: "text-amber-800 bg-amber-50 border-amber-200" };
              } else {
                badge = { text: "Nanti", className: "text-slate-600 bg-slate-50 border-slate-200" };
              }

              return (
                <button
                  type="button"
                  key={sch.id}
                  onClick={() => setActiveWizardSchedule(sch)}
                  className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    !jrn && timing === "past"
                      ? "bg-amber-50/50 border-amber-200 hover:border-amber-300"
                      : "bg-white border-slate-200 hover:border-teal-300"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 ${
                        jrn ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {jrn ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <span className="text-sm">{sch.start_time}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-base truncate">
                        Kelas {getClassName(sch.class_id)}
                      </p>
                      <p className="text-sm text-slate-600 truncate">
                        {getSubjectName(sch.subject_id)} • {sch.start_time} - {sch.end_time}
                      </p>
                      <span
                        className={`mt-1 inline-flex sm:hidden text-xs font-bold px-2 py-0.5 rounded-full border ${badge.className}`}
                      >
                        {badge.text}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`hidden sm:inline-flex text-xs font-bold px-2.5 py-1 rounded-full border ${badge.className}`}
                    >
                      {badge.text}
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3B. Tugas Guru Pengganti (Inval) Hari Ini */}
      {invalSchedulesToday.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-indigo-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" /> Tugas Guru Pengganti (Inval) Hari Ini
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {invalSchedulesToday.length} Jadwal
            </span>
          </div>

          <div className="space-y-2.5">
            {invalSchedulesToday.map((sch) => {
              const jrn = getJournalForSchedule(sch.id);
              const originalName = getTeacherName(sch.teacher_id);
              return (
                <button
                  type="button"
                  key={`inval-${sch.id}`}
                  onClick={() => setActiveWizardSchedule(sch)}
                  className="w-full text-left p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 hover:border-indigo-300 transition cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 ${
                        jrn ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {jrn ? <CheckCircle2 className="w-6 h-6" /> : <span className="text-sm">{sch.start_time}</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 text-base truncate">
                          Kelas {getClassName(sch.class_id)}
                        </p>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                          Inval: {originalName}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">
                        {getSubjectName(sch.subject_id)} • {sch.start_time} - {sch.end_time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`hidden sm:inline-flex text-xs font-bold px-2.5 py-1 rounded-full border ${
                        jrn
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : "text-indigo-700 bg-white border-indigo-200"
                      }`}
                    >
                      {jrn ? `Sudah diisi • ${jrn.student_present_count} hadir` : "Isi Jurnal Inval"}
                    </span>
                    <ChevronRight className="w-5 h-5 text-indigo-400" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Wizard Pengisian Jurnal */}
      {activeWizardSchedule && (
        <JournalWizardModal
          isOpen={Boolean(activeWizardSchedule)}
          onClose={() => setActiveWizardSchedule(null)}
          schedule={activeWizardSchedule}
          existingJournal={getJournalForSchedule(activeWizardSchedule.id)}
          user={user}
          activeInstitution={activeInstitution}
          isSubstitute={activeWizardSchedule.teacher_id !== user.id}
          originalTeacherId={activeWizardSchedule.teacher_id}
          originalTeacherName={getTeacherName(activeWizardSchedule.teacher_id)}
          onSaved={() => {
            loadData();
          }}
        />
      )}

      {/* Modal Pilih Jadwal Guru Inval (Self-Service) */}
      {showInvalPickerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/60">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Bantu Mengajar (Guru Pengganti / Inval)</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Pilih jadwal hari ini ({todayName}) yang guru pengampunya berhalangan hadir.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInvalPickerModal(false)}
                className="p-2 rounded-full hover:bg-slate-200/70 text-slate-600 transition cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={invalSearchQuery}
                  onChange={(e) => setInvalSearchQuery(e.target.value)}
                  placeholder="Cari nama guru, kelas, atau mata pelajaran..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {availableInvalCandidates.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  Tidak ada jadwal guru lain yang belum terisi hari ini.
                </div>
              ) : (
                availableInvalCandidates.map((sch) => (
                  <div
                    key={sch.id}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">
                        Kelas {getClassName(sch.class_id)} • {getSubjectName(sch.subject_id)}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Guru Asli: <strong>{getTeacherName(sch.teacher_id)}</strong> • {sch.start_time} - {sch.end_time}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowInvalPickerModal(false);
                        setActiveWizardSchedule(sch);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 transition cursor-pointer"
                    >
                      Isi Sebagai Pengganti
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Riwayat Jurnal Guru */}
      {showHistoryModal && (
        <JournalHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          journals={journals}
          activeInstitution={activeInstitution}
        />
      )}

      {/* Modal Profil & PIN Guru */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          activeInstitution={activeInstitution}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUserUpdated={(updatedUser) => {
            if (onUserUpdated) onUserUpdated(updatedUser);
          }}
        />
      )}
    </div>
  );
};
