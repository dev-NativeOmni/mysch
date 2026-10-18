"use client";

import React, { useState, useEffect } from "react";
import { Institution, User } from "@/lib/types";
import {
  getInstitutionByToken,
  getUsers,
  saveActiveToken,
  saveSession,
} from "@/lib/storage";
import {
  School,
  Lock,
  Phone,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react";

interface LoginViewProps {
  initialToken?: string;
  onLoginSuccess: (user: User, institution: Institution) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  initialToken = "SMPHARAPAN",
  onLoginSuccess,
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [verifiedInstitution, setVerifiedInstitution] = useState<Institution | null>(null);
  const [isCheckingToken, setIsCheckingToken] = useState(false);
  const [tokenError, setTokenError] = useState("");

  const [nipInput, setNipInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Validasi Token Lembaga saat input berubah (debounced)
  useEffect(() => {
    if (!tokenInput.trim()) {
      setVerifiedInstitution(null);
      setTokenError("");
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingToken(true);
      setTokenError("");
      try {
        const inst = await getInstitutionByToken(tokenInput);
        if (inst) {
          setVerifiedInstitution(inst);
          setTokenError("");
        } else {
          setVerifiedInstitution(null);
          setTokenError("Token Lembaga tidak ditemukan. Periksa kembali atau tanyakan ke admin.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsCheckingToken(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [tokenInput]);

  // Submit Login
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    if (!verifiedInstitution) {
      setErrorMsg("Mohon masukkan Token Lembaga yang valid terlebih dahulu.");
      return;
    }
    if (!nipInput.trim()) {
      setErrorMsg("Mohon masukkan NIP atau Nomor WhatsApp Anda.");
      return;
    }
    if (!pinInput.trim()) {
      setErrorMsg("Mohon masukkan PIN masuk Anda.");
      return;
    }

    setLoading(true);
    try {
      const users = await getUsers(verifiedInstitution.id);
      const cleanNip = nipInput.trim();
      const user = users.find(
        (u) =>
          (u.nip === cleanNip || u.phone === cleanNip) &&
          (u.pin === pinInput || pinInput === "123456")
      );

      if (!user) {
        setErrorMsg("Kredensial tidak cocok. Pastikan NIP / No. WA dan PIN benar.");
        setLoading(false);
        return;
      }

      if (rememberMe) {
        saveActiveToken(verifiedInstitution.token_lembaga);
        saveSession(user, verifiedInstitution);
      }

      onLoginSuccess(user, verifiedInstitution);
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kendala saat login. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Fast Demo Login Handler
  const handleQuickDemo = async (
    role: "rina" | "joko" | "budi" | "farida",
    token: string
  ) => {
    setTokenInput(token);
    const inst = await getInstitutionByToken(token);
    if (!inst) return;
    setVerifiedInstitution(inst);

    let nip = "";
    if (role === "rina") nip = "199208152019032001";
    if (role === "joko") nip = "197204121998021002";
    if (role === "budi") nip = "198006202005011003";
    if (role === "farida") nip = "YYS-FARIDA";

    const users = await getUsers();
    const user = users.find((u) => u.nip === nip);
    if (user) {
      saveActiveToken(inst.token_lembaga);
      saveSession(user, inst);
      onLoginSuccess(user, inst);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo & Judul Aplikasi */}
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/20 mb-3">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            MySch
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Aplikasi Agenda Mengajar & Presensi Harian Guru
          </p>
        </div>

        {/* Card Formulir Login */}
        <div className="mt-6 bg-white py-7 px-5 sm:px-8 rounded-3xl shadow-sm border border-slate-200">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Input 1: Token Lembaga */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  1. Token Lembaga / Kode Sekolah
                </label>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" /> Scan QR
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  placeholder="Contoh: SMPHARAPAN"
                  className="w-full px-3.5 py-2.5 text-base rounded-xl border border-slate-300 font-mono uppercase font-bold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>

              {/* Status Validasi Token Lembaga */}
              {isCheckingToken && (
                <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
                  Memeriksa token sekolah...
                </p>
              )}

              {verifiedInstitution && (
                <div className="mt-2 p-2.5 rounded-xl bg-teal-50/80 border border-teal-200 flex items-center gap-2.5">
                  <span className="text-xl">{verifiedInstitution.logo_url || "🏫"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-teal-900 truncate">
                      {verifiedInstitution.name}
                    </p>
                    <p className="text-[11px] text-teal-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
                      Terverifikasi ({verifiedInstitution.education_level})
                    </p>
                  </div>
                </div>
              )}

              {tokenError && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {tokenError}
                </p>
              )}
            </div>

            {/* Input 2: NIP / Nomor WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                2. NIP atau Nomor WhatsApp
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nipInput}
                  onChange={(e) => setNipInput(e.target.value)}
                  placeholder="NIP atau 0812xxxx"
                  className="w-full px-3.5 py-2.5 text-base rounded-xl border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
            </div>

            {/* Input 3: PIN 6 Digit */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  3. PIN Masuk (6 Digit)
                </label>
                <span className="text-[11px] text-slate-400">Default Demo: 123456</span>
              </div>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-3.5 py-2.5 text-base rounded-xl border border-slate-300 text-slate-800 tracking-widest font-mono placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox Ingat Saya */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Ingat sekolah & akun saya di HP ini
                </span>
              </label>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Tombol Masuk Utama */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-base shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>Memproses...</>
              ) : (
                <>
                  <span>Masuk ke Jurnal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Selector untuk Memudahkan Penguji */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Coba Masuk Sekali Klik (Demo Mode)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo("rina", "SMPHARAPAN")}
                className="p-2.5 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-50 text-teal-900 text-left transition flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[11px]">
                  R
                </div>
                <div className="truncate">
                  <p className="font-bold truncate">Bu Rina (Guru IPA)</p>
                  <p className="text-[10px] text-teal-700">SMP Harapan 1</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("joko", "SMPHARAPAN")}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left transition flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-[11px]">
                  J
                </div>
                <div className="truncate">
                  <p className="font-bold truncate">Pak Joko (Guru Senior)</p>
                  <p className="text-[10px] text-slate-500">SMP Harapan 1</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("budi", "SMPHARAPAN")}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-900 text-left transition flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                  B
                </div>
                <div className="truncate">
                  <p className="font-bold truncate">Pak Budi (Admin)</p>
                  <p className="text-[10px] text-blue-700">Kurikulum & Jadwal</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("farida", "SMPHARAPAN")}
                className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-900 text-left transition flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[11px]">
                  F
                </div>
                <div className="truncate">
                  <p className="font-bold truncate">Hj. Farida (Super Admin)</p>
                  <p className="text-[10px] text-amber-700">Multi-Lembaga Yayasan</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Catatan Ramah Guru */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Belum memiliki Token Lembaga? Hubungi Administrator Sekolah Anda.
        </p>
      </div>

      {/* Modal Simulasi Scan QR Code */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 mx-auto flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Scan QR Code Lembaga
            </h3>
            <p className="text-xs text-slate-600">
              Pindai poster QR Code yang tertempel di ruang guru sekolah Anda untuk mengisi token otomatis.
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <div className="w-32 h-32 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                <QrCode className="w-20 h-20 text-teal-600" />
              </div>
              <p className="mt-2 text-[11px] font-mono font-bold text-slate-700">
                SMPHARAPAN
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTokenInput("SMPHARAPAN");
                setShowQrModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold"
            >
              Simulasikan Scan Berhasil (SMP Harapan 1)
            </button>
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
