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
import { GraduationCap, ArrowLeftRight } from "lucide-react";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeInstitution, setActiveInstitution] = useState<Institution | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [initialToken, setInitialToken] = useState("");
  const [loading, setLoading] = useState(true);

  // Admin view toggle (Admin can switch to Teacher preview)
  const [adminViewMode, setAdminViewMode] = useState<"admin" | "teacher">("admin");

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
  };

  // Handle Logout
  const handleLogout = () => {
    clearSession();
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

      {/* Management Floating Switcher to Preview Teacher View */}
      {isManagement && (
        <div className={`border-b px-4 py-2 text-xs flex items-center justify-between ${
          currentUser.role === "HEADMASTER"
            ? "bg-purple-100 border-purple-200"
            : "bg-amber-100 border-amber-200"
        }`}>
          <span className={`font-semibold ${
            currentUser.role === "HEADMASTER" ? "text-purple-950" : "text-amber-900"
          }`}>
            Anda login sebagai{" "}
            <strong>
              {currentUser.role === "SUPER_ADMIN"
                ? "Super Admin"
                : currentUser.role === "HEADMASTER"
                ? "Kepala Sekolah (Mode Supervisi)"
                : "Admin Kurikulum"}
            </strong>{" "}
            ({currentUser.name})
          </span>
          <button
            onClick={() => setAdminViewMode(adminViewMode === "admin" ? "teacher" : "admin")}
            className={`px-3 py-1 rounded-lg text-white font-bold transition flex items-center gap-1.5 cursor-pointer text-[11px] ${
              currentUser.role === "HEADMASTER"
                ? "bg-purple-800 hover:bg-purple-900"
                : "bg-amber-800 hover:bg-amber-900"
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>
              {adminViewMode === "admin"
                ? "Coba Tampilan Guru"
                : currentUser.role === "HEADMASTER"
                ? "Kembali ke Panel Supervisi"
                : "Kembali ke Panel Admin"}
            </span>
          </button>
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
    </div>
  );
}
