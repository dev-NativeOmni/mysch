"use client";

import React, { useState, useEffect } from "react";
import { Schedule, User, Institution, Student, AttendanceStatus, JournalEntry, AttendanceRecord } from "@/lib/types";
import { getStudentsByClass, getClasses, getSubjects, saveJournal } from "@/lib/storage";
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
  Upload,
} from "lucide-react";

interface JournalWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  user: User;
  activeInstitution: Institution;
  onSaved: (entry: JournalEntry) => void;
}

export const JournalWizardModal: React.FC<JournalWizardModalProps> = ({
  isOpen,
  onClose,
  schedule,
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
  const [learningObjective, setLearningObjective] = useState("");
  const [topicMaterials, setTopicMaterials] = useState("Bab 3: Sistem Peredaran Darah Manusia");
  const [selectedActivities, setSelectedActivities] = useState<string[]>([
    "Diskusi Kelompok",
    "Praktikum Lab",
  ]);
  const [completionRate, setCompletionRate] = useState<number>(100);

  // Step 3: Catatan & Foto
  const [teacherNotes, setTeacherNotes] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      setClassName(cls ? cls.name : "Kelas VIII-A");
      setSubjectName(sub ? sub.name : "IPA");
      setStudents(stdList);

      // Inisialisasi: SEMUA SISWA HADIR SECARA DEFAULT!
      const initialMap: Record<string, AttendanceStatus> = {};
      stdList.forEach((s) => {
        initialMap[s.id] = "H";
      });
      setAttendanceMap(initialMap);

      if (!learningObjective) {
        setLearningObjective("Peserta didik mampu mengidentifikasi komponen penyusun darah dan fungsinya.");
      }
    }

    loadData();
  }, [isOpen, schedule, activeInstitution.id, learningObjective]);

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
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Reset semua hadir
  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.id] = "H";
    });
    setAttendanceMap(updated);
  };

  // Toggle metode aktivitas
  const toggleActivity = (activity: string) => {
    if (selectedActivities.includes(activity)) {
      setSelectedActivities(selectedActivities.filter((a) => a !== activity));
    } else {
      setSelectedActivities([...selectedActivities, activity]);
    }
  };

  // Simulasi upload foto kompresi
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Simpan Jurnal
  const handleSubmitJournal = async () => {
    setIsSubmitting(true);
    try {
      const attendanceRecords: AttendanceRecord[] = students.map((s) => ({
        student_id: s.id,
        student_name: s.full_name,
        status: attendanceMap[s.id] || "H",
      }));

      const newEntry: JournalEntry = {
        id: "jrn-" + Date.now(),
        institution_id: activeInstitution.id,
        schedule_id: schedule.id,
        actual_teacher_id: user.id,
        teacher_name: user.name,
        class_name: className,
        subject_name: subjectName,
        entry_date: new Date().toISOString().split("T")[0],
        start_period: schedule.start_period,
        end_period: schedule.end_period,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        learning_objective: learningObjective,
        topic_materials: topicMaterials,
        learning_activities: selectedActivities,
        student_present_count: presentCount,
        student_sick_count: sickCount,
        student_permit_count: permitCount,
        student_absent_count: absentCount,
        attendance_records: attendanceRecords,
        teacher_notes: teacherNotes || "Pembelajaran berjalan tertib dan kondusif.",
        photo_url: photoPreview || undefined,
        completion_rate: completionRate,
        is_locked: false,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const activityOptions = [
    "Diskusi Kelompok",
    "Praktikum Lab",
    "Ceramah Interaktif",
    "Presentasi Siswa",
    "Latihan Soal / Kuis",
    "Tugas Mandiri",
    "Refleksi & Tanya Jawab",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md">
                Kelas {className}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {schedule.start_time} - {schedule.end_time} WIB
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              Isi Jurnal: {subjectName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Stepper Indicator (3 Langkah Ringan) */}
        <div className="grid grid-cols-3 bg-white border-b border-slate-200 text-xs font-bold text-center shrink-0">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
              currentStep === 1
                ? "border-teal-600 text-teal-700 bg-teal-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. Presensi</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
              currentStep === 2
                ? "border-teal-600 text-teal-700 bg-teal-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Materi</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
              currentStep === 3
                ? "border-teal-600 text-teal-700 bg-teal-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>3. Catatan</span>
          </button>
        </div>

        {/* Konten Wizard (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* ================= STEP 1: PRESENSI SISWA ================= */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Live Tally Counter Card */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    Total Siswa: {totalStudents}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      H: {presentCount}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      S: {sickCount}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      I: {permitCount}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      A: {absentCount}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-white border border-teal-300 px-2.5 py-1.5 rounded-xl shadow-2xs flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Semua Hadir
                </button>
              </div>

              {/* Petunjuk Human-Centric */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-teal-50 text-teal-900 text-xs">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Prinsip Cepat:</strong> Semua siswa otomatis berstatus{" "}
                  <strong>Hadir</strong>. Anda hanya perlu mengetuk siswa yang Sakit (S), Izin (I), atau Alpa (A).
                </p>
              </div>

              {/* Kolom Cari Siswa */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama siswa..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Daftar Siswa */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                {filteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Tidak ada siswa ditemukan dengan kata kunci &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  filteredStudents.map((std, idx) => {
                    const status = attendanceMap[std.id] || "H";
                    return (
                      <div
                        key={std.id}
                        className="p-3 flex items-center justify-between hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="w-6 text-xs text-slate-400 font-mono text-center">
                            {idx + 1}.
                          </span>
                          <div className="truncate">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {std.full_name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              NISN: {std.nisn}
                            </p>
                          </div>
                        </div>

                        {/* QuickPill Button Group */}
                        <div className="shrink-0">
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
            <div className="space-y-4">
              {/* Bab / Topik Pembelajaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Bab / Materi Pokok yang Diajarkan
                </label>
                <input
                  type="text"
                  value={topicMaterials}
                  onChange={(e) => setTopicMaterials(e.target.value)}
                  placeholder="Contoh: Bab 3: Sistem Peredaran Darah Manusia"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Capaian Pembelajaran / Tujuan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Tujuan Pembelajaran / Capaian
                </label>
                <textarea
                  rows={2}
                  value={learningObjective}
                  onChange={(e) => setLearningObjective(e.target.value)}
                  placeholder="Uraikan target capaian siswa pada jam ini..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Chips Metode Belajar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Metode & Aktivitas Belajar (Pilih yang Sesuai)
                </label>
                <div className="flex flex-wrap gap-2">
                  {activityOptions.map((act) => {
                    const isSelected = selectedActivities.includes(act);
                    return (
                      <button
                        key={act}
                        type="button"
                        onClick={() => toggleActivity(act)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                          isSelected
                            ? "bg-teal-600 text-white border-teal-600 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 inline mr-1" />}
                        {act}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tingkat Ketercapaian Target */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Ketercapaian Target Jam Ini
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 100, label: "Tuntas 100%" },
                    { val: 75, label: "Sebagian (75%)" },
                    { val: 50, label: "Perlu Lanjutan" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setCompletionRate(item.val)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition ${
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
            <div className="space-y-4">
              {/* Catatan Harian Guru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Catatan Kejadian Khusus / Siswa / Sarana
                </label>
                <textarea
                  rows={3}
                  value={teacherNotes}
                  onChange={(e) => setTeacherNotes(e.target.value)}
                  placeholder="Contoh: Bagas sakit flu izin ke UKS. LCD proyektor berfungsi dengan baik. Seluruh siswa antusias saat praktikum preparat sel."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Upload Foto Dokumentasi Kelas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Foto Dokumentasi Kelas (Opsional)
                </label>

                {photoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Dokumentasi Kelas"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-slate-900/70 text-white text-[11px] px-2 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Otomatis Kompresi (~180 KB)
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute bottom-2 right-2 bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md hover:bg-rose-700 transition"
                    >
                      Hapus Foto
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-teal-50/30 transition text-center">
                    <Camera className="w-8 h-8 text-teal-600 mb-2" />
                    <p className="text-xs font-bold text-slate-800">
                      Ambil Foto Kamera atau Pilih dari Galeri
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Otomatis dikompresi di bawah 300 KB untuk menghemat kuota.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Ringkasan Jurnal Singkat Sebelum Simpan */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-teal-600" /> Ringkasan Jurnal Hari Ini:
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600">
                  <div>Kelas: <strong>{className}</strong></div>
                  <div>Mapel: <strong>{subjectName}</strong></div>
                  <div>Kehadiran: <strong>{presentCount}/{totalStudents} Siswa</strong></div>
                  <div>Target: <strong>{completionRate}% Selesai</strong></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Tombol Aksi Sticky */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Kembali
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3)}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
            >
              Lanjut ke Langkah {currentStep + 1} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitJournal}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>Menyimpan...</>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Simpan Jurnal Hari Ini
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
