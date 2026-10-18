"use client";

import React, { useState } from "react";
import { JournalEntry, Institution } from "@/lib/types";
import {
  X,
  History,
  Calendar,
  BookOpen,
  Users,
  Camera,
  CheckCircle2,
  Printer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface JournalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  journals: JournalEntry[];
  activeInstitution: Institution;
}

export const JournalHistoryModal: React.FC<JournalHistoryModalProps> = ({
  isOpen,
  onClose,
  journals,
  activeInstitution,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Riwayat Jurnal Mengajar
              </h2>
              <p className="text-xs text-slate-500">
                {activeInstitution.name} • Total {journals.length} Jurnal Terarsip
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {journals.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold">Belum Ada Riwayat Jurnal</p>
              <p className="text-xs">Jurnal yang Anda isi hari ini akan tersimpan otomatis di sini.</p>
            </div>
          ) : (
            journals.map((jrn) => {
              const isExpanded = expandedId === jrn.id;
              return (
                <div
                  key={jrn.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition"
                >
                  {/* Card Header Accordion */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : jrn.id)}
                    className="p-4 cursor-pointer hover:bg-slate-50 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          Kelas {jrn.class_name} • {jrn.subject_name}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {jrn.student_present_count} Hadir
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" /> {jrn.entry_date}
                        </span>
                        <span>
                          {jrn.start_time} - {jrn.end_time} WIB
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-700 block uppercase tracking-wide text-[10px]">
                          Materi Pembelajaran:
                        </span>
                        <p className="font-medium text-slate-900 mt-0.5">{jrn.topic_materials}</p>
                      </div>

                      {jrn.learning_objective && (
                        <div>
                          <span className="font-bold text-slate-700 block uppercase tracking-wide text-[10px]">
                            Tujuan Pembelajaran:
                          </span>
                          <p className="text-slate-800 mt-0.5">{jrn.learning_objective}</p>
                        </div>
                      )}

                      {jrn.learning_activities && jrn.learning_activities.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-700 block uppercase tracking-wide text-[10px]">
                            Aktivitas Belajar:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {jrn.learning_activities.map((act) => (
                              <span
                                key={act}
                                className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-semibold"
                              >
                                {act}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="font-bold text-slate-700 block uppercase tracking-wide text-[10px]">
                          Catatan Kelas & Kejadian:
                        </span>
                        <p className="text-slate-800 mt-0.5 italic">
                          &quot;{jrn.teacher_notes || "Tidak ada catatan khusus."}&quot;
                        </p>
                      </div>

                      {jrn.photo_url && (
                        <div>
                          <span className="font-bold text-slate-700 block uppercase tracking-wide text-[10px] mb-1">
                            Dokumentasi Kelas:
                          </span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={jrn.photo_url}
                            alt="Foto Kelas"
                            className="w-full max-h-48 object-cover rounded-xl border border-slate-200"
                          />
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-[11px] hover:bg-slate-100 flex items-center gap-1.5 transition"
                        >
                          <Printer className="w-3.5 h-3.5" /> Cetak Agenda Ini
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
