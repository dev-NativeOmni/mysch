"use client";

import React, { useState, useRef } from "react";
import { User, Institution } from "@/lib/types";
import { saveUser, saveSession } from "@/lib/storage";
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    let updatedPin = user.pin;

    // Jika user mengisi form ganti PIN
    if (newPin.trim() || confirmPin.trim()) {
      if (newPin.length < 4 || newPin.length > 6) {
        setErrorMsg("PIN baru harus terdiri dari 4 sampai 6 digit angka.");
        return;
      }
      if (!/^\d+$/.test(newPin)) {
        setErrorMsg("PIN baru hanya boleh berisi angka (0-9).");
        return;
      }
      if (newPin !== confirmPin) {
        setErrorMsg("Konfirmasi PIN baru tidak sesuai.");
        return;
      }
      if (currentPin && currentPin !== user.pin && user.role !== "SUPER_ADMIN") {
        setErrorMsg("PIN saat ini tidak cocok. Periksa kembali.");
        return;
      }
      updatedPin = newPin.trim();
    }

    setSaving(true);
    try {
      const updatedUser: User = {
        ...user,
        avatar_url: avatarUrl,
        pin: updatedPin,
      };

      await saveUser(updatedUser);
      saveSession(updatedUser, activeInstitution);
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

          {/* 3. Ganti PIN Masuk */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-teal-700" />
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                  Ganti PIN Masuk
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
              Kosongkan bagian ini jika Anda tidak ingin mengubah PIN masuk akun.
            </p>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  PIN Baru (4 - 6 Digit Angka)
                </label>
                <input
                  type={showPin ? "text" : "password"}
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Misal: 123456"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono tracking-widest text-slate-900 font-bold focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Konfirmasi PIN Baru
                </label>
                <input
                  type={showPin ? "text" : "password"}
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ketik ulang PIN baru"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono tracking-widest text-slate-900 font-bold focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

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
