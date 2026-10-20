"use client";

import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Download,
  Printer,
  Search,
  ArrowUpDown,
  MessageCircle,
  GraduationCap,
  BookOpen,
  Clock,
  X,
  TrendingUp,
} from "lucide-react";
import {
  Institution,
  ClassRoom,
  Student,
  Subject,
  Schedule,
  JournalEntry,
  User,
} from "@/lib/types";

interface StudentAttendanceRecapProps {
  institution: Institution;
  classes: ClassRoom[];
  schedules: Schedule[];
  subjects: Subject[];
  teachers: User[];
  allStudents: Student[];
  journals: JournalEntry[];
  initialClassId?: string;
  onClose?: () => void;
}

interface StudentRecapRow {
  student: Student;
  className: string;
  classRoom?: ClassRoom;
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  dispensasi: number;
  totalRecorded: number;
  percentage: number;
  statusCategory: "excellent" | "good" | "warning" | "danger" | "no_data";
  statusLabel: string;
  records: {
    journalId: string;
    date: string;
    time: string;
    subjectName: string;
    teacherName: string;
    status: "H" | "S" | "I" | "A" | "D";
    remarks?: string;
    topicMaterials: string;
  }[];
}

// Helper untuk mendapatkan class_id dari JournalEntry
function getJournalClassId(j: JournalEntry, schedules: Schedule[], classes: ClassRoom[]): string | null {
  if (j.schedule_id) {
    const sch = schedules.find((s) => s.id === j.schedule_id);
    if (sch) return sch.class_id;
  }
  const matched = classes.find(
    (c) => c.name.trim().toUpperCase() === (j.class_name || "").trim().toUpperCase()
  );
  return matched ? matched.id : null;
}

// Helper untuk mendapatkan subject_id dari JournalEntry
function getJournalSubjectId(j: JournalEntry, schedules: Schedule[], subjects: Subject[]): string | null {
  if (j.schedule_id) {
    const sch = schedules.find((s) => s.id === j.schedule_id);
    if (sch) return sch.subject_id;
  }
  const matched = subjects.find(
    (s) => s.name.trim().toUpperCase() === (j.subject_name || "").trim().toUpperCase()
  );
  return matched ? matched.id : null;
}

export default function StudentAttendanceRecap({
  institution,
  classes,
  schedules,
  subjects,
  teachers,
  allStudents,
  journals,
  initialClassId,
  onClose,
}: StudentAttendanceRecapProps) {
  // Filter States
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || "all");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-10");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "warning" | "perfect" | "alfa">("all");

  // Selected Student for Detail Modal
  const [detailStudent, setDetailStudent] = useState<StudentRecapRow | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<"name" | "percentage" | "alfa" | "hadir">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Format Nama Bulan Bahasa Indonesia
  const formatMonthName = (monthStr: string) => {
    if (!monthStr || monthStr === "all") return "Semua Periode";
    const [year, m] = monthStr.split("-");
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const monthIndex = parseInt(m, 10) - 1;
    return `${monthNames[monthIndex] || m} ${year}`;
  };

  // Filter Journals yang relevan sesuai filter kelas, bulan, dan mapel
  const filteredJournals = useMemo(() => {
    return journals.filter((j) => {
      // 1. Filter Lembaga
      if (j.institution_id && j.institution_id !== institution.id) return false;

      // 2. Filter Tanggal / Bulan
      if (selectedMonth !== "all") {
        if (!j.entry_date || !j.entry_date.startsWith(selectedMonth)) return false;
      }

      // 3. Filter Kelas
      if (selectedClassId !== "all") {
        const jClsId = getJournalClassId(j, schedules, classes);
        if (jClsId !== selectedClassId) return false;
      }

      // 4. Filter Mapel
      if (selectedSubjectId !== "all") {
        const jSubId = getJournalSubjectId(j, schedules, subjects);
        if (jSubId !== selectedSubjectId) return false;
      }

      return true;
    });
  }, [journals, institution.id, selectedMonth, selectedClassId, selectedSubjectId, schedules, classes, subjects]);

  // Siswa yang masuk dalam cakupan filter kelas
  const targetStudents = useMemo(() => {
    if (selectedClassId === "all") {
      return allStudents.filter((s) => s.is_active);
    }
    return allStudents.filter((s) => s.class_id === selectedClassId && s.is_active);
  }, [allStudents, selectedClassId]);

  // Agregasi Per Siswa
  const studentRecapData = useMemo<StudentRecapRow[]>(() => {
    return targetStudents.map((student) => {
      const cls = classes.find((c) => c.id === student.class_id);
      const className = cls ? cls.name : "-";

      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alfa = 0;
      let dispensasi = 0;
      const records: StudentRecapRow["records"] = [];

      // Periksa setiap jurnal yang cocok
      filteredJournals.forEach((j) => {
        const jClsId = getJournalClassId(j, schedules, classes);
        // Pastikan jurnal ini ditujukan untuk kelas siswa yang bersangkutan
        if (jClsId && jClsId !== student.class_id) return;

        // Cari record presensi siswa ini di dalam jurnal
        const rec = j.attendance_records?.find(
          (r) =>
            r.student_id === student.id ||
            r.student_name.trim().toLowerCase() === student.full_name.trim().toLowerCase()
        );

        if (rec) {
          switch (rec.status) {
            case "H":
              hadir++;
              break;
            case "S":
              sakit++;
              break;
            case "I":
              izin++;
              break;
            case "A":
              alfa++;
              break;
            case "D":
              dispensasi++;
              break;
            default:
              hadir++;
              break;
          }
          records.push({
            journalId: j.id,
            date: j.entry_date,
            time: `${j.start_time} - ${j.end_time}`,
            subjectName: j.subject_name,
            teacherName: j.teacher_name,
            status: rec.status,
            remarks: rec.remarks,
            topicMaterials: j.topic_materials || "-",
          });
        }
      });

      const totalRecorded = hadir + sakit + izin + alfa + dispensasi;
      const percentage =
        totalRecorded > 0 ? Math.round(((hadir + dispensasi) / totalRecorded) * 100) : 100;

      let statusCategory: StudentRecapRow["statusCategory"] = "excellent";
      let statusLabel = "Sangat Baik";

      if (totalRecorded === 0) {
        statusCategory = "no_data";
        statusLabel = "Belum Ada Data";
      } else if (alfa >= 3) {
        statusCategory = "danger";
        statusLabel = "Peringatan BK (Alfa >= 3)";
      } else if (alfa >= 1 || sakit + izin >= 4 || percentage < 75) {
        statusCategory = "warning";
        statusLabel = "Perhatian Wali Kelas";
      } else if (percentage >= 90) {
        statusCategory = "excellent";
        statusLabel = "Sangat Baik";
      } else {
        statusCategory = "good";
        statusLabel = "Baik";
      }

      return {
        student,
        className,
        classRoom: cls,
        hadir,
        sakit,
        izin,
        alfa,
        dispensasi,
        totalRecorded,
        percentage,
        statusCategory,
        statusLabel,
        records: records.sort((a, b) => b.date.localeCompare(a.date)),
      };
    });
  }, [targetStudents, filteredJournals, classes]);

  // Filter & Search
  const filteredAndSortedRecap = useMemo(() => {
    const result = studentRecapData.filter((row) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = row.student.full_name.toLowerCase().includes(q);
        const matchNisn = row.student.nisn.toLowerCase().includes(q);
        const matchNipd = (row.student.nipd || "").toLowerCase().includes(q);
        const matchClass = row.className.toLowerCase().includes(q);
        if (!matchName && !matchNisn && !matchNipd && !matchClass) return false;
      }

      // 2. Status Filter
      if (statusFilter === "warning") {
        return row.statusCategory === "danger" || row.statusCategory === "warning";
      }
      if (statusFilter === "alfa") {
        return row.alfa > 0;
      }
      if (statusFilter === "perfect") {
        return row.totalRecorded > 0 && row.percentage === 100 && row.alfa === 0;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = a.student.full_name.localeCompare(b.student.full_name);
      } else if (sortField === "percentage") {
        cmp = a.percentage - b.percentage;
      } else if (sortField === "alfa") {
        cmp = a.alfa - b.alfa;
      } else if (sortField === "hadir") {
        cmp = a.hadir - b.hadir;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [studentRecapData, searchQuery, statusFilter, sortField, sortDirection]);

  // Statistik Ringkasan (KPIs)
  const stats = useMemo(() => {
    const totalStudents = studentRecapData.length;
    const totalSessions = filteredJournals.length;

    let totalHadir = 0;
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlfa = 0;
    let studentsWithAlfa = 0;
    let studentsNeedBk = 0;

    studentRecapData.forEach((row) => {
      totalHadir += row.hadir;
      totalSakit += row.sakit;
      totalIzin += row.izin;
      totalAlfa += row.alfa;
      if (row.alfa > 0) studentsWithAlfa++;
      if (row.alfa >= 3) studentsNeedBk++;
    });

    const totalAttendanceMarks = totalHadir + totalSakit + totalIzin + totalAlfa;
    const avgAttendanceRate =
      totalAttendanceMarks > 0
        ? Math.round((totalHadir / totalAttendanceMarks) * 100)
        : 100;

    return {
      totalStudents,
      totalSessions,
      totalHadir,
      totalSakit,
      totalIzin,
      totalAlfa,
      studentsWithAlfa,
      studentsNeedBk,
      avgAttendanceRate,
    };
  }, [studentRecapData, filteredJournals]);

  // Unduh Laporan Rekap ke Excel (.xlsx)
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const selectedClsObj = classes.find((c) => c.id === selectedClassId);
    const selectedSubObj = subjects.find((s) => s.id === selectedSubjectId);
    const homeroom = selectedClsObj
      ? teachers.find((t) => t.id === selectedClsObj.homeroom_teacher_id)
      : null;

    const data = filteredAndSortedRecap.map((row, idx) => ({
      "No": idx + 1,
      "NISN": row.student.nisn,
      "NIPD": row.student.nipd || "-",
      "Nama Lengkap": row.student.full_name,
      "JK": row.student.gender,
      "Kelas": row.className,
      "Hadir (H)": row.hadir,
      "Sakit (S)": row.sakit,
      "Izin (I)": row.izin,
      "Alfa (A)": row.alfa,
      "Dispensasi (D)": row.dispensasi,
      "Total Sesi": row.totalRecorded,
      "% Kehadiran": `${row.percentage}%`,
      "Status Evaluasi": row.statusLabel,
    }));

    const headerAoa = [
      [`REKAPITULASI & LAPORAN PRESENSI PESERTA DIDIK`],
      [`LEMBAGA: ${institution.name.toUpperCase()} (NPSN: ${institution.npsn || "-"})`],
      [
        `KELAS: ${selectedClsObj ? selectedClsObj.name : "SEMUA KELAS"} | WALI KELAS: ${
          homeroom ? homeroom.name : "Semua"
        }`,
      ],
      [
        `PERIODE: ${formatMonthName(selectedMonth).toUpperCase()} | MAPEL: ${
          selectedSubObj ? selectedSubObj.name : "SEMUA MATA PELAJARAN"
        }`,
      ],
      [],
    ];

    const ws = XLSX.utils.aoa_to_sheet(headerAoa);
    XLSX.utils.sheet_add_json(ws, data, { origin: "A6" });

    ws["!cols"] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 12 },
      { wch: 32 },
      { wch: 6 },
      { wch: 16 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 14 },
      { wch: 12 },
      { wch: 14 },
      { wch: 26 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Rekap Presensi");

    const classNameStr = selectedClsObj ? selectedClsObj.name.replace(/\s+/g, "_") : "Semua_Kelas";
    const fileName = `Rekap_Presensi_${classNameStr}_${selectedMonth}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Cetak Dokumen Resmi (Browser Print)
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp pesan ke Orang Tua / Wali Siswa
  const handleOpenWhatsApp = (row: StudentRecapRow) => {
    const text = encodeURIComponent(
      `Yth. Bapak/Ibu Wali dari Ananda *${row.student.full_name}* (Kelas: *${row.className}*),\n\n` +
      `Kami dari *${institution.name}* menginformasikan rekapitulasi kehadiran ananda pada periode *${formatMonthName(
        selectedMonth
      )}*:\n` +
      `• Hadir: ${row.hadir} sesi\n` +
      `• Sakit: ${row.sakit} sesi\n` +
      `• Izin: ${row.izin} sesi\n` +
      `• Alfa (Tanpa Keterangan): *${row.alfa} sesi*\n` +
      `• Tingkat Kehadiran: *${row.percentage}%*\n\n` +
      (row.alfa > 0
        ? `Mohon konfirmasi dan pendampingan Bapak/Ibu mengenai ketidakhadiran ananda tanpa keterangan tersebut agar proses belajar mengajar tetap optimal.\n\n`
        : `Terima kasih atas kedisiplinan dan dukungan Bapak/Ibu dalam mendampingi belajar ananda.\n\n`) +
      `Salam hangat,\n*Tim Kesiswaan & Wali Kelas ${institution.name}*`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const selectedClsObj = classes.find((c) => c.id === selectedClassId);
  const selectedHomeroom = selectedClsObj
    ? teachers.find((t) => t.id === selectedClsObj.homeroom_teacher_id)
    : null;

  return (
    <div className="space-y-4">
      {/* ================= KOP PRINT-ONLY (Hanya muncul saat dicetak ke PDF / kertas) ================= */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-xl font-bold uppercase tracking-wide">{institution.name}</h1>
        <p className="text-xs text-slate-700">{institution.address || "Kabupaten Wonogiri, Jawa Tengah"} | NPSN: {institution.npsn || "-"}</p>
        <div className="mt-2 text-sm font-bold uppercase underline">
          LAPORAN REKAPITULASI PRESENSI & KEHADIRAN SISWA
        </div>
        <div className="text-xs mt-1 flex justify-between">
          <span>Kelas: <strong>{selectedClsObj ? selectedClsObj.name : "Semua Kelas"}</strong></span>
          <span>Periode: <strong>{formatMonthName(selectedMonth)}</strong></span>
          <span>Wali Kelas: <strong>{selectedHomeroom ? selectedHomeroom.name : "-"}</strong></span>
        </div>
      </div>

      {/* ================= HEADER UTAMA & KONTROL ================= */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/80 shadow-xs">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Rekapitulasi Presensi & Laporan Kehadiran Siswa
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {formatMonthName(selectedMonth)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau kedisiplinan kehadiran, rekapitulasi presensi per rombel, deteksi dini siswa butuh bimbingan BK, dan ekspor laporan resmi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 shadow-2xs transition cursor-pointer"
              title="Cetak atau Simpan sebagai PDF"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Unduh Spreadsheet Excel (.xlsx)"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Baris Filter Interaktif */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* 1. Filter Kelas */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
              <span>Pilih Kelas / Rombel</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Semua Kelas ({classes.length} Rombel)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Tingkat {c.grade_level})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Filter Periode / Bulan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Periode Bulan</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="2026-10">Oktober 2026 (Bulan Ini)</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">Agustus 2026</option>
              <option value="2026-07">Juli 2026</option>
              <option value="all">Semua Bulan (Semester Ini)</option>
            </select>
          </div>

          {/* 3. Filter Mapel */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              <span>Mata Pelajaran</span>
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Pencarian Siswa */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Cari Siswa</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nama, NISN, atau NIPD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs"
              />
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= BENTO GRID STATS & KEY METRICS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4">
        {/* Metric 1: Rata-rata Kehadiran */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">Kehadiran Kelas</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{stats.avgAttendanceRate}%</span>
            <span className="text-[11px] text-emerald-700 font-bold">Rata-rata</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
            <div
              className={`h-full rounded-full ${
                stats.avgAttendanceRate >= 90
                  ? "bg-emerald-500"
                  : stats.avgAttendanceRate >= 75
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${stats.avgAttendanceRate}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Total Sesi Pertemuan */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">Sesi Pertemuan</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-teal-800">{stats.totalSessions}</span>
            <span className="text-[11px] text-slate-500">Jurnal Tercatat</span>
          </div>
          <p className="text-[11px] text-slate-400">Total {stats.totalHadir} jam presensi hadir</p>
        </div>

        {/* Metric 3: Sakit & Izin */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">Sakit & Izin</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {stats.totalSakit + stats.totalIzin}
            </span>
            <span className="text-[11px] text-slate-500">
              (S: {stats.totalSakit}, I: {stats.totalIzin})
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Tercatat dengan keterangan</p>
        </div>

        {/* Metric 4: Alfa & Early Warning BK */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">Alfa / Tanpa Ket.</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-600">{stats.totalAlfa}</span>
            <span className="text-[11px] text-rose-700 font-bold">
              ({stats.studentsWithAlfa} Siswa)
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {stats.studentsNeedBk > 0 ? (
              <span className="text-rose-600 font-bold">
                ⚠️ {stats.studentsNeedBk} siswa butuh surat BK
              </span>
            ) : (
              "Semua siswa dalam batas wajar"
            )}
          </p>
        </div>
      </div>

      {/* ================= TAB FILTER CEPAT (Hanya di layar) ================= */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs print:hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium shrink-0">Filter Status:</span>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
              statusFilter === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua Siswa ({studentRecapData.length})
          </button>
          <button
            onClick={() => setStatusFilter("alfa")}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
              statusFilter === "alfa"
                ? "bg-rose-700 text-white"
                : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pernah Alfa ({stats.studentsWithAlfa})</span>
          </button>
          <button
            onClick={() => setStatusFilter("warning")}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
              statusFilter === "warning"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Perhatian Wali Kelas / BK</span>
          </button>
          <button
            onClick={() => setStatusFilter("perfect")}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
              statusFilter === "perfect"
                ? "bg-emerald-700 text-white"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Hadir</span>
          </button>
        </div>

        <div className="text-slate-500 font-medium shrink-0 text-xs">
          Menampilkan <strong>{filteredAndSortedRecap.length}</strong> dari {studentRecapData.length} siswa
        </div>
      </div>

      {/* ================= TABEL REKAPITULASI PRESENSI ================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px] sticky top-0">
              <tr>
                <th className="py-3 px-3 w-10">No</th>
                <th className="py-3 px-3">NISN / NIPD</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition"
                  onClick={() => {
                    if (sortField === "name") {
                      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    } else {
                      setSortField("name");
                      setSortDirection("asc");
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Nama Peserta Didik</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-2 text-center w-12">L/P</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-2 text-center text-emerald-700 font-black">H</th>
                <th className="py-3 px-2 text-center text-amber-600 font-black">S</th>
                <th className="py-3 px-2 text-center text-blue-600 font-black">I</th>
                <th className="py-3 px-2 text-center text-rose-600 font-black">A</th>
                <th className="py-3 px-2 text-center text-purple-600 font-black">D</th>
                <th className="py-3 px-3 text-center">Total</th>
                <th
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 transition"
                  onClick={() => {
                    if (sortField === "percentage") {
                      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    } else {
                      setSortField("percentage");
                      setSortDirection("asc");
                    }
                  }}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>% Kehadiran</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Status Evaluasi</th>
                <th className="py-3 px-3 text-right print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedRecap.map((row, idx) => (
                <tr
                  key={row.student.id}
                  className={`hover:bg-slate-50/80 transition ${
                    row.alfa >= 3 ? "bg-rose-50/30" : row.alfa > 0 ? "bg-amber-50/20" : ""
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                    <div>{row.student.nisn}</div>
                    {row.student.nipd && (
                      <div className="text-[10px] text-slate-400">NIPD: {row.student.nipd}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                    {row.student.full_name}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        row.student.gender === "L"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-pink-100 text-pink-800"
                      }`}
                    >
                      {row.student.gender}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      {row.className}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-emerald-700 bg-emerald-50/30">
                    {row.hadir}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-amber-700">
                    {row.sakit > 0 ? row.sakit : "-"}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-blue-700">
                    {row.izin > 0 ? row.izin : "-"}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-rose-600 bg-rose-50/40">
                    {row.alfa > 0 ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black">
                        {row.alfa}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-purple-700">
                    {row.dispensasi > 0 ? row.dispensasi : "-"}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-500">
                    {row.totalRecorded}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className={`font-black text-xs ${
                          row.percentage >= 90
                            ? "text-emerald-700"
                            : row.percentage >= 75
                            ? "text-amber-700"
                            : "text-rose-600"
                        }`}
                      >
                        {row.percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {row.statusCategory === "danger" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" /> Panggilan BK
                      </span>
                    ) : row.statusCategory === "warning" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertCircle className="w-3 h-3" /> Perhatian Wali
                      </span>
                    ) : row.statusCategory === "excellent" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Sangat Baik
                      </span>
                    ) : row.statusCategory === "good" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        Baik
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Belum Ada Sesi</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap print:hidden">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setDetailStudent(row)}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center gap-1 border border-teal-200/70 transition cursor-pointer"
                        title="Lihat riwayat ketidakhadiran per tanggal"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Riwayat</span>
                      </button>
                      {row.alfa > 0 && (
                        <button
                          onClick={() => handleOpenWhatsApp(row)}
                          className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                          title="Kirim pemberitahuan Alfa ke Orang Tua via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAndSortedRecap.length === 0 && (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400 italic">
                    Tidak ada data peserta didik yang cocok dengan kriteria filter pencarian di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= TANDA TANGAN DOKUMEN RESMI (Print Only) ================= */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-8 mt-6 text-xs text-center border-t border-slate-300">
        <div>
          <p className="mb-14">
            Mengetahui,<br />
            <strong>Kepala {institution.name}</strong>
          </p>
          <p className="font-bold underline uppercase">
            {teachers.find((t) => t.role === "HEADMASTER")?.name || "Kepala Sekolah"}
          </p>
          <p className="text-[10px] text-slate-500">
            NIP: {teachers.find((t) => t.role === "HEADMASTER")?.nip || "-"}
          </p>
        </div>
        <div>
          <p className="mb-14">
            Wonogiri, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br />
            <strong>Wali Kelas {selectedClsObj ? selectedClsObj.name : ""}</strong>
          </p>
          <p className="font-bold underline uppercase">
            {selectedHomeroom ? selectedHomeroom.name : "Wali Kelas"}
          </p>
          <p className="text-[10px] text-slate-500">
            NIP: {selectedHomeroom ? selectedHomeroom.nip : "-"}
          </p>
        </div>
      </div>

      {/* ================= MODAL DETAIL RIWAYAT SISWA ================= */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal Detail */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    {detailStudent.student.full_name}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    {detailStudent.className}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  NISN: <span className="font-mono">{detailStudent.student.nisn}</span> | NIPD:{" "}
                  <span className="font-mono">{detailStudent.student.nipd || "-"}</span> | Gender:{" "}
                  {detailStudent.student.gender === "L" ? "Laki-laki" : "Perempuan"}
                </p>
              </div>
              <button
                onClick={() => setDetailStudent(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ringkasan Kehadiran Siswa Ini */}
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-2xl">
                <span className="text-[10px] text-emerald-700 font-bold block">Hadir</span>
                <span className="text-lg font-black text-emerald-800">{detailStudent.hadir}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-2 rounded-2xl">
                <span className="text-[10px] text-amber-700 font-bold block">Sakit</span>
                <span className="text-lg font-black text-amber-800">{detailStudent.sakit}</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-2 rounded-2xl">
                <span className="text-[10px] text-blue-700 font-bold block">Izin</span>
                <span className="text-lg font-black text-blue-800">{detailStudent.izin}</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 p-2 rounded-2xl">
                <span className="text-[10px] text-rose-700 font-bold block">Alfa</span>
                <span className="text-lg font-black text-rose-800">{detailStudent.alfa}</span>
              </div>
              <div className="bg-slate-100 border border-slate-200 p-2 rounded-2xl">
                <span className="text-[10px] text-slate-600 font-bold block">% Hadir</span>
                <span className="text-lg font-black text-slate-900">{detailStudent.percentage}%</span>
              </div>
            </div>

            {/* Riwayat Sesi Kronologis */}
            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-100 p-2 rounded-2xl min-h-[160px]">
              <h4 className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>Log Catatan Kehadiran ({detailStudent.records.length} Sesi Terdata)</span>
              </h4>

              {detailStudent.records.map((rec, i) => (
                <div
                  key={i}
                  className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{rec.subjectName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {rec.date} ({rec.time})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Guru: <span className="font-medium text-slate-700">{rec.teacherName}</span>
                    </p>
                    {rec.topicMaterials && rec.topicMaterials !== "-" && (
                      <p className="text-[11px] text-slate-600 italic">Materi: {rec.topicMaterials}</p>
                    )}
                    {rec.remarks && (
                      <p className="text-[11px] text-amber-700 font-medium">Catatan: {rec.remarks}</p>
                    )}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-black shrink-0 ${
                      rec.status === "H"
                        ? "bg-emerald-100 text-emerald-800"
                        : rec.status === "S"
                        ? "bg-amber-100 text-amber-800"
                        : rec.status === "I"
                        ? "bg-blue-100 text-blue-800"
                        : rec.status === "A"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {rec.status === "H"
                      ? "HADIR"
                      : rec.status === "S"
                      ? "SAKIT"
                      : rec.status === "I"
                      ? "IZIN"
                      : rec.status === "A"
                      ? "ALFA"
                      : "DISPENSASI"}
                  </span>
                </div>
              ))}

              {detailStudent.records.length === 0 && (
                <div className="py-8 text-center text-slate-400 italic text-xs">
                  Belum ada log presensi khusus yang tersimpan untuk siswa ini pada periode terpilih.
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => handleOpenWhatsApp(detailStudent)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Kirim Pesan WhatsApp ke Wali Murid</span>
              </button>
              <button
                onClick={() => setDetailStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
