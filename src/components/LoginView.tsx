"use client";

import React, { useState, useEffect } from "react";
import { Institution, User } from "@/lib/types";
import {
  getInstitutionByToken,
  getInstitutions,
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
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

interface LoginViewProps {
  initialToken?: string;
  onLoginSuccess: (user: User, institution: Institution) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  initialToken = "",
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

  // Modal Akses Khusus Super Admin via Klik Logo
  const [showSuperAdminModal, setShowSuperAdminModal] = useState(false);
  const [superUsername, setSuperUsername] = useState("");
  const [superPassword, setSuperPassword] = useState("");
  const [superAdminError, setSuperAdminError] = useState("");
  const [showSuperPin, setShowSuperPin] = useState(false);

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
          setTokenError("Token Lembaga tidak ditemukan. Periksa kembali atau tanyakan ke admin sekolah Anda.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsCheckingToken(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [tokenInput]);

  // Submit Login Guru / Admin Lembaga
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
          u.pin === pinInput
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

  // Login Khusus Super Admin via Logo
  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuperAdminError("");

    const cleanUser = superUsername.trim().toLowerCase();
    if (cleanUser !== "superadmin" || superPassword !== "123000") {
      setSuperAdminError("Username atau password Super Admin tidak cocok.");
      return;
    }

    try {
      const institutions = await getInstitutions();
      const defaultInst = institutions[0] || {
        id: "inst-smp-1",
        token_lembaga: "SMPHARAPAN",
        name: "SMP Negeri 1 Harapan",
        education_level: "SMP",
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const superUser: User = {
        id: "user-superadmin",
        nip: "superadmin",
        name: "Super Administrator (Pusat Yayasan)",
        phone: "081100000000",
        pin: "123000",
        role: "SUPER_ADMIN",
        avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        is_active: true,
      };

      saveActiveToken(defaultInst.token_lembaga);
      saveSession(superUser, defaultInst);
      setShowSuperAdminModal(false);
      onLoginSuccess(superUser, defaultInst);
    } catch (err) {
      console.error(err);
      setSuperAdminError("Terjadi kendala saat login. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-teal-50/50 via-slate-50 to-slate-100 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header & Secret Super Admin Trigger via Logo */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setSuperUsername("");
              setSuperPassword("");
              setSuperAdminError("");
              setShowSuperAdminModal(true);
            }}
            className="w-14 h-14 mx-auto rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-teal-600/20 mb-3 transition cursor-pointer group"
            title="Akses Super Admin (Klik Logo)"
          >
            <School className="w-8 h-8 group-hover:scale-110 transition" />
          </button>
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
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" /> Scan QR
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  placeholder="Masukkan Token Lembaga..."
                  className="w-full px-3.5 py-2.5 text-base rounded-xl border border-slate-300 font-mono uppercase font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal placeholder:normal-case focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>

              {/* Status Validasi Token Lembaga */}
              {isCheckingToken && (
                <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                  Memeriksa lembaga...
                </p>
              )}

              {tokenError && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {tokenError}
                </p>
              )}

              {verifiedInstitution && !isCheckingToken && (
                <div className="mt-2 p-2.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-teal-950">
                        {verifiedInstitution.name}
                      </p>
                      <p className="text-[10px] text-teal-700">
                        Jenjang: {verifiedInstitution.education_level} • NPSN: {verifiedInstitution.npsn || "-"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-200/70 text-teal-900">
                    Terverifikasi
                  </span>
                </div>
              )}
            </div>

            {/* Input 2: NIP atau No WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                2. NIP atau Nomor WhatsApp Guru
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nipInput}
                  onChange={(e) => setNipInput(e.target.value)}
                  placeholder="NIP atau No. WhatsApp..."
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
                <span className="text-[11px] text-slate-400">PIN 6 Angka</span>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
        </div>

        {/* Footer Catatan Ramah Guru */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Belum memiliki Token Lembaga atau lupa PIN? Hubungi Administrator Sekolah Anda.
        </p>
      </div>

      {/* Modal Akses Khusus Super Admin (Buka via Klik Logo MySch) */}
      {showSuperAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Portal Super Admin
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Akses Pusat Pengelola Seluruh Lembaga
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSuperAdminModal(false);
                  setSuperAdminError("");
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSuperAdminLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                  Username Super Admin
                </label>
                <input
                  type="text"
                  value={superUsername}
                  onChange={(e) => setSuperUsername(e.target.value)}
                  placeholder="superadmin"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                  Password Super Admin
                </label>
                <div className="relative">
                  <input
                    type={showSuperPin ? "text" : "password"}
                    value={superPassword}
                    onChange={(e) => setSuperPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-wider text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSuperPin(!showSuperPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSuperPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {superAdminError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{superAdminError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk sebagai Super Admin</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Petunjuk Scan QR Code */}
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
              Arahkan kamera ke poster QR Code yang dibagikan oleh admin sekolah Anda untuk mengisi Token Lembaga otomatis.
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <div className="w-32 h-32 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                <QrCode className="w-20 h-20 text-teal-600" />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Hubungi operator sekolah jika Anda belum memiliki poster QR Code.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold cursor-pointer"
            >
              Tutup & Masukkan Token Manual
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
