"use client";

import React, { useState, useEffect } from "react";
import { User, Institution } from "@/lib/types";
import {
  getInstitutions,
  getSavedSession,
  getSavedToken,
  clearSession,
} from "@/lib/storage";
import { Navbar } from "@/components/Navbar";
import { LoginView } from "@/components/LoginView";
import { TeacherDashboard } from "@/components/TeacherDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ProfileModal } from "@/components/ProfileModal";
import { hasDefaultPinWarning, setDefaultPinWarning } from "@/lib/authUtils";
import { GraduationCap, ArrowLeftRight, ShieldAlert, X } from "lucide-react";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeInstitution, setActiveInstitution] = useState<Institution | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [initialToken, setInitialToken] = useState("");
  const [loading, setLoading] = useState(true);

  // Admin view toggle (Admin can switch to Teacher preview)
  const [adminViewMode, setAdminViewMode] = useState<"admin" | "teacher">("admin");
  const [showPinWarning, setShowPinWarning] = useState(false);
  const [showQuickProfileModal, setShowQuickProfileModal] = useState(false);

  // Load session on startup
  useEffect(() => {
    async function init() {
      try {
        const instList = await getInstitutions();
        setInstitutions(instList);

        const savedToken = getSavedToken();
        if (savedToken) {
          setInitialToken(savedToken);
        }

        const session = getSavedSession();
        if (session && session.user && session.institution) {
          setCurrentUser(session.user);
          setActiveInstitution(session.institution);
          setShowPinWarning(hasDefaultPinWarning());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Handle Login
  const handleLoginSuccess = (user: User, institution: Institution) => {
    setCurrentUser(user);
    setActiveInstitution(institution);
    setAdminViewMode("admin");
    setShowPinWarning(hasDefaultPinWarning());
  };

  // Handle Logout
  const handleLogout = () => {
    clearSession();
    setDefaultPinWarning(false);
    setShowPinWarning(false);
    setCurrentUser(null);
  };

  // Handle Switch Institution (for Super Admin)
  const handleSwitchInstitution = (inst: Institution) => {
    setActiveInstitution(inst);
  };

  const handleRefreshInstitutions = async () => {
    const list = await getInstitutions();
    setInstitutions(list);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setShowPinWarning(hasDefaultPinWarning());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto animate-bounce shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-600">Memuat My School ID...</p>
        </div>
      </div>
    );
  }

  // Jika belum login, tampilkan layar masuk
  if (!currentUser || !activeInstitution) {
    return (
      <LoginView
        initialToken={initialToken}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const isManagement =
    currentUser.role === "ADMIN" ||
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.role === "HEADMASTER";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        activeInstitution={activeInstitution}
        institutions={institutions}
        onSwitchInstitution={handleSwitchInstitution}
        onLogout={handleLogout}
        onUserUpdated={handleUserUpdated}
      />

      {/* Management Compact Bar to Preview Teacher View */}
      {isManagement && (
        <div className={`border-b px-4 py-1.5 text-xs ${
          currentUser.role === "HEADMASTER"
            ? "bg-purple-50 border-purple-200"
            : "bg-amber-50 border-amber-200"
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <span className={`font-medium truncate ${
              currentUser.role === "HEADMASTER" ? "text-purple-900" : "text-amber-900"
            }`}>
              Mode:{" "}
              <strong>
                {currentUser.role === "SUPER_ADMIN"
                  ? "Super Admin"
                  : currentUser.role === "HEADMASTER"
                  ? "Kepala Sekolah (Supervisi)"
                  : "Admin Kurikulum"}
              </strong>
            </span>
            <button
              onClick={() => setAdminViewMode(adminViewMode === "admin" ? "teacher" : "admin")}
              className={`px-2.5 py-1 rounded-lg text-white font-bold transition flex items-center gap-1.5 cursor-pointer text-xs shrink-0 ${
                currentUser.role === "HEADMASTER"
                  ? "bg-purple-700 hover:bg-purple-800"
                  : "bg-amber-700 hover:bg-amber-800"
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>
                {adminViewMode === "admin"
                  ? "Pratinjau Guru"
                  : currentUser.role === "HEADMASTER"
                  ? "Kembali ke Supervisi"
                  : "Kembali ke Admin"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Peringatan Keamanan: Masih Memakai PIN / Password Bawaan */}
      {showPinWarning && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-rose-900 font-medium">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                {currentUser.role === "SUPER_ADMIN"
                  ? "Anda masih menggunakan password bawaan Super Admin. Demi keamanan, segera ganti password Anda."
                  : "Anda masih menggunakan PIN bawaan (123456). Demi keamanan akun, segera ganti dengan PIN pribadi Anda."}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQuickProfileModal(true)}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition cursor-pointer"
              >
                {currentUser.role === "SUPER_ADMIN" ? "Ganti Password" : "Ganti PIN"}
              </button>
              <button
                type="button"
                onClick={() => setShowPinWarning(false)}
                className="p-1 rounded-lg text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                aria-label="Tutup peringatan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main className="flex-1 pb-12">
        {isManagement && adminViewMode === "admin" ? (
          <AdminDashboard
            user={currentUser}
            activeInstitution={activeInstitution}
            institutions={institutions}
            onRefreshInstitutions={handleRefreshInstitutions}
            onSwitchInstitution={handleSwitchInstitution}
          />
        ) : (
          <TeacherDashboard
            user={currentUser}
            activeInstitution={activeInstitution}
            onUserUpdated={handleUserUpdated}
          />
        )}
      </main>

      <ProfileModal
        user={currentUser}
        activeInstitution={activeInstitution}
        isOpen={showQuickProfileModal}
        onClose={() => setShowQuickProfileModal(false)}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}
