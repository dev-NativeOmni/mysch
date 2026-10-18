"use client";

import React, { useState } from "react";
import { Institution, User } from "@/lib/types";
import { isFirebaseConfigured } from "@/lib/firebase";
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
  Sparkles,
} from "lucide-react";

interface NavbarProps {
  user: User;
  activeInstitution: Institution;
  institutions: Institution[];
  onSwitchInstitution: (inst: Institution) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeInstitution,
  institutions,
  onSwitchInstitution,
  onLogout,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Sisi Kiri: Brand & Logo Sekolah */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  MySch
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
                  <Sparkles className="w-3 h-3" /> Mobile First
                </span>
              </div>

              {/* Selector / Label Lembaga Aktif */}
              <div className="relative">
                {isSuperAdmin ? (
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 transition"
                  >
                    <span className="truncate max-w-[160px] sm:max-w-[220px]">
                      {activeInstitution.name}
                    </span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.2 rounded font-mono">
                      {activeInstitution.token_lembaga}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <span className="truncate max-w-[170px] sm:max-w-none">
                      {activeInstitution.name}
                    </span>
                    <span className="bg-teal-50 text-teal-700 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                      {activeInstitution.token_lembaga}
                    </span>
                  </div>
                )}

                {/* Dropdown Multi-Lembaga untuk Super Admin */}
                {dropdownOpen && isSuperAdmin && (
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                          className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-teal-50 transition ${
                            isCurrent ? "bg-teal-50/70 text-teal-800 font-semibold" : "text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                            <div className="truncate">
                              <p className="truncate font-medium">{inst.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">
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

          {/* Sisi Kanan: Status Cloud, Profil Pengguna & Logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Status Koneksi Firebase vs Local */}
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

            {/* User Avatar & Name */}
            <div className="flex items-center gap-2 pl-2 sm:border-l border-slate-200">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  {user.role === "SUPER_ADMIN" ? (
                    <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                      <Shield className="w-3 h-3" /> Super Admin
                    </span>
                  ) : user.role === "ADMIN" ? (
                    <span className="text-blue-600 font-semibold">Admin Kurikulum</span>
                  ) : (
                    <span>Guru Pengampu</span>
                  )}
                </p>
              </div>
            </div>

            {/* Logout CTA */}
            <button
              onClick={onLogout}
              className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5"
              title="Keluar dari akun"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
