"use client";

import React, { useState, useEffect } from "react";
import { User, Institution, Schedule, JournalEntry, ClassRoom, Subject } from "@/lib/types";
import { getSchedules, getJournals, getClasses, getSubjects } from "@/lib/storage";
import { JournalWizardModal } from "./JournalWizardModal";
import { JournalHistoryModal } from "./JournalHistoryModal";
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  PenTool,
  History,
  Sparkles,
  Users,
  ChevronRight,
  School,
} from "lucide-react";

interface TeacherDashboardProps {
  user: User;
  activeInstitution: Institution;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  activeInstitution,
}) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Wizard State
  const [activeWizardSchedule, setActiveWizardSchedule] = useState<Schedule | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Load teacher's schedules and journals
  const loadData = async () => {
    setLoading(true);
    try {
      const [schList, jrnList, clsList, subList] = await Promise.all([
        getSchedules(activeInstitution.id, user.id),
        getJournals(activeInstitution.id, user.id),
        getClasses(activeInstitution.id),
        getSubjects(activeInstitution.id),
      ]);

      setSchedules(schList);
      setJournals(jrnList);
      setClasses(clsList);
      setSubjects(subList);
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

  // Helper name lookups
  const getClassName = (classId: string) =>
    classes.find((c) => c.id === classId)?.name || "Kelas VIII-A";
  const getSubjectName = (subjectId: string) =>
    subjects.find((s) => s.id === subjectId)?.name || user.subject_name || "Mata Pelajaran";

  // Check if a schedule is already filled today
  const todayStr = new Date().toISOString().split("T")[0];
  const getJournalForSchedule = (scheduleId: string) =>
    journals.find((j) => j.schedule_id === scheduleId && j.entry_date === todayStr);

  // Jadwal aktif saat ini (pilih yang belum diisi atau yang pertama)
  const activeSchedule =
    schedules.find((s) => !getJournalForSchedule(s.id)) || schedules[0] || null;

  const todayJournalOfActive = activeSchedule ? getJournalForSchedule(activeSchedule.id) : null;

  // Format tanggal Indonesia
  const currentDateFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* 1. Header Salam Guru */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
            <Calendar className="w-4 h-4" />
            <span>{currentDateFormatted}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Selamat Bertugas, {user.name.split(",")[0]} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lembaga: <span className="font-semibold text-slate-700">{activeInstitution.name}</span>
          </p>
        </div>

        {/* Tombol Riwayat Jurnal */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
        >
          <History className="w-4 h-4 text-slate-600" />
          <span>Lihat Riwayat Jurnal ({journals.length})</span>
        </button>
      </div>

      {/* 2. Hero Card "Jadwal Mengajar Saat Ini" (Mobile Ergonomics) */}
      {activeSchedule ? (
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-teal-700 to-teal-900 text-white p-6 shadow-xl shadow-teal-900/15">
          {/* Subtle background decoration */}
          <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/5 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-emerald-400 text-teal-950 shadow-sm animate-pulse-subtle">
              <span className="w-2 h-2 rounded-full bg-teal-950 animate-ping" />
              SEDANG BERLANGSUNG
            </span>

            <span className="text-xs text-teal-200 font-medium">
              Jam Ke {activeSchedule.start_period} - {activeSchedule.end_period}
            </span>
          </div>

          <div className="space-y-1 mb-5">
            <p className="text-sm font-semibold text-teal-200">
              {getSubjectName(activeSchedule.subject_id)}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Kelas {getClassName(activeSchedule.class_id)}
            </h2>
            <div className="flex items-center gap-4 text-xs text-teal-100 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {activeSchedule.start_time} - {activeSchedule.end_time} WIB
              </span>
              <span className="flex items-center gap-1">
                <School className="w-3.5 h-3.5" /> Ruang {getClassName(activeSchedule.class_id)}
              </span>
            </div>
          </div>

          {/* Tombol Aksi Utama Hero */}
          {todayJournalOfActive ? (
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-white/15">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-400 text-teal-950 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Jurnal Jam Ini Sudah Diisi</p>
                  <p className="text-[11px] text-teal-200">
                    Hadir: {todayJournalOfActive.student_present_count} siswa • Materi: {todayJournalOfActive.topic_materials}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveWizardSchedule(activeSchedule)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-teal-900 font-bold text-xs hover:bg-teal-50 transition cursor-pointer"
              >
                Ubah / Lengkapi
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveWizardSchedule(activeSchedule)}
              className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-teal-50 active:bg-teal-100 text-teal-950 font-black text-sm sm:text-base shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <PenTool className="w-5 h-5 text-teal-700" />
              <span>Mulai Isi Jurnal Sekarang (Presensi & Materi)</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Tidak Ada Jadwal Mengajar Aktif Hari Ini</h3>
          <p className="text-xs text-slate-500">
            Hubungi Wakasek Kurikulum jika jadwal mengajar Anda belum terdaftar.
          </p>
        </div>
      )}

      {/* 3. Daftar Jadwal Mengajar Hari Ini (Timeline) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" /> Agenda Mengajar Hari Ini ({schedules.length} Sesi)
          </h3>
          <span className="text-xs text-slate-500">
            {journals.filter((j) => j.entry_date === todayStr).length} dari {schedules.length} terisi
          </span>
        </div>

        <div className="space-y-2.5">
          {schedules.map((sch, index) => {
            const jrn = getJournalForSchedule(sch.id);
            const isCompleted = Boolean(jrn);

            return (
              <div
                key={sch.id}
                onClick={() => setActiveWizardSchedule(sch)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                  isCompleted
                    ? "bg-white border-slate-200 hover:border-teal-300"
                    : "bg-amber-50/40 border-amber-200 hover:border-amber-300"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isCompleted
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : `Jam ${sch.start_period}`}
                  </div>

                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        Kelas {getClassName(sch.class_id)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {sch.start_time} - {sch.end_time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate">
                      {getSubjectName(sch.subject_id)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isCompleted && jrn ? (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Selesai ({jrn.student_present_count} Hadir)
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Belum Diisi
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Wizard Pengisian Jurnal */}
      {activeWizardSchedule && (
        <JournalWizardModal
          isOpen={Boolean(activeWizardSchedule)}
          onClose={() => setActiveWizardSchedule(null)}
          schedule={activeWizardSchedule}
          user={user}
          activeInstitution={activeInstitution}
          onSaved={() => {
            loadData();
          }}
        />
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
    </div>
  );
};
