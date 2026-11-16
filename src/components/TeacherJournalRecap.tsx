"use client";

import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Printer,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import {
  ClassRoom,
  Institution,
  JournalEntry,
  Schedule,
  Subject,
  User,
} from "@/lib/types";
import { getLocalDateString } from "@/lib/dateUtils";

interface TeacherJournalRecapProps {
  institution: Institution;
  classes: ClassRoom[];
  schedules: Schedule[];
  subjects: Subject[];
  teachers: User[];
  journals: JournalEntry[];
}

type DatePreset = "today" | "7days" | "month" | "all" | "custom";

function getIndoDayFromDateStr(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return "-";
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  return new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(dt);
}

function getPeriodCount(j: JournalEntry): number {
  const diff = (j.end_period || 0) - (j.start_period || 0) + 1;
  return diff > 0 ? diff : 1;
}

export default function TeacherJournalRecap({
  institution,
  classes,
  schedules,
  subjects,
  teachers,
  journals,
}: TeacherJournalRecapProps) {
  const todayStr = getLocalDateString();
  const currentMonthPrefix = todayStr.slice(0, 7);

  const [datePreset, setDatePreset] = useState<DatePreset>("month");
  const [dateFrom, setDateFrom] = useState(`${currentMonthPrefix}-01`);
  const [dateTo, setDateTo] = useState(todayStr);
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [invalFilter, setInvalFilter] = useState<"all" | "regular" | "inval">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);

  const headmaster = useMemo(
    () => teachers.find((t) => t.role === "HEADMASTER"),
    [teachers]
  );

  const scheduleMap = useMemo(() => {
    const map = new Map<string, Schedule>();
    schedules.forEach((s) => map.set(s.id, s));
    return map;
  }, [schedules]);

  const isSubstituteJournal = (j: JournalEntry): boolean => {
    if (j.is_substitute) return true;
    const sch = scheduleMap.get(j.schedule_id);
    return Boolean(sch && sch.teacher_id !== j.actual_teacher_id);
  };

  const getOriginalTeacherName = (j: JournalEntry): string => {
    if (j.original_teacher_name) return j.original_teacher_name;
    const sch = scheduleMap.get(j.schedule_id);
    if (!sch) return "-";
    return teachers.find((t) => t.id === sch.teacher_id)?.name || "-";
  };

  const effectiveRange = useMemo(() => {
    if (datePreset === "today") return { from: todayStr, to: todayStr };
    if (datePreset === "7days") {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return { from: getLocalDateString(d), to: todayStr };
    }
    if (datePreset === "month") {
      return { from: `${currentMonthPrefix}-01`, to: todayStr };
    }
    if (datePreset === "custom") {
      return { from: dateFrom, to: dateTo };
    }
    return { from: "", to: "" };
  }, [datePreset, dateFrom, dateTo, todayStr, currentMonthPrefix]);

  const filteredJournals = useMemo(() => {
    return journals
      .filter((j) => {
        if (effectiveRange.from && j.entry_date < effectiveRange.from) return false;
        if (effectiveRange.to && j.entry_date > effectiveRange.to) return false;
        if (teacherFilter !== "all" && j.actual_teacher_id !== teacherFilter) return false;
        if (
          classFilter !== "all" &&
          j.class_name.trim().toUpperCase() !== classFilter.trim().toUpperCase()
        ) {
          return false;
        }
        if (
          subjectFilter !== "all" &&
          j.subject_name.trim().toUpperCase() !== subjectFilter.trim().toUpperCase()
        ) {
          return false;
        }
        const isInval = isSubstituteJournal(j);
        if (invalFilter === "inval" && !isInval) return false;
        if (invalFilter === "regular" && isInval) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const haystack = [
            j.teacher_name,
            j.class_name,
            j.subject_name,
            j.topic_materials,
            j.learning_objective,
            j.teacher_notes || "",
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.entry_date !== b.entry_date) return b.entry_date.localeCompare(a.entry_date);
        return (b.start_time || "").localeCompare(a.start_time || "");
      });
  }, [
    journals,
    effectiveRange,
    teacherFilter,
    classFilter,
    subjectFilter,
    invalFilter,
    searchQuery,
    scheduleMap,
  ]);

  const summary = useMemo(() => {
    let totalJp = 0;
    let invalCount = 0;
    const uniqueTeachers = new Set<string>();

    filteredJournals.forEach((j) => {
      totalJp += getPeriodCount(j);
      if (isSubstituteJournal(j)) invalCount += 1;
      uniqueTeachers.add(j.actual_teacher_id);
    });

    return {
      totalJournals: filteredJournals.length,
      totalJp,
      activeTeachers: uniqueTeachers.size,
      invalCount,
    };
  }, [filteredJournals, scheduleMap]);

  const teacherSummaryRows = useMemo(() => {
    const map = new Map<
      string,
      {
        teacherId: string;
        teacherName: string;
        nip: string;
        totalJournals: number;
        totalJp: number;
        regularCount: number;
        invalCount: number;
        completionSum: number;
        completionCount: number;
      }
    >();

    filteredJournals.forEach((j) => {
      const existing = map.get(j.actual_teacher_id) || {
        teacherId: j.actual_teacher_id,
        teacherName: j.teacher_name,
        nip: teachers.find((t) => t.id === j.actual_teacher_id)?.nip || "-",
        totalJournals: 0,
        totalJp: 0,
        regularCount: 0,
        invalCount: 0,
        completionSum: 0,
        completionCount: 0,
      };
      const isInval = isSubstituteJournal(j);
      existing.totalJournals += 1;
      existing.totalJp += getPeriodCount(j);
      if (isInval) existing.invalCount += 1;
      else existing.regularCount += 1;
      if (typeof j.completion_rate === "number") {
        existing.completionSum += j.completion_rate;
        existing.completionCount += 1;
      }
      map.set(j.actual_teacher_id, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalJp - a.totalJp);
  }, [filteredJournals, teachers, scheduleMap]);

  const periodLabel = useMemo(() => {
    if (datePreset === "all") return "Semua Periode";
    if (effectiveRange.from === effectiveRange.to) return effectiveRange.from;
    return `${effectiveRange.from || "-"} s.d. ${effectiveRange.to || "-"}`;
  }, [datePreset, effectiveRange]);

  const handleExportExcel = () => {
    const detailRows = filteredJournals.map((j, idx) => {
      const isInval = isSubstituteJournal(j);
      return {
        No: idx + 1,
        Tanggal: j.entry_date,
        Hari: getIndoDayFromDateStr(j.entry_date),
        "Jam Ke": `${j.start_period}-${j.end_period}`,
        "Jumlah JP": getPeriodCount(j),
        Waktu: `${j.start_time} - ${j.end_time}`,
        "Guru Pengajar": j.teacher_name,
        Status: isInval ? "Guru Pengganti (Inval)" : "Reguler",
        "Guru Asli (Jika Inval)": isInval ? getOriginalTeacherName(j) : "-",
        Kelas: j.class_name,
        "Mata Pelajaran": j.subject_name,
        "Tujuan Pembelajaran": j.learning_objective || "-",
        "Materi Pokok": j.topic_materials,
        "Aktivitas Belajar": (j.learning_activities || []).join(", ") || "-",
        "Hadir (H)": j.student_present_count,
        "Sakit (S)": j.student_sick_count,
        "Izin (I)": j.student_permit_count,
        "Alpa (A)": j.student_absent_count,
        "Ketuntasan (%)": typeof j.completion_rate === "number" ? j.completion_rate : 100,
        "Catatan Guru": j.teacher_notes || "-",
      };
    });

    const summaryRows = teacherSummaryRows.map((r, idx) => ({
      No: idx + 1,
      "Nama Guru": r.teacherName,
      "NIP / ID": r.nip,
      "Total Jurnal": r.totalJournals,
      "Total JP": r.totalJp,
      "Jurnal Reguler": r.regularCount,
      "Jurnal Inval": r.invalCount,
      "Rata-rata Ketuntasan (%)":
        r.completionCount > 0 ? Math.round(r.completionSum / r.completionCount) : 100,
    }));

    const wb = XLSX.utils.book_new();
    const wsDetail = XLSX.utils.json_to_sheet(
      detailRows.length > 0
        ? detailRows
        : [{ Info: "Tidak ada data jurnal pada filter yang dipilih." }]
    );
    const wsSummary = XLSX.utils.json_to_sheet(
      summaryRows.length > 0
        ? summaryRows
        : [{ Info: "Tidak ada data ringkasan guru." }]
    );

    XLSX.utils.book_append_sheet(wb, wsDetail, "Rekap Jurnal Mengajar");
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Per Guru");

    const fileName = `Rekap_Jurnal_Mengajar_${institution.token_lembaga}_${todayStr}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Tombol Ekspor (Disembunyikan saat Print) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              <span>Rekap & Laporan Jurnal Mengajar Guru</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Pantau rekap materi ajar, jam pelajaran (JP), tugas guru pengganti (inval), serta ekspor Excel atau cetak resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filteredJournals.length === 0}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredJournals.length === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan Resmi</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5" /> Periode:
            </span>
            {(
              [
                { id: "month", label: "Bulan Ini" },
                { id: "7days", label: "7 Hari Terakhir" },
                { id: "today", label: "Hari Ini" },
                { id: "all", label: "Semua" },
                { id: "custom", label: "Pilih Tanggal" },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDatePreset(preset.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  datePreset === preset.id
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {preset.label}
              </button>
            ))}

            {datePreset === "custom" && (
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800"
                />
                <span className="text-xs text-slate-400">s.d.</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div className="relative lg:col-span-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari materi, guru, atau catatan..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden focus:border-teal-500"
            >
              <option value="all">Semua Guru</option>
              {teachers
                .filter((t) => t.role !== "HEADMASTER")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden focus:border-teal-500"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  Kelas {c.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden focus:border-teal-500"
              >
                <option value="all">Semua Mapel</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={invalFilter}
                onChange={(e) => setInvalFilter(e.target.value as "all" | "regular" | "inval")}
                className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden focus:border-teal-500"
                title="Filter Jenis Mengajar"
              >
                <option value="all">Semua</option>
                <option value="regular">Reguler</option>
                <option value="inval">Inval</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>Total Jurnal</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{summary.totalJournals}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Total Jam (JP)</span>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{summary.totalJp} JP</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Guru Mengisi</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{summary.activeTeachers}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>Jurnal Inval</span>
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-1">{summary.invalCount}</p>
        </div>
      </div>

      {/* Kop Surat Resmi (Hanya muncul saat Print) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4 text-center">
        <h1 className="text-lg font-black uppercase tracking-wide text-slate-900">
          {institution.name}
        </h1>
        {(institution.address || institution.npsn) && (
          <p className="text-xs text-slate-700">
            {institution.address || ""} {institution.npsn ? `• NPSN: ${institution.npsn}` : ""}
            {institution.phone ? ` • Telp: ${institution.phone}` : ""}
          </p>
        )}
        <h2 className="text-sm font-bold uppercase mt-2 text-slate-900">
          REKAPITULASI JURNAL MENGAJAR GURU
        </h2>
        <p className="text-xs text-slate-600">Periode: {periodLabel}</p>
      </div>

      {/* Tabel Rekap Jurnal */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs print:rounded-none print:border-slate-400">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase print:bg-slate-100">
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">Guru Pengajar</th>
                <th className="py-3 px-4">Kelas & Mapel</th>
                <th className="py-3 px-4">Materi Pokok & Aktivitas</th>
                <th className="py-3 px-4 text-center">Presensi (H/S/I/A)</th>
                <th className="py-3 px-4 text-right print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJournals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Tidak ada data jurnal mengajar pada filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredJournals.map((j) => {
                  const isInval = isSubstituteJournal(j);
                  return (
                    <tr key={j.id} className="hover:bg-slate-50/70 align-top">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900">{j.entry_date}</p>
                        <p className="text-slate-500">
                          Jam {j.start_period}-{j.end_period} ({j.start_time}-{j.end_time})
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{j.teacher_name}</p>
                        {isInval && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[11px]">
                            Inval: {getOriginalTeacherName(j)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-bold border border-teal-200">
                          {j.class_name}
                        </span>
                        <p className="font-semibold text-slate-700 mt-1">{j.subject_name}</p>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-slate-900 line-clamp-2 print:line-clamp-none">
                          {j.topic_materials}
                        </p>
                        {j.learning_activities?.length > 0 && (
                          <p className="text-slate-500 mt-0.5">
                            Metode: {j.learning_activities.join(", ")}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-emerald-700">{j.student_present_count}</span>
                        {" / "}
                        <span className="font-bold text-amber-700">{j.student_sick_count}</span>
                        {" / "}
                        <span className="font-bold text-blue-700">{j.student_permit_count}</span>
                        {" / "}
                        <span className="font-bold text-rose-700">{j.student_absent_count}</span>
                      </td>
                      <td className="py-3 px-4 text-right print:hidden">
                        <button
                          type="button"
                          onClick={() => setSelectedJournal(j)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blok Tanda Tangan Resmi (Hanya muncul saat Print) */}
      <div className="hidden print:grid grid-cols-2 gap-8 mt-10 pt-6 text-xs text-slate-900">
        <div className="text-center">
          <p>Mengetahui,</p>
          <p className="font-bold">Kepala Sekolah</p>
          <div className="h-16" />
          <p className="font-bold underline">{headmaster?.name || "______________________"}</p>
          <p>NIP. {headmaster?.nip || "-"}</p>
        </div>
        <div className="text-center">
          <p>Dicetak pada {todayStr}</p>
          <p className="font-bold">Wakasek Kurikulum / Admin</p>
          <div className="h-16" />
          <p className="font-bold underline">______________________</p>
          <p>NIP. -</p>
        </div>
      </div>

      {/* Modal Detail Jurnal */}
      {selectedJournal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Detail Jurnal Mengajar • Kelas {selectedJournal.class_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedJournal.entry_date} • {selectedJournal.start_time} - {selectedJournal.end_time}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJournal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-800">{selectedJournal.teacher_name}</p>
                <p className="text-slate-600">{selectedJournal.subject_name}</p>
                {isSubstituteJournal(selectedJournal) && (
                  <p className="text-indigo-700 font-bold mt-1">
                    Guru Pengganti (Inval) • Menggantikan {getOriginalTeacherName(selectedJournal)}
                  </p>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Tujuan Pembelajaran</span>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                  {selectedJournal.learning_objective || "-"}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Materi Pokok</span>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                  {selectedJournal.topic_materials}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Catatan Kejadian / Tindak Lanjut</span>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 italic">
                  {selectedJournal.teacher_notes || "Tidak ada catatan khusus."}
                </p>
              </div>

              {selectedJournal.photo_url && (
                <div>
                  <span className="text-slate-400 font-bold uppercase block mb-1">Dokumentasi Kelas</span>
                  <img
                    src={selectedJournal.photo_url}
                    alt="Dokumentasi pembelajaran"
                    className="w-full max-h-60 object-cover rounded-2xl border border-slate-200"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
