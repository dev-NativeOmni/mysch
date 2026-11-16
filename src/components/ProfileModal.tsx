"use client";

import React, { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { User, Institution } from "@/lib/types";
import { saveUser, saveSession, getUserById, getSuperAdminUser } from "@/lib/storage";
import {
  DEFAULT_TEACHER_PIN,
  DEFAULT_USER_SALT,
  SUPER_ADMIN_SALT,
  hashSecret,
  setDefaultPinWarning,
  verifySecret,
} from "@/lib/authUtils";
import {
  buildOtpAuthUri,
  generateBase32Secret,
  verifyTotpCode,
} from "@/lib/totpUtils";
import { compressImage } from "@/lib/imageUtils";
import {
  User as UserIcon,
  Camera,
  KeyRound,
  Shield,
  School,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  X,
  Upload,
  Smartphone,
  Copy,
  Check,
} from "lucide-react";

interface ProfileModalProps {
  user: User;
  activeInstitution: Institution;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (updatedUser: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  activeInstitution,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user.avatar_url);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 2FA Google Authenticator (khusus Super Admin)
  const [totpEnabled, setTotpEnabled] = useState(Boolean(user.totp_enabled));
  const [pendingTotpSecret, setPendingTotpSecret] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [totpVerifyCode, setTotpVerifyCode] = useState("");
  const [totpDisableConfirmCode, setTotpDisableConfirmCode] = useState("");
  const [showDisableTotpPrompt, setShowDisableTotpPrompt] = useState(false);
  const [totpWorking, setTotpWorking] = useState(false);
  const [totpSecretCopied, setTotpSecretCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || user.role !== "SUPER_ADMIN") return;
    getSuperAdminUser()
      .then((live) => setTotpEnabled(Boolean(live.totp_enabled && live.totp_secret)))
      .catch(() => {});
  }, [isOpen, user.role]);

  if (!isOpen) return null;

  const handleStartTotpSetup = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    const secret = generateBase32Secret(20);
    const uri = buildOtpAuthUri(secret, "superadmin", "My School ID");
    try {
      const dataUrl = await QRCode.toDataURL(uri, {
        width: 192,
        margin: 1,
      });
      setPendingTotpSecret(secret);
      setQrDataUrl(dataUrl);
      setTotpVerifyCode("");
    } catch {
      setErrorMsg("Gagal membuat QR Code 2FA. Coba lagi.");
    }
  };

  const handleConfirmEnableTotp = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    if (totpVerifyCode.trim().length !== 6) {
      setErrorMsg("Masukkan 6 digit kode dari Google Authenticator terlebih dahulu.");
      return;
    }

    setTotpWorking(true);
    try {
      const valid = await verifyTotpCode(pendingTotpSecret, totpVerifyCode);
      if (!valid) {
        setErrorMsg("Kode 2FA tidak cocok. Pastikan jam di HP Anda sinkron otomatis.");
        return;
      }

      const liveUser = await getSuperAdminUser();
      const updatedUser: User = {
        ...liveUser,
        avatar_url: avatarUrl,
        totp_enabled: true,
        totp_secret: pendingTotpSecret,
      };
      await saveUser(updatedUser);
      saveSession(updatedUser, activeInstitution);
      onUserUpdated(updatedUser);

      setTotpEnabled(true);
      setPendingTotpSecret("");
      setQrDataUrl("");
      setTotpVerifyCode("");
      setSuccessMsg("2FA Google Authenticator berhasil diaktifkan! Saat klik logo di halaman login, Anda bisa langsung masuk dengan kode 6 digit.");
    } catch {
      setErrorMsg("Gagal menyimpan pengaturan 2FA. Silakan coba lagi.");
    } finally {
      setTotpWorking(false);
    }
  };

  const handleDisableTotp = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setTotpWorking(true);
    try {
      const liveUser = await getSuperAdminUser();
      const input = totpDisableConfirmCode.trim();
      const validTotp = liveUser.totp_secret
        ? await verifyTotpCode(liveUser.totp_secret, input)
        : false;
      const validPass = await verifySecret(input, liveUser.pin, SUPER_ADMIN_SALT);

      if (!validTotp && !validPass) {
        setErrorMsg("Masukkan kode 6 digit Google Authenticator atau password Super Admin yang benar.");
        return;
      }

      const updatedUser: User = {
        ...liveUser,
        totp_enabled: false,
        totp_secret: undefined,
      };
      await saveUser(updatedUser);
      saveSession(updatedUser, activeInstitution);
      onUserUpdated(updatedUser);

      setTotpEnabled(false);
      setShowDisableTotpPrompt(false);
      setTotpDisableConfirmCode("");
      setSuccessMsg("2FA Google Authenticator dinonaktifkan.");
    } catch {
      setErrorMsg("Gagal menonaktifkan 2FA.");
    } finally {
      setTotpWorking(false);
    }
  };

  // Handle Image File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setSuccessMsg("");
    setUploading(true);

    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("Pilih berkas gambar dengan format JPG, PNG, atau WebP.");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Ukuran berkas maksimal 5MB.");
      }

      const compressedDataUrl = await compressImage(file, 280, 0.85);
      setAvatarUrl(compressedDataUrl);
      setSuccessMsg("Foto profil berhasil dipilih. Klik 'Simpan Perubahan' untuk menerapkan.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal memproses gambar.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSuccessMsg("Foto profil dihapus. Klik 'Simpan Perubahan' untuk menerapkan.");
  };

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const liveUser = isSuperAdmin
      ? await getSuperAdminUser()
      : (await getUserById(user.id)) || user;

    let updatedPin = liveUser.pin;
    const isChangingSecret = Boolean(newPin.trim() || confirmPin.trim());

    // Jika user mengisi form ganti PIN / Password
    if (isChangingSecret) {
      if (!currentPin.trim()) {
        setErrorMsg(
          isSuperAdmin
            ? "Masukkan password saat ini untuk verifikasi."
            : "Masukkan PIN saat ini untuk verifikasi."
        );
        return;
      }

      const activeSalt = isSuperAdmin ? SUPER_ADMIN_SALT : DEFAULT_USER_SALT;
      const isCurrentValid = await verifySecret(
        currentPin.trim(),
        liveUser.pin,
        activeSalt
      );
      if (!isCurrentValid) {
        setErrorMsg(
          isSuperAdmin
            ? "Password saat ini tidak cocok. Periksa kembali."
            : "PIN saat ini tidak cocok. Periksa kembali."
        );
        return;
      }

      if (isSuperAdmin) {
        if (newPin.trim().length < 6 || newPin.trim().length > 32) {
          setErrorMsg("Password baru Super Admin harus terdiri dari 6 sampai 32 karakter.");
          return;
        }
      } else {
        if (newPin.length < 4 || newPin.length > 6) {
          setErrorMsg("PIN baru harus terdiri dari 4 sampai 6 digit angka.");
          return;
        }
        if (!/^\d+$/.test(newPin)) {
          setErrorMsg("PIN baru hanya boleh berisi angka (0-9).");
          return;
        }
      }

      if (newPin !== confirmPin) {
        setErrorMsg(
          isSuperAdmin
            ? "Konfirmasi password baru tidak sesuai."
            : "Konfirmasi PIN baru tidak sesuai."
        );
        return;
      }

      updatedPin = await hashSecret(newPin.trim(), activeSalt);
    }

    setSaving(true);
    try {
      const updatedUser: User = {
        ...liveUser,
        avatar_url: avatarUrl,
        pin: updatedPin,
      };

      await saveUser(updatedUser);
      saveSession(updatedUser, activeInstitution);
      if (isChangingSecret && newPin.trim() !== DEFAULT_TEACHER_PIN) {
        setDefaultPinWarning(false);
      }
      onUserUpdated(updatedUser);

      setSuccessMsg("Profil dan pengaturan berhasil diperbarui!");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal menyimpan perubahan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin Yayasan";
      case "ADMIN":
        return "Admin Kurikulum";
      case "HEADMASTER":
        return "Kepala Sekolah";
      default:
        return "Guru Pengampu";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                Pengaturan Profil Saya
              </h2>
              <p className="text-xs text-slate-500">
                Ubah foto avatar dan PIN keamanan akun Anda
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

        {/* Notifikasi Error / Sukses */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Bagian Avatar Profil */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-2xl ring-4 ring-white shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-teal-600 text-white shadow hover:bg-teal-700 transition cursor-pointer"
                title="Ganti Foto"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-center sm:text-left flex-1 space-y-1">
              <p className="font-bold text-sm text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500 font-mono">
                {user.role === "SUPER_ADMIN" ? "superadmin" : `NIP/ID: ${user.nip}`}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>{uploading ? "Memproses..." : "Unggah Foto Baru"}</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 pt-0.5">
                Format: JPG, PNG, atau WebP (otomatis dioptimalkan).
              </p>
            </div>
          </div>

          {/* 2. Informasi Ringkas Akun */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-400 font-bold uppercase block">Peran Pengguna</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-teal-600" />
                {getRoleLabel(user.role)}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-400 font-bold uppercase block">Lembaga Terdaftar</span>
              <span className="font-semibold text-slate-800 truncate block mt-0.5" title={activeInstitution.name}>
                {activeInstitution.name}
              </span>
            </div>
          </div>

          {/* 3. Ganti PIN / Password Masuk */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-teal-700" />
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                  {isSuperAdmin ? "Ganti Password Super Admin" : "Ganti PIN Masuk"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPin ? "Sembunyikan" : "Tampilkan"}</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {isSuperAdmin
                ? "Kosongkan bagian ini jika Anda tidak ingin mengubah password Super Admin."
                : "Kosongkan bagian ini jika Anda tidak ingin mengubah PIN masuk akun."}
            </p>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  {isSuperAdmin ? "Password Saat Ini" : "PIN Saat Ini"}
                </label>
                <input
                  type={showPin ? "text" : "password"}
                  maxLength={isSuperAdmin ? 32 : 6}
                  value={currentPin}
                  onChange={(e) =>
                    setCurrentPin(
                      isSuperAdmin ? e.target.value : e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder={isSuperAdmin ? "Masukkan password saat ini" : "Masukkan PIN saat ini"}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono tracking-widest text-slate-900 font-bold focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  {isSuperAdmin ? "Password Baru (6 - 32 Karakter)" : "PIN Baru (4 - 6 Digit Angka)"}
                </label>
                <input
                  type={showPin ? "text" : "password"}
                  maxLength={isSuperAdmin ? 32 : 6}
                  value={newPin}
                  onChange={(e) =>
                    setNewPin(
                      isSuperAdmin ? e.target.value : e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder={isSuperAdmin ? "Minimal 6 karakter" : "Misal: 654321"}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono tracking-widest text-slate-900 font-bold focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  {isSuperAdmin ? "Konfirmasi Password Baru" : "Konfirmasi PIN Baru"}
                </label>
                <input
                  type={showPin ? "text" : "password"}
                  maxLength={isSuperAdmin ? 32 : 6}
                  value={confirmPin}
                  onChange={(e) =>
                    setConfirmPin(
                      isSuperAdmin ? e.target.value : e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder={isSuperAdmin ? "Ketik ulang password baru" : "Ketik ulang PIN baru"}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono tracking-widest text-slate-900 font-bold focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 4. 2FA Google Authenticator (Khusus Super Admin) */}
          {isSuperAdmin && (
            <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-teal-700" />
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                    2FA Google Authenticator
                  </h3>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    totpEnabled
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {totpEnabled ? "Aktif" : "Belum Aktif"}
                </span>
              </div>

              {totpEnabled ? (
                <div className="space-y-2.5 text-xs">
                  <p className="text-slate-600">
                    Login Super Admin sudah terhubung ke Google Authenticator. Klik logo sekolah di halaman masuk untuk langsung login dengan kode 6 digit.
                  </p>
                  {!showDisableTotpPrompt ? (
                    <button
                      type="button"
                      onClick={() => setShowDisableTotpPrompt(true)}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition cursor-pointer"
                    >
                      Nonaktifkan 2FA
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                      <label className="block font-semibold text-rose-900">
                        Masukkan kode 6 digit 2FA atau password Super Admin untuk konfirmasi:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={totpDisableConfirmCode}
                          onChange={(e) => setTotpDisableConfirmCode(e.target.value)}
                          placeholder="Kode 6 digit / password"
                          className="flex-1 p-2 rounded-xl border border-rose-300 bg-white text-slate-900 font-mono text-xs focus:outline-hidden"
                        />
                        <button
                          type="button"
                          disabled={totpWorking}
                          onClick={handleDisableTotp}
                          className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                        >
                          Konfirmasi
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDisableTotpPrompt(false);
                            setTotpDisableConfirmCode("");
                          }}
                          className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-600 font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : pendingTotpSecret ? (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-600">
                    1. Buka aplikasi <strong>Google Authenticator</strong> di HP, pilih <strong>+ → Pindai kode QR</strong>:
                  </p>
                  {qrDataUrl && (
                    <div className="flex justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <img src={qrDataUrl} alt="QR Code Google Authenticator" className="w-40 h-40 rounded-lg" />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-400 font-bold block">Atau masukkan kunci manual:</span>
                      <span className="font-mono font-bold text-slate-800 break-all">{pendingTotpSecret}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(pendingTotpSecret);
                        setTotpSecretCopied(true);
                        setTimeout(() => setTotpSecretCopied(false), 1500);
                      }}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-teal-700 shrink-0 cursor-pointer"
                      title="Salin kunci rahasia"
                    >
                      {totpSecretCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      2. Masukkan kode 6 digit yang muncul di Google Authenticator:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={totpVerifyCode}
                        onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        className="flex-1 p-2.5 rounded-xl border border-slate-300 font-mono text-center tracking-[0.3em] text-sm font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        disabled={totpWorking || totpVerifyCode.length !== 6}
                        onClick={handleConfirmEnableTotp}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                      >
                        {totpWorking ? "Memverifikasi..." : "Aktifkan"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs">
                  <p className="text-slate-600">
                    Aktifkan 2FA agar saat klik logo di halaman login, Anda cukup memasukkan kode 6 digit dari Google Authenticator.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartTotpSetup}
                    className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold transition cursor-pointer"
                  >
                    Aktifkan Google Authenticator
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
