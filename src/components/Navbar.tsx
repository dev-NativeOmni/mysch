"use client";

import React, { useState } from "react";
import { Institution, User } from "@/lib/types";
import { isFirebaseConfigured } from "@/lib/firebase";
import { ProfileModal } from "./ProfileModal";
import {
  School,
  LogOut,
  ChevronDown,
  Building2,
  CheckCircle2,
  Cloud,
  HardDrive,
  User as UserIcon,
  Shield,
  Settings,
  Award,
} from "lucide-react";

interface NavbarProps {
  user: User;
  activeInstitution: Institution;
  institutions: Institution[];
  onSwitchInstitution: (inst: Institution) => void;
  onLogout: () => void;
  onUserUpdated?: (user: User) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeInstitution,
  institutions,
  onSwitchInstitution,
  onLogout,
  onUserUpdated,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const hasImageLogo =
    activeInstitution.logo_url &&
    (activeInstitution.logo_url.startsWith("data:") ||
      activeInstitution.logo_url.startsWith("http"));

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Sisi Kiri: Brand & Logo Sekolah */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden shrink-0">
                {hasImageLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeInstitution.logo_url}
                    alt={activeInstitution.name}
                    className="w-full h-full object-contain bg-white p-0.5 rounded-xl"
                  />
                ) : (
                  <School className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                    My School ID
                  </span>
                </div>

                {/* Selector / Label Lembaga Aktif */}
                <div className="relative">
                  {isSuperAdmin ? (
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 transition cursor-pointer"
                    >
                      <span className="truncate max-w-[160px] sm:max-w-[220px]">
                        {activeInstitution.name}
                      </span>
                      <span className="bg-slate-100 text-slate-600 text-xs px-1.5 py-0.2 rounded font-mono">
                        {activeInstitution.token_lembaga}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ) : (
                    <p className="text-sm font-medium text-slate-600 truncate max-w-[180px] sm:max-w-none">
                      {activeInstitution.name}
                    </p>
                  )}

                  {/* Dropdown Multi-Lembaga untuk Super Admin */}
                  {dropdownOpen && isSuperAdmin && (
                    <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Pilih Lembaga Aktif (Yayasan)
                      </div>
                      {institutions.map((inst) => {
                        const isCurrent = inst.id === activeInstitution.id;
                        return (
                          <button
                            key={inst.id}
                            onClick={() => {
                              onSwitchInstitution(inst);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-teal-50 transition cursor-pointer ${
                              isCurrent ? "bg-teal-50/70 text-teal-800 font-semibold" : "text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                              <div className="truncate">
                                <p className="truncate font-medium">{inst.name}</p>
                                <p className="text-xs text-slate-400 font-mono">
                                  Token: {inst.token_lembaga}
                                </p>
                              </div>
                            </div>
                            {isCurrent && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sisi Kanan: Status Cloud (SuperAdmin), Profil Pengguna & Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Status Koneksi Firebase vs Local — HANYA TAMPIL DI SUPER ADMIN */}
              {isSuperAdmin && (
                <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                  {isFirebaseConfigured ? (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">Firebase Spark Cloud</span>
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-600">Mode Lokal (Spark Ready)</span>
                    </>
                  )}
                </div>
              )}

              {/* User Avatar & Name — KLIK UNTUK MENU PROFIL & GANTI PIN */}
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-2 pl-2 sm:pl-3 sm:border-l border-slate-200 hover:bg-slate-50 p-1.5 rounded-2xl transition cursor-pointer text-left group"
                title="Buka Pengaturan Profil & PIN"
              >
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-teal-500/30 group-hover:ring-teal-500 transition"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-sm group-hover:bg-teal-100 transition">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px] group-hover:text-teal-700 transition">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    {user.role === "SUPER_ADMIN" ? (
                      <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" /> Super Admin
                      </span>
                    ) : user.role === "HEADMASTER" ? (
                      <span className="text-purple-700 font-semibold flex items-center gap-0.5">
                        <Award className="w-2.5 h-2.5" /> Kepala Sekolah
                      </span>
                    ) : user.role === "ADMIN" ? (
                      <span className="text-blue-600 font-semibold">Admin Kurikulum</span>
                    ) : (
                      <span>Guru Pengampu</span>
                    )}
                  </p>
                </div>
                <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition hidden sm:block ml-0.5" />
              </button>

              {/* Logout CTA */}
              <button
                onClick={() => {
                  if (window.confirm("Keluar dari akun? Anda perlu memasukkan PIN lagi untuk masuk.")) {
                    onLogout();
                  }
                }}
                className="p-2.5 sm:px-3 sm:py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="Keluar dari akun"
              >
                <LogOut className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal Profil & Ganti PIN */}
      {profileModalOpen && (
        <ProfileModal
          user={user}
          activeInstitution={activeInstitution}
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onUserUpdated={(updatedUser) => {
            if (onUserUpdated) onUserUpdated(updatedUser);
          }}
        />
      )}
    </>
  );
};
