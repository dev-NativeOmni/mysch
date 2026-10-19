"use client";

import React, { useState, useEffect } from "react";
import { Schedule, User, Institution, Student, AttendanceStatus, JournalEntry, AttendanceRecord } from "@/lib/types";
import { getStudentsByClass, getClasses, getSubjects, saveJournal } from "@/lib/storage";
import { getLocalDateString } from "@/lib/dateUtils";
import { compressImage } from "@/lib/imageUtils";
import { QuickPill } from "./QuickPill";
import confetti from "canvas-confetti";
import {
  X,
  Users,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  RotateCcw,
  Sparkles,
  AlertCircle,
  FileCheck,
  Check,
} from "lucide-react";

interface JournalWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  /** Jurnal yang sudah tersimpan untuk jadwal ini hari ini (mode ubah) */
  existingJournal?: JournalEntry;
  user: User;
  activeInstitution: Institution;
  onSaved: (entry: JournalEntry) => void;
}

export const JournalWizardModal: React.FC<JournalWizardModalProps> = ({
  isOpen,
  onClose,
  schedule,
  existingJournal,
  user,
  activeInstitution,
  onSaved,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [className, setClassName] = useState("");
  const [subjectName, setSubjectName] = useState("");

  // Step 2: Materi
  const [learningObjective, setLearningObjective] = useState(existingJournal?.learning_objective ?? "");
  const [topicMaterials, setTopicMaterials] = useState(existingJournal?.topic_materials ?? "");
  const [selectedActivities, setSelectedActivities] = useState<string[]>(
    existingJournal?.learning_activities ?? []
  );
  const [completionRate, setCompletionRate] = useState<number>(existingJournal?.completion_rate ?? 100);
  const [topicError, setTopicError] = useState(false);

  // Step 3: Catatan & Foto
  const [teacherNotes, setTeacherNotes] = useState(existingJournal?.teacher_notes ?? "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingJournal?.photo_url ?? null);
  const [photoError, setPhotoError] = useState("");
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Menandai ada isian yang berubah, agar tidak hilang saat modal tertutup tidak sengaja
  const [isDirty, setIsDirty] = useState(false);

  // Muat data siswa, nama kelas, dan nama mapel saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    setCurrentStep(1);
    setSearchQuery("");

    async function loadData() {
      const [classes, subjects, stdList] = await Promise.all([
        getClasses(activeInstitution.id),
        getSubjects(activeInstitution.id),
        getStudentsByClass(schedule.class_id),
      ]);

      const cls = classes.find((c) => c.id === schedule.class_id);
      const sub = subjects.find((s) => s.id === schedule.subject_id);

      setClassName(cls ? cls.name : "-");
      setSubjectName(sub ? sub.name : user.subject_name || "Mata Pelajaran");
      setStudents(stdList);

      // Inisialisasi: SEMUA SISWA HADIR SECARA DEFAULT, kecuali jurnal lama sudah mencatat lain
      const previousStatus: Record<string, AttendanceStatus> = {};
      existingJournal?.attendance_records.forEach((r) => {
        previousStatus[r.student_id] = r.status;
      });
      const initialMap: Record<string, AttendanceStatus> = {};
      stdList.forEach((s) => {
        initialMap[s.id] = previousStatus[s.id] || "H";
      });
      setAttendanceMap(initialMap);
    }

    loadData();
  }, [isOpen, schedule, activeInstitution.id, existingJournal, user.subject_name]);

  if (!isOpen) return null;

  // Hitung angka kehadiran secara live
  const totalStudents = students.length;
  let presentCount = 0;
  let sickCount = 0;
  let permitCount = 0;
  let absentCount = 0;

  Object.values(attendanceMap).forEach((status) => {
    if (status === "H") presentCount++;
    else if (status === "S") sickCount++;
    else if (status === "I") permitCount++;
    else if (status === "A") absentCount++;
  });

  // Filter siswa berdasarkan pencarian
  const filteredStudents = students.filter((s) =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle status kehadiran siswa
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setIsDirty(true);
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Reset semua hadir
  const handleMarkAllPresent = () => {
    setIsDirty(true);
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.id] = "H";
    });
    setAttendanceMap(updated);
  };

  // Toggle metode aktivitas
  const toggleActivity = (activity: string) => {
    setIsDirty(true);
    if (selectedActivities.includes(activity)) {
      setSelectedActivities(selectedActivities.filter((a) => a !== activity));
    } else {
      setSelectedActivities([...selectedActivities, activity]);
    }
  };

  // Foto diperkecil dulu agar hemat kuota & penyimpanan
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPhotoError("");
    setIsProcessingPhoto(true);
    try {
      const compressed = await compressImage(file, 1280, 0.7);
      setPhotoPreview(compressed);
      setIsDirty(true);
    } catch (err) {
      console.error(err);
      setPhotoError("Foto tidak bisa dibaca. Coba pilih foto lain.");
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Tutup modal, tanya dulu jika ada isian yang belum disimpan
  const handleClose = () => {
    if (isDirty && !window.confirm("Tutup tanpa menyimpan? Isian yang sudah Anda buat akan hilang.")) {
      return;
    }
    onClose();
  };

  const goToStep = (step: 1 | 2 | 3) => {
    // Materi wajib diisi sebelum lanjut dari langkah 2
    if (currentStep === 2 && step === 3 && !topicMaterials.trim()) {
      setTopicError(true);
      return;
    }
    setCurrentStep(step);
  };

  // Simpan Jurnal
  const handleSubmitJournal = async () => {
    if (!topicMaterials.trim()) {
      setTopicError(true);
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    setSaveError("");
    try {
      const attendanceRecords: AttendanceRecord[] = students.map((s) => ({
        student_id: s.id,
        student_name: s.full_name,
        status: attendanceMap[s.id] || "H",
      }));

      const newEntry: JournalEntry = {
        // Mode ubah memakai ID lama agar tidak membuat jurnal ganda
        id: existingJournal?.id ?? "jrn-" + Date.now(),
        institution_id: activeInstitution.id,
        schedule_id: schedule.id,
        actual_teacher_id: user.id,
        teacher_name: user.name,
        class_name: className,
        subject_name: subjectName,
        entry_date: existingJournal?.entry_date ?? getLocalDateString(),
        start_period: schedule.start_period,
        end_period: schedule.end_period,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        learning_objective: learningObjective.trim(),
        topic_materials: topicMaterials.trim(),
        learning_activities: selectedActivities,
        student_present_count: presentCount,
        student_sick_count: sickCount,
        student_permit_count: permitCount,
        student_absent_count: absentCount,
        attendance_records: attendanceRecords,
        teacher_notes: teacherNotes.trim(),
        photo_url: photoPreview || undefined,
        completion_rate: completionRate,
        is_locked: existingJournal?.is_locked ?? false,
        submitted_at: new Date().toISOString(),
      };

      await saveJournal(newEntry);

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore if confetti unavailable
      }

      onSaved(newEntry);
      onClose();
    } catch (err) {
      console.error("Gagal menyimpan jurnal:", err);
      setSaveError(
        photoPreview
          ? "Jurnal gagal disimpan. Memori HP mungkin penuh: coba hapus foto lalu simpan lagi."
          : "Jurnal gagal disimpan. Periksa koneksi internet lalu coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activityOptions = [
    "Ceramah Interaktif",
    "Diskusi Kelompok",
    "Praktikum / Praktik",
    "Presentasi Siswa",
    "Latihan Soal / Kuis",
    "Tugas Mandiri",
    "Refleksi & Tanya Jawab",
  ];

  const steps: { step: 1 | 2 | 3; label: string; icon: React.ReactNode }[] = [
    { step: 1, label: "Kehadiran", icon: <Users className="w-4 h-4" /> },
    { step: 2, label: "Materi", icon: <BookOpen className="w-4 h-4" /> },
    { step: 3, label: "Catatan", icon: <Camera className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 leading-snug line-clamp-2">
              Kelas {className} • {subjectName}
            </h2>
            <p className="text-sm text-slate-500">
              Pukul {schedule.start_time} - {schedule.end_time}
              {existingJournal && " • Mengubah jurnal yang sudah diisi"}
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Tutup"
            className="w-10 h-10 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Penanda Langkah (3 Langkah Ringan) */}
        <div className="grid grid-cols-3 bg-white border-b border-slate-200 text-sm font-bold text-center shrink-0">
          {steps.map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => goToStep(s.step)}
              className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
                currentStep === s.step
                  ? "border-teal-600 text-teal-700 bg-teal-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {s.icon}
              <span>
                {s.step}. {s.label}
              </span>
            </button>
          ))}
        </div>

        {/* Konten Wizard (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* ================= STEP 1: KEHADIRAN SISWA ================= */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Petunjuk */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-teal-50 text-teal-900 text-sm">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p>
                  Semua siswa sudah otomatis <strong>Hadir</strong>. Cukup ketuk <strong>Sakit</strong>,{" "}
                  <strong>Izin</strong>, atau <strong>Alpa</strong> (tanpa keterangan) untuk siswa yang tidak hadir.
                </p>
              </div>

              {/* Rekap Kehadiran */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 text-sm font-bold">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    Hadir {presentCount}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                    Sakit {sickCount}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                    Izin {permitCount}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
                    Alpa {absentCount}
                  </span>
                </div>

                {presentCount < totalStudents && (
                  <button
                    type="button"
                    onClick={handleMarkAllPresent}
                    className="text-sm font-bold text-teal-700 hover:text-teal-800 bg-white border border-teal-300 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Kembalikan Semua Hadir
                  </button>
                )}
              </div>

              {/* Kolom Cari Siswa */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Cari nama siswa (${totalStudents} siswa)...`}
                  className="w-full pl-9 pr-3 py-2.5 text-base rounded-xl border border-slate-300 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Daftar Siswa */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                {totalStudents === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    Belum ada data siswa di kelas ini. Hubungi admin sekolah.
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    Tidak ada siswa bernama &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  filteredStudents.map((std, idx) => {
                    const status = attendanceMap[std.id] || "H";
                    return (
                      <div
                        key={std.id}
                        className={`p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 transition ${
                          status === "H" ? "hover:bg-slate-50" : "bg-amber-50/40"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="w-6 text-sm text-slate-400 text-center shrink-0">
                            {idx + 1}.
                          </span>
                          <p className="text-base font-semibold text-slate-900">
                            {std.full_name}
                          </p>
                        </div>

                        <div className="sm:shrink-0">
                          <QuickPill
                            currentStatus={status}
                            onChange={(newStatus) => handleStatusChange(std.id, newStatus)}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 2: MATERI & CAPAIAN ================= */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Bab / Topik Pembelajaran */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Materi yang diajarkan hari ini <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={topicMaterials}
                  onChange={(e) => {
                    setTopicMaterials(e.target.value);
                    setTopicError(false);
                    setIsDirty(true);
                  }}
                  placeholder="Contoh: Bab 2 - Teks Prosedur"
                  className={`w-full px-3.5 py-2.5 text-base rounded-xl border font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 ${
                    topicError ? "border-rose-400 bg-rose-50/40" : "border-slate-300"
                  }`}
                />
                {topicError && (
                  <p className="mt-1.5 text-sm text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Materi wajib diisi.
                  </p>
                )}
              </div>

              {/* Capaian Pembelajaran / Tujuan */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Tujuan pembelajaran <span className="font-normal text-slate-500">(boleh dikosongkan)</span>
                </label>
                <textarea
                  rows={2}
                  value={learningObjective}
                  onChange={(e) => {
                    setLearningObjective(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Contoh: Siswa mampu menyusun teks prosedur sederhana."
                  className="w-full px-3.5 py-2.5 text-base rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Chips Metode Belajar */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Kegiatan di kelas <span className="font-normal text-slate-500">(ketuk yang sesuai)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {activityOptions.map((act) => {
                    const isSelected = selectedActivities.includes(act);
                    return (
                      <button
                        key={act}
                        type="button"
                        onClick={() => toggleActivity(act)}
                        className={`px-3.5 py-2 rounded-full text-sm font-semibold transition border ${
                          isSelected
                            ? "bg-teal-600 text-white border-teal-600 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 inline mr-1" />}
                        {act}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tingkat Ketercapaian Target */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Apakah materi selesai disampaikan?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 100, label: "Selesai" },
                    { val: 75, label: "Sebagian" },
                    { val: 50, label: "Dilanjutkan pertemuan depan" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => {
                        setCompletionRate(item.val);
                        setIsDirty(true);
                      }}
                      className={`p-2.5 rounded-xl text-sm font-bold border transition ${
                        completionRate === item.val
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: CATATAN & FOTO ================= */}
          {currentStep === 3 && (
            <div className="space-y-5">
              {/* Catatan Harian Guru */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Catatan kejadian di kelas <span className="font-normal text-slate-500">(boleh dikosongkan)</span>
                </label>
                <textarea
                  rows={3}
                  value={teacherNotes}
                  onChange={(e) => {
                    setTeacherNotes(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Contoh: Bagas izin ke UKS karena flu. Proyektor tidak menyala."
                  className="w-full px-3.5 py-2.5 text-base rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Upload Foto Dokumentasi Kelas */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Foto kegiatan kelas <span className="font-normal text-slate-500">(boleh dikosongkan)</span>
                </label>

                {photoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Foto kegiatan kelas"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setIsDirty(true);
                      }}
                      className="absolute bottom-2 right-2 bg-rose-600 text-white text-sm font-bold px-3 py-2 rounded-xl shadow-md hover:bg-rose-700 transition"
                    >
                      Hapus Foto
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-teal-50/30 transition text-center">
                    <Camera className="w-8 h-8 text-teal-600 mb-2" />
                    <p className="text-base font-bold text-slate-800">
                      {isProcessingPhoto ? "Memproses foto..." : "Ambil Foto atau Pilih dari Galeri"}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Ukuran foto diperkecil otomatis agar hemat kuota.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      disabled={isProcessingPhoto}
                      className="hidden"
                    />
                  </label>
                )}
                {photoError && (
                  <p className="mt-1.5 text-sm text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {photoError}
                  </p>
                )}
              </div>

              {/* Ringkasan Jurnal Singkat Sebelum Simpan */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-teal-600" /> Periksa sebelum menyimpan:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
                  <div>
                    Kelas: <strong className="text-slate-900">{className}</strong>
                  </div>
                  <div>
                    Mapel: <strong className="text-slate-900">{subjectName}</strong>
                  </div>
                  <div>
                    Hadir: <strong className="text-slate-900">{presentCount} dari {totalStudents} siswa</strong>
                  </div>
                  <div>
                    Materi: <strong className="text-slate-900">{topicMaterials.trim() || "— belum diisi —"}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pesan gagal simpan */}
        {saveError && (
          <div className="mx-4 mb-0 mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Footer Tombol Aksi Sticky */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Kembali
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => goToStep((currentStep + 1) as 2 | 3)}
              className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center gap-1 shadow-sm cursor-pointer"
            >
              Lanjut <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting || isProcessingPhoto}
              onClick={handleSubmitJournal}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>Menyimpan...</>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Simpan Jurnal
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
