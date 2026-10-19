"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import confetti from "canvas-confetti";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Search,
  Sparkles,
  RefreshCw,
  Check,
} from "lucide-react";
import { ClassRoom, Student } from "@/lib/types";
import { saveStudentsBulk } from "@/lib/storage";

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutionId: string;
  classes: ClassRoom[];
  targetClass?: ClassRoom | null;
  onSuccess: () => void;
}

interface ParsedStudentRow {
  rawRow: number;
  fullName: string;
  nisn: string;
  nipd: string;
  gender: "L" | "P";
  rombelRaw: string;
  matchedClassId: string | null;
  matchedClassName: string | null;
  isValid: boolean;
  errorReason?: string;
}

export default function StudentImportModal({
  isOpen,
  onClose,
  institutionId,
  classes,
  targetClass,
  onSuccess,
}: StudentImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "valid" | "invalid">("all");
  const [selectedRombelFilter, setSelectedRombelFilter] = useState<string>("all");

  if (!isOpen) return null;

  // Helper untuk normalisasi nama kelas/rombel agar akurat (misal: "X PM" <-> "X PEMASARAN")
  const findMatchingClass = (rawRombel: string): ClassRoom | null => {
    if (!rawRombel && targetClass) return targetClass;
    if (!rawRombel) return null;

    const clean = rawRombel
      .trim()
      .toUpperCase()
      .replace(/[\-_.]/g, " ")
      .replace(/\s+/g, " ");

    // 1. Exact match by name
    const exact = classes.find((c) => c.name.trim().toUpperCase() === clean);
    if (exact) return exact;

    // 2. Alias mapping khusus SMK (Pemasaran <-> PM, Akuntansi <-> AKL, dsb.)
    const aliasRules: [RegExp, string[]][] = [
      [/^X\s*(PM|PEMASARAN|BDP)$/i, ["X PM", "X PEMASARAN", "X BDP"]],
      [/^XI\s*(PM|PEMASARAN|BDP)$/i, ["XI PM", "XI PEMASARAN", "XI BDP"]],
      [/^XII\s*(PM|PEMASARAN|BDP)$/i, ["XII PM", "XII PEMASARAN", "XII BDP"]],
      [/^X\s*(AKL|AKUNTANSI)$/i, ["X AKL", "X AKUNTANSI"]],
      [/^XI\s*(AKL|AKUNTANSI)$/i, ["XI AKL", "XI AKUNTANSI"]],
      [/^XII\s*(AKL|AKUNTANSI)$/i, ["XII AKL", "XII AKUNTANSI"]],
      [/^X\s*(TJKT|TKJ)$/i, ["X TJKT", "X TKJ"]],
      [/^XI\s*(TJKT|TKJ)$/i, ["XI TJKT", "XI TKJ"]],
      [/^XII\s*(TJKT|TKJ)$/i, ["XII TJKT", "XII TKJ"]],
      [/^X\s*(MPLB|OTKP|AP)$/i, ["X MPLB", "X OTKP"]],
      [/^XI\s*(MPLB|OTKP|AP)$/i, ["XI MPLB", "XI OTKP"]],
      [/^XII\s*(MPLB|OTKP|AP)$/i, ["XII MPLB", "XII OTKP"]],
    ];

    for (const [regex, aliases] of aliasRules) {
      if (regex.test(clean)) {
        const found = classes.find((c) =>
          aliases.some((a) => c.name.trim().toUpperCase() === a.toUpperCase())
        );
        if (found) return found;
      }
    }

    // 3. Substring matching (e.g. contains both grade and major)
    const partial = classes.find((c) => {
      const cName = c.name.trim().toUpperCase();
      return clean.includes(cName) || cName.includes(clean);
    });

    return partial || null;
  };

  // Unduh Template Excel (.xlsx) dengan Petunjuk & Daftar Kelas
  const handleDownloadExcelTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Template Data Siswa
    const sampleData = [
      {
        "No": 1,
        "Nama Lengkap": "Ahmad Maulana",
        "NISN": "0081234567",
        "NIPD": "12001",
        "Jenis Kelamin (L/P)": "L",
        "Kelas / Rombel": targetClass ? targetClass.name : "X TJKT",
      },
      {
        "No": 2,
        "Nama Lengkap": "Siti Nurhaliza",
        "NISN": "0097654321",
        "NIPD": "12002",
        "Jenis Kelamin (L/P)": "P",
        "Kelas / Rombel": targetClass ? targetClass.name : "X AKL",
      },
      {
        "No": 3,
        "Nama Lengkap": "Budi Santoso",
        "NISN": "0089988776",
        "NIPD": "12003",
        "Jenis Kelamin (L/P)": "L",
        "Kelas / Rombel": targetClass ? targetClass.name : "X MPLB",
      },
      {
        "No": 4,
        "Nama Lengkap": "Dewi Lestari",
        "NISN": "0091122334",
        "NIPD": "12004",
        "Jenis Kelamin (L/P)": "P",
        "Kelas / Rombel": targetClass ? targetClass.name : "X PM",
      },
      {
        "No": 5,
        "Nama Lengkap": "Rizky Pratama",
        "NISN": "0085566778",
        "NIPD": "12005",
        "Jenis Kelamin (L/P)": "L",
        "Kelas / Rombel": targetClass ? targetClass.name : "XI TJKT",
      },
    ];

    const wsData = XLSX.utils.json_to_sheet(sampleData);
    wsData["!cols"] = [
      { wch: 6 },
      { wch: 32 },
      { wch: 16 },
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsData, "Template Siswa");

    // Sheet 2: Daftar Kelas & Petunjuk
    const guideData = [
      { "Info": "DAFTAR KELAS & ROMBEL TERSEDIA DI SISTEM:" },
      ...classes.map((c) => ({
        "Info": `• ${c.name} (Tingkat ${c.grade_level})`,
      })),
      { "Info": "" },
      { "Info": "PETUNJUK PENGISIAN AGAR TIDAK KELIRU:" },
      { "Info": "1. Kolom 'Nama Lengkap' wajib diisi." },
      { "Info": "2. Kolom 'Jenis Kelamin' diisi 'L' untuk Laki-laki atau 'P' untuk Perempuan." },
      { "Info": "3. Kolom 'Kelas / Rombel' harus sesuai nama kelas di atas (contoh: X TJKT, X AKL, X PM / X PEMASARAN, dll)." },
      { "Info": "4. File ekspor Dapodik langsung (DAFTAR-PD-...) juga dapat langsung diunggah tanpa diubah." },
    ];
    const wsGuide = XLSX.utils.json_to_sheet(guideData);
    wsGuide["!cols"] = [{ wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsGuide, "Petunjuk & Rombel");

    const exportFileName = targetClass
      ? `Template_Siswa_Kelas_${targetClass.name.replace(/\s+/g, "_")}.xlsx`
      : "Template_Impor_Peserta_Didik_SMK.xlsx";

    XLSX.writeFile(wb, exportFileName);
  };

  // Unduh Template CSV (.csv)
  const handleDownloadCsvTemplate = () => {
    const csvContent =
      "No,Nama Lengkap,NISN,NIPD,Jenis Kelamin (L/P),Kelas / Rombel\n" +
      `1,Ahmad Maulana,0081234567,12001,L,${targetClass ? targetClass.name : "X TJKT"}\n` +
      `2,Siti Nurhaliza,0097654321,12002,P,${targetClass ? targetClass.name : "X AKL"}\n` +
      `3,Budi Santoso,0089988776,12003,L,${targetClass ? targetClass.name : "X MPLB"}\n` +
      `4,Dewi Lestari,0091122334,12004,P,${targetClass ? targetClass.name : "X PM"}\n` +
      `5,Rizky Pratama,0085566778,12005,L,${targetClass ? targetClass.name : "XI TJKT"}\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      targetClass
        ? `Template_Siswa_${targetClass.name.replace(/\s+/g, "_")}.csv`
        : "Template_Impor_Peserta_Didik_SMK.csv"
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parsing file yang diunggah
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + " KB");
    setIsLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      // Ambil sheet pertama
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Konversi sheet ke raw 2D array baris demi baris
      const rawRows = XLSX.utils.sheet_to_json<Array<string | number>>(sheet, {
        header: 1,
        defval: "",
        blankrows: false,
      });

      if (!rawRows || rawRows.length === 0) {
        alert("File kosong atau tidak dapat dibaca!");
        setIsLoading(false);
        return;
      }

      // Deteksi Baris Header
      // Format 1: Format Dapodik resmi (biasanya baris ke-5, kolom No, Nama, NIPD, JK, NISN, Rombel Saat Ini)
      // Format 2: Template standar (Nama, NISN, NIPD, JK, Rombel)
      let headerRowIndex = -1;
      let colMap = {
        name: -1,
        nisn: -1,
        nipd: -1,
        gender: -1,
        rombel: -1,
      };

      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
        const row = rawRows[i].map((c) => String(c || "").trim().toLowerCase());

        const nameIdx = row.findIndex(
          (c) => c === "nama" || c === "nama lengkap" || c === "nama siswa" || c === "nama peserta didik"
        );
        const nisnIdx = row.findIndex((c) => c === "nisn");
        const nipdIdx = row.findIndex((c) => c === "nipd" || c === "nis" || c === "no induk");
        const jkIdx = row.findIndex(
          (c) =>
            c === "jk" ||
            c === "jenis kelamin" ||
            c === "l/p" ||
            c === "gender" ||
            c.startsWith("jenis kelamin")
        );
        const rombelIdx = row.findIndex(
          (c) =>
            c === "rombel" ||
            c === "kelas" ||
            c === "rombel saat ini" ||
            c === "kelas / rombel" ||
            c === "rombongan belajar"
        );

        if (nameIdx !== -1) {
          headerRowIndex = i;
          colMap = {
            name: nameIdx,
            nisn: nisnIdx,
            nipd: nipdIdx,
            gender: jkIdx,
            rombel: rombelIdx,
          };
          break;
        }
      }

      // Jika format Dapodik dengan merge/offset baris (seperti DAFTAR-PD-SMK PANCASILA 5 WONOGIRI-2026.xlsx)
      // Kolom 42 adalah Rombel Saat Ini jika tidak terdeteksi via nama
      if (headerRowIndex !== -1 && colMap.rombel === -1) {
        if (rawRows[headerRowIndex].length > 40) {
          colMap.rombel = 42; // index kolom AR / Rombel Saat Ini di Dapodik
        }
      }

      if (headerRowIndex === -1 || colMap.name === -1) {
        alert(
          "Format tabel tidak dikenali. Pastikan terdapat kolom 'Nama' atau 'Nama Lengkap'. Anda bisa mengunduh contoh format di bawah."
        );
        setIsLoading(false);
        return;
      }

      const parsed: ParsedStudentRow[] = [];

      for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0) continue;

        const rawName = String(row[colMap.name] || "").trim();
        if (!rawName) continue; // lewati baris tanpa nama

        const rawNisn = colMap.nisn !== -1 ? String(row[colMap.nisn] || "").trim() : "";
        const rawNipd = colMap.nipd !== -1 ? String(row[colMap.nipd] || "").trim() : "";
        const rawGenderStr =
          colMap.gender !== -1 ? String(row[colMap.gender] || "").trim().toUpperCase() : "L";
        const rawRombel =
          colMap.rombel !== -1 ? String(row[colMap.rombel] || "").trim() : "";

        // Gender parse: "L", "Laki-laki", "P", "Perempuan"
        let gender: "L" | "P" = "L";
        if (rawGenderStr.startsWith("P") || rawGenderStr.includes("PEREMPUAN")) {
          gender = "P";
        }

        // Matching class
        const targetRombel = rawRombel || (targetClass ? targetClass.name : "");
        const matchedCls = findMatchingClass(targetRombel);

        const isValid = !!matchedCls;
        let errorReason = "";
        if (!matchedCls) {
          errorReason = targetRombel
            ? `Rombel '${targetRombel}' tidak cocok dengan daftar kelas di sistem`
            : "Kolom Rombel/Kelas kosong";
        }

        parsed.push({
          rawRow: r + 1,
          fullName: rawName,
          nisn: rawNisn,
          nipd: rawNipd,
          gender,
          rombelRaw: targetRombel,
          matchedClassId: matchedCls ? matchedCls.id : null,
          matchedClassName: matchedCls ? matchedCls.name : null,
          isValid,
          errorReason,
        });
      }

      setParsedRows(parsed);
    } catch (err: unknown) {
      console.error("Gagal membaca file:", err);
      const msg = err instanceof Error ? err.message : String(err);
      alert("Terjadi kesalahan saat memproses file: " + msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Simpan data hasil impor ke database
  const handleCommitImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid && r.matchedClassId);
    if (validRows.length === 0) {
      alert("Tidak ada data siswa yang valid untuk diimpor!");
      return;
    }

    setIsSaving(true);
    try {
      const newStudents: Student[] = validRows.map((r, idx) => {
        const clsClean = (r.matchedClassId || "cls").replace("cls-", "");
        return {
          id: `std-${clsClean}-${Date.now().toString(36)}-${idx}`,
          institution_id: institutionId,
          class_id: r.matchedClassId!,
          nisn: r.nisn || `00${Math.floor(10000000 + Math.random() * 90000000)}`,
          nipd: r.nipd || undefined,
          full_name: r.fullName,
          gender: r.gender,
          is_active: true,
        };
      });

      await saveStudentsBulk(
        institutionId,
        newStudents,
        importMode,
        targetClass ? targetClass.id : undefined
      );

      // Trigger animasi confetti selebrasi
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // confetti fallback
      }

      alert(
        `Berhasil mengimpor ${newStudents.length} peserta didik ke dalam database!`
      );
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error("Gagal menyimpan import:", error);
      const msg = error instanceof Error ? error.message : String(error);
      alert("Terjadi kesalahan saat menyimpan data: " + msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter & Search preview
  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  const rombelCounts: Record<string, number> = {};
  parsedRows.forEach((r) => {
    const label = r.matchedClassName || r.rombelRaw || "Tanpa Rombel";
    rombelCounts[label] = (rombelCounts[label] || 0) + 1;
  });

  const filteredPreview = parsedRows.filter((row) => {
    if (filterStatus === "valid" && !row.isValid) return false;
    if (filterStatus === "invalid" && row.isValid) return false;
    if (selectedRombelFilter !== "all") {
      const label = row.matchedClassName || row.rombelRaw || "Tanpa Rombel";
      if (label !== selectedRombelFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = row.fullName.toLowerCase().includes(q);
      const matchNisn = row.nisn.toLowerCase().includes(q);
      const matchNipd = row.nipd.toLowerCase().includes(q);
      const matchRombel = (row.matchedClassName || row.rombelRaw).toLowerCase().includes(q);
      return matchName || matchNisn || matchNipd || matchRombel;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Impor Data Peserta Didik
                </h3>
                {targetClass && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    Khusus: {targetClass.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Unggah file Excel (.xlsx / .xls) atau CSV untuk memperbarui basis data siswa secara massal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Banner Unduh Contoh & Format */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-teal-900 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Gunakan Contoh Format Agar Isian Tidak Keliru</span>
            </div>
            <p className="text-xs text-slate-600 max-w-xl">
              Unduh template resmi dengan petunjuk pengisian & daftar rombel yang tersedia di SMK Pancasila 5 Wonogiri. File ekspor Dapodik langsung juga didukung secara otomatis!
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadExcelTemplate}
              className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Contoh Excel (.xlsx)</span>
            </button>
            <button
              onClick={handleDownloadCsvTemplate}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-teal-800 font-bold text-xs flex items-center gap-1.5 border border-teal-300 shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Format CSV</span>
            </button>
          </div>
        </div>

        {/* Area Upload File */}
        {parsedRows.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/30 hover:bg-teal-50/60 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-teal-200 flex items-center justify-center text-teal-600 mb-3 group-hover:scale-105 transition">
              <Upload className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              Klik atau Seret File Excel / CSV ke Sini
            </h4>
            <p className="text-xs text-slate-500 max-w-md">
              Mendukung file Dapodik (contoh: <span className="font-mono text-teal-700">DAFTAR-PD-SMK PANCASILA 5 WONOGIRI-2026.xlsx</span>) atau template kustom dengan kolom Nama, NISN, NIPD, JK, dan Rombel.
            </p>
            {isLoading && (
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-teal-700">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memproses dan memetakan data...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            {/* Ringkasan File & Statistik */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block truncate max-w-xs">
                    {fileName}
                  </span>
                  <span className="text-[11px] text-slate-500">{fileSize}</span>
                </div>
              </div>

              {/* Status Validasi */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterStatus(filterStatus === "valid" ? "all" : "valid")}
                  className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer ${
                    filterStatus === "valid"
                      ? "bg-teal-700 text-white shadow-2xs"
                      : "bg-teal-100 text-teal-800 hover:bg-teal-200"
                  }`}
                  title="Klik untuk memfilter hanya siswa siap impor"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} Siap Impor
                </button>
                {invalidCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterStatus(filterStatus === "invalid" ? "all" : "invalid")}
                    className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer ${
                      filterStatus === "invalid"
                        ? "bg-amber-700 text-white shadow-2xs"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                    }`}
                    title="Klik untuk memfilter hanya siswa yang perlu dicek"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> {invalidCount} Perlu Dicek
                  </button>
                )}
                <button
                  onClick={() => {
                    setParsedRows([]);
                    setFileName("");
                    setFileSize("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <RefreshCw className="w-3 h-3" /> Ganti File
                </button>
              </div>
            </div>

            {/* Chips Rombel yang terdeteksi */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-medium shrink-0">Rombel:</span>
              <button
                onClick={() => setSelectedRombelFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition ${
                  selectedRombelFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semua ({parsedRows.length})
              </button>
              {Object.entries(rombelCounts).map(([rombel, count]) => (
                <button
                  key={rombel}
                  onClick={() => setSelectedRombelFilter(rombel)}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition ${
                    selectedRombelFilter === rombel
                      ? "bg-teal-700 text-white"
                      : "bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/60"
                  }`}
                >
                  {rombel}: {count}
                </button>
              ))}
            </div>

            {/* Kontrol Search, Filter & Mode */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, NISN, atau NIPD dalam pratinjau..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {/* Mode Impor */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setImportMode("merge")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    importMode === "merge"
                      ? "bg-white text-teal-800 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Perbarui siswa yang cocok dan tambahkan siswa baru tanpa menghapus data lain"
                >
                  Gabungkan (Merge)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode("replace")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    importMode === "replace"
                      ? "bg-white text-rose-800 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Gantikan seluruh siswa di rombel terkait dengan daftar baru ini"
                >
                  Gantikan (Replace)
                </button>
              </div>
            </div>

            {/* Tabel Pratinjau Siswa */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl min-h-[220px]">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">No</th>
                    <th className="py-2 px-3">Nama Lengkap</th>
                    <th className="py-2 px-3">NISN</th>
                    <th className="py-2 px-3">NIPD</th>
                    <th className="py-2 px-3">L/P</th>
                    <th className="py-2 px-3">Rombel Terdeteksi</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPreview.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 ${
                        !row.isValid ? "bg-amber-50/50" : ""
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {row.fullName}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500">
                        {row.nisn || "-"}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500">
                        {row.nipd || "-"}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            row.gender === "L"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-pink-100 text-pink-800"
                          }`}
                        >
                          {row.gender === "L" ? "Laki-laki" : "Perempuan"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {row.matchedClassName ? (
                          <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200/50">
                            {row.matchedClassName}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium">
                            {row.rombelRaw || "Tidak ada"}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-teal-700 font-bold text-[11px]">
                            <Check className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px]"
                            title={row.errorReason}
                          >
                            <AlertCircle className="w-3.5 h-3.5" /> {row.errorReason || "Error"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredPreview.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        Tidak ada data yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Aksi */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 && (
              <span>
                Total <strong className="text-slate-800">{validCount}</strong> siswa valid akan dimasukkan ke database (Mode: <strong className="text-teal-700">{importMode === "merge" ? "Gabungkan" : "Gantikan"}</strong>).
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
            >
              Batal
            </button>
            {parsedRows.length > 0 && (
              <button
                onClick={handleCommitImport}
                disabled={isSaving || validCount === 0}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Simpan & Impor {validCount} Siswa</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
