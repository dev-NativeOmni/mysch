# Design Specification & UI/UX Guidelines
## Web App Jurnal Harian Guru & Presensi Terpadu ("MySch")

---

### 1. Filosofi Desain & Prinsip UI/UX untuk Pengguna Awam

Banyak aplikasi manajemen sekolah gagal diadopsi secara maksimal karena terlalu rumit, memiliki terlalu banyak kolom isian kecil, dan menggunakan istilah teknis yang membingungkan bagi guru-guru senior. 

Oleh karena itu, **MySch** dibangun dengan 5 prinsip desain utama:

1. **"The 3-Tap Rule" (Selesai dalam Kurang dari 2 Menit)**
   * Alur pengisian jurnal harian dari awal membuka aplikasi hingga tersimpan tidak boleh melebihi 3-5 ketukan layar utama.
   * Tidak ada form panjang tanpa akhir; form dibagi menjadi 3 langkah bertahap (*step-by-step wizard*) yang terasa ringan.
2. **"Default to Success" (Presensi Cerdas Otomatis)**
   * Saat membuka form presensi, sistem secara otomatis menandai seluruh siswa sebagai **"Hadir" (100%)**.
   * Guru tidak perlu memanggil dan mengklik 32 siswa satu per satu. Guru cukup mencari dan mengetuk 1 atau 2 siswa yang tidak hadir (Sakit, Izin, atau Alpa).
3. **"Zero Blank State Fear" (Isian Terpilih Otomatis Berbasis Waktu)**
   * Berdasarkan jam dan hari perangkat guru, sistem secara cerdas langsung mengarahkan guru ke kelas yang sedang ia ajar. Guru tidak perlu memilih manual tahun ajaran, semester, hari, atau jam ke berapa.
4. **"Thumb-Zone Ergonomics & Big Touch Targets" (Ramah Layar Sentuh HP)**
   * Semua tombol aksi utama ditempatkan pada area yang mudah dijangkau jempol satu tangan (*natural thumb zone* di 1/3 bagian bawah layar HP).
   * Ukuran minimum target sentuh (*touch target*) adalah **48 x 48 piksel** dengan spasi longgar agar tidak terjadi salah tekan (*fat-finger proof*).
5. **"Human-Centric Microcopy" (Bebas Jargon Teknis)**
   * Menghindari kata teknis seperti *"Submit Query"*, *"Synchronize Payload"*, *"Entity ID"*.
   * Menggunakan bahasa Indonesia yang santun, akrab, dan jelas: *"Mulai Mengajar"*, *"Simpan Jurnal Hari Ini"*, *"Semua Siswa Hadir"*, *"Belum Diisi"*.
6. **"Frictionless Institution Identification" (Token Lembaga Cerdas & Tanpa Beban)**
   * Pengguna tidak boleh dipusingkan menghafal kode rumit. Token Lembaga divalidasi seketika (*real-time preview*) dengan badge nama & logo sekolah terverifikasi.
   * Sekali diinput pada perangkat guru, token disimpan selamanya di memori HP (*auto-remember*).
   * Disediakan *Magic Link* via WhatsApp (`jurnalguru.id/masuk?token=SMPHARAPAN`) dan poster *QR Code* di ruang guru agar guru cukup 1 kali klik/scan tanpa mengetik manual.

---

### 2. Design DNA & Sistem Token Visual

#### 2.1. Palet Warna Semantik (Color Tokens)
Menggunakan palet warna berbasis psikologi ketenangan, fokus, dan standar kementerian pendidikan (Emerald & Slate) yang tidak melelahkan mata saat digunakan di kelas:

| Token Warna | Nilai HSL / HEX | Peran & Penggunaan |
| :--- | :--- | :--- |
| **`brand-primary`** | `#0D9488` (Teal 600) | Warna utama: Tombol aksi utama, header aktif, identitas visual sekolah. |
| **`brand-primary-light`** | `#CCFBF1` (Teal 100) | Latar belakang aksen, highlight jadwal aktif saat ini. |
| **`surface-background`** | `#F8FAFC` (Slate 50) | Warna latar belakang aplikasi (nyaman di mata, tidak putih menyilaukan). |
| **`surface-card`** | `#FFFFFF` (Pure White) | Kartu bento, form isian, container kartu jadwal. |
| **`text-primary`** | `#0F172A` (Slate 900) | Teks utama, judul kelas, nama siswa (kontras tinggi WCAG AAA). |
| **`text-secondary`** | `#475569` (Slate 600) | Keterangan jam, mata pelajaran, instruksi bantuan. |
| **`border-subtle`** | `#E2E8F0` (Slate 200) | Garis tepi kartu dan pemisah daftar yang rapi. |

#### 2.2. Warna Status Presensi & Jadwal (High Accessibility)
Warna status presensi dirancang sangat kontras dengan label teks yang selalu mendampingi ikon (ramah bagi pengguna buta warna):

* 🟢 **Hadir (H)**: `#16A34A` (Green 600) | Background: `#DCFCE7` (Green 100)
* 🟡 **Sakit (S)**: `#D97706` (Amber 600) | Background: `#FEF3C7` (Amber 100)
* 🔵 **Izin (I)**: `#2563EB` (Blue 600) | Background: `#DBEAFE` (Blue 100)
* 🔴 **Alpa (A)**: `#DC2626` (Red 600) | Background: `#FEE2E2` (Red 100)
* 🟣 **Dispensasi (D)**: `#9333EA` (Purple 600) | Background: `#F3E8FF` (Purple 100)

#### 2.3. Tipografi & Hirarki Teks
Menggunakan font sans-serif modern yang mudah dibaca pada layar resolusi rendah: **Plus Jakarta Sans** atau **Inter**.

* **Page Title / Greeting**: `font-bold text-2xl (24px)` – contoh: *"Selamat Pagi, Bu Rina"*
* **Section Heading**: `font-semibold text-lg (18px)` – contoh: *"Jadwal Mengajar Hari Ini"*
* **Card Title / Class Name**: `font-bold text-xl (20px)` – contoh: *"Kelas VIII-B"*
* **Body Text**: `font-medium text-base (16px)` – Keterangan siswa & petunjuk form
* **Micro-badges**: `font-bold text-xs (12px) tracking-wide uppercase` – contoh: *"SEDANG BERLANGSUNG"*

#### 2.4. Radius & Sistem Elevasi
* **Border Radius**:
  * Kartu Utama: `rounded-2xl (16px)`
  * Tombol Aksi: `rounded-xl (12px)`
  * Chip Status: `rounded-full (9999px)`
* **Bayangan (Elevation)**:
  * Kartu Standar: `shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]` (Sangat lembut dan bersih)
  * Kartu Jadwal Aktif / Floating Button: `shadow-[0_8px_20px_-4px_rgba(13,148,136,0.25)]`

---

### 3. Arsitektur Tata Letak Responsif (Mobile-First)

Aplikasi dirancang mulai dari layar smartphone, kemudian melebar secara bertahap ke tablet dan laptop:

```
[Mobile Phone <640px]        [Tablet 640px-1024px]             [Desktop >1024px]
┌───────────────────────┐   ┌───────────────────────────────┐   ┌──────────────────────────────────────────────┐
│ Header Ringkas        │   │ Header + Tab Navigasi         │   │ Sidebar Kiri  │ Topbar + Breadcrumb          │
│ ┌───────────────────┐ │   │ ┌──────────────┬────────────┐ │   │ - Beranda     │ ┌──────────────────────────┐ │
│ │ Kartu Aktif Hero  │ │   │ │ Kartu Jadwal │ Detail     │ │   │ - Jadwal Guru │ │ Matriks Jadwal Mingguan  │ │
│ └───────────────────┘ │   │ │ & Presensi   │ Materi &   │ │   │ - Data Master │ │ (Grid Interaktif 10 Jam) │ │
│ ┌───────────────────┐ │   │ │              │ Catatan    │ │   │ - Rekapitulasi│ │                          │ │
│ │ Timeline Jadwal   │ │   │ └──────────────┴────────────┘ │   │ - Pengaturan  │ └──────────────────────────┘ │
│ └───────────────────┘ │   │                               │   │               │ Data Tables & Quick Filters  │
│ [Sticky Bottom Nav]   │   │                               │   │               │                              │
└───────────────────────┘   └───────────────────────────────┘   └───────────────┴──────────────────────────────┘
```

#### Rincian Perangkat & Breakpoint:
1. **Mobile (< 640px) — Fokus Penggunaan Guru di Kelas**:
   * *Bottom Navigation Bar* permanen dengan 3 menu utama: **Jadwal Hari Ini**, **Riwayat Jurnal**, **Profil Guru**.
   * Kartu jadwal aktif berukuran besar dengan tombol CTA mencolok *"Mulai Mengisi Jurnal"*.
   * Form pengisian berbentuk *Swipeable Step Tabs* atau *Accordion* agar tidak perlu *scrolling* panjang.
2. **Tablet (640px - 1024px) — Ruang Guru & Guru Piket**:
   * Layout 2 Kolom Bento: Sisi kiri menampilkan daftar siswa & presensi cepat, sisi kanan memuat form isian materi pembelajaran dan catatan.
3. **Desktop (> 1024px) — Panel Kerja Admin Kurikulum & Kepala Sekolah**:
   * *Collapsible Sidebar* di sisi kiri untuk navigasi antar modul master data.
   * Modul Penjadwalan ditampilkan dalam bentuk **Weekly Matrix Grid** interaktif (Hari Senin-Sabtu vs Jam Pelajaran 1-10) dengan fitur deteksi bentrok visual.

---

### 4. Wireframe & Spesifikasi Layar Utama

#### 4.0. Layar Masuk / Login dengan Token Lembaga (Mobile View - 375px)

```
┌─────────────────────────────────────────┐
│              📖 JurnalGuru              │
│       Aplikasi Agenda Mengajar Guru     │
├─────────────────────────────────────────┤
│                                         │
│  Selamat Datang Bapak/Ibu Guru 👋       │
│  Silakan masuk untuk mengisi jurnal.    │
│                                         │
│ 🏫 1. TOKEN LEMBAGA / KODE SEKOLAH      │
│ ┌─────────────────────────────────────┐ │
│ │ SMPHARAPAN                          │ │
│ └─────────────────────────────────────┘ │
│   ↳ 🟢 Terverifikasi: SMP Harapan 1 ✓   │
│                                         │
│ 👤 2. NIP / NOMOR WHATSAPP              │
│ ┌─────────────────────────────────────┐ │
│ │ 198504122010012003 / 081234567890   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 🔒 3. PIN MASUK (6 DIGIT)               │
│ ┌─────────────────────────────────────┐ │
│ │ • • • • • •                       👁️ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [✓] Ingat Lembaga & Akun Saya di HP Ini │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🚀  MASUK KE JURNAL                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ───────────────── ATAU ──────────────── │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📷  Scan QR Code Masuk Sekolah      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 💡 Butuh Bantuan?                       │
│ • Belum tahu Token? Hubungi Wakasek     │
│   Kurikulum atau Admin Lembaga Anda.    │
│ • [Ganti Token Lembaga]                 │
└─────────────────────────────────────────┘
```

#### Karakteristik Layar Masuk:
* **Validasi Token Instan**: Saat guru mengetik `SMPHARAPAN`, sistem langsung memeriksa ke server dan memunculkan badge hijau `🟢 Terverifikasi: SMP Harapan 1 ✓` beserta logo resmi sekolah. Ini memberi kepastian langsung bagi guru awam bahwa ia tidak salah masuk sekolah.
* **Fitur Auto-Remember**: Pilihan *"Ingat Lembaga & Akun Saya"* mencatat token di *LocalStorage*. Saat guru membuka web app di hari berikutnya, field Token Lembaga dan identitas sekolah sudah terpilih secara permanen dan guru hanya perlu memasukkan PIN.
* **Scan QR Code Alternatif**: Bagi guru senior yang kesulitan mengetik kode di keyboard HP, sekolah menyediakan poster QR Code di ruang guru. Cukup klik tombol *"Scan QR Code Masuk Sekolah"* atau scan langsung via kamera HP.

---

#### 4.1. Layar Guru: Beranda Hari Ini (Mobile View - 375px)

```
┌─────────────────────────────────────────┐
│ 🏫 SMP Negeri 1 Harapan      [Foto Bu Rina]│
│ Selamat Pagi, Bu Rina 👋                │
│ Kamis, 22 Oktober 2026                  │
├─────────────────────────────────────────┤
│                                         │
│  ✨ JADWAL MENGAJAR SAAT INI            │
│ ┌─────────────────────────────────────┐ │
│ │ 🟢 SEDANG BERLANGSUNG               │ │
│ │                                     │ │
│ │ Kelas VIII-A                        │ │
│ │ 📚 IPA (Ilmu Pengetahuan Alam)      │ │
│ │ ⏰ Jam Ke 3 - 4 (08:45 - 10:15 WIB) │ │
│ │ 📍 Ruang Kelas 8A                   │ │
│ │                                     │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ ✍️  MULAI ISI JURNAL SEKARANG   │ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│  📅 JADWAL LAINNYA HARI INI (3 KELAS)   │
│ ┌─────────────────────────────────────┐ │
│ │ ✅ 07:15 - 08:45 | Kelas VII-C      │ │
│ │    IPA • Selesai Diisi (100% Hadir) │ │
│ ├─────────────────────────────────────┤ │
│ │ ⏳ 10:30 - 12:00 | Kelas VIII-D     │ │
│ │    IPA • Belum Waktunya             │ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ [ 🏠 Beranda ]  [ 📖 Riwayat ]  [ 👤 Akun ] │
└─────────────────────────────────────────┘
```

#### Karakteristik Layar Beranda:
* **Kartu Hero "Jadwal Mengajar Saat Ini"**: Muncul otomatis dengan warna aksen *Teal* jika jam saat ini cocok dengan jadwal. Guru hanya perlu 1 klik pada tombol hijau besar untuk langsung mengisi jurnal.
* **Timeline Cepat**: Menampilkan status kelas sebelumnya (apakah sudah diisi atau belum) dengan indikator centang hijau yang menenangkan pikiran guru.

---

#### 4.2. Layar Guru: Wizard Pengisian Jurnal (3 Langkah Ringan)

Layar ini menggunakan tab navigasi horizontal sederhana di bagian atas dengan tombol konfirmasi sticky di bagian bawah.

##### Tab 1: Presensi Siswa (Kehadiran Cepat)
```
┌─────────────────────────────────────────┐
│ ← Batal         Jurnal VIII-A      Bantuan │
├─────────────────────────────────────────┤
│   [ 1. Presensi ]   2. Materi   3. Catatan │
├─────────────────────────────────────────┤
│ 👥 Total Siswa: 32                      │
│ 🟢 Hadir: 30  🟡 Sakit: 1  🔴 Alpa: 1   │
│                                         │
│ [ ⚡ Tandai Semua Hadir ]   [ 🔍 Cari... ]│
│                                         │
│ 1. Ahmad Fauzi                          │
│    (● Hadir) (  Sakit) (  Izin) (  Alpa) │
│                                         │
│ 2. Annisa Rahmawati                     │
│    (● Hadir) (  Sakit) (  Izin) (  Alpa) │
│                                         │
│ 3. Bagas Pratama                        │
│    (  Hadir) (● Sakit) (  Izin) (  Alpa) │
│    ↳ [ Surat Dokter 📎 ]                │
│                                         │
│ 4. Cantika Putri                        │
│    (● Hadir) (  Sakit) (  Izin) (  Alpa) │
│ ...                                     │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Lanjut ke Materi Pembelajaran →     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

##### Tab 2: Materi & Capaian Pembelajaran
```
┌─────────────────────────────────────────┐
│ ← Kembali       Jurnal VIII-A             │
├─────────────────────────────────────────┤
│   1. Presensi   [ 2. Materi ]   3. Catatan │
├─────────────────────────────────────────┤
│                                         │
│ 🏷️ Bab / Capaian Pembelajaran:           │
│ ┌─────────────────────────────────────┐ │
│ │ Bab 3: Sistem Peredaran Darah Manusia ▼││
│ └─────────────────────────────────────┘ │
│                                         │
│ 🎯 Metode & Aktivitas Pembelajaran:     │
│ (Pilih satu atau lebih):                │
│ [✓ Diskusi Kelompok]  [✓ Praktikum]    │
│ [  Ceramah Interaktif] [  Presentasi]  │
│ [  Latihan Soal / Kuis] [  Tugas Proyek]│
│                                         │
│ 📝 Uraian Singkat Pembelajaran:         │
│ ┌─────────────────────────────────────┐ │
│ │ Siswa mengamati preparat sel darah  │ │
│ │ di laboratorium, mencatat perbedaan  │ │
│ │ eritrosit dan leukosit.             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 📊 Ketercapaian Target Pembelajaran:    │
│ [● Tuntas 100%] [○ 75% Sebagian] [○ Belum]│
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Lanjut ke Catatan & Foto →           │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

##### Tab 3: Catatan Harian & Dokumentasi
```
┌─────────────────────────────────────────┐
│ ← Kembali       Jurnal VIII-A             │
├─────────────────────────────────────────┤
│   1. Presensi   2. Materi   [ 3. Catatan ]│
├─────────────────────────────────────────┤
│                                         │
│ 💬 Catatan Kelas & Siswa (Opsional):    │
│ ┌─────────────────────────────────────┐ │
│ │ Contoh: Bagas tidak masuk karena    │ │
│ │ sakit DB. Kelas berlangsung tertib  │ │
│ │ dan antusias selama praktikum.      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 📷 Foto Dokumentasi Pembelajaran:       │
│ ┌─────────────────────────────────────┐ │
│ │           📷 Ambil Foto             │ │
│ │       atau Pilih dari Galeri        │ │
│ │   (Otomatis kompresi < 300 KB)      │ │
│ └─────────────────────────────────────┘ │
│ [ Preview Foto Kelas_01.jpg  ✕ Hapus ]  │
│                                         │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ ✅ SIMPAN JURNAL HARI INI           │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

#### 4.3. Layar Admin: Manajemen Jadwal Interaktif (Desktop View)

Untuk mengelola puluhan guru dan ratusan jam mengajar tanpa ribet, Admin disajikan tampilan visual **Weekly Timetable Matrix**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🏫 Panel Kurikulum - Penjadwalan Guru                        [ Tahun Ajaran 2026/2027 ▼]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Filter: [ Pilih Rombel: VIII-A ▼ ]  [ Filter Guru: Semua ▼ ]   [ ➕ Tambah Slot Jadwal ] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ JAM KE-  │ SENIN          │ SELASA         │ RABU           │ KAMIS          │ JUMAT   │
├──────────┼────────────────┼────────────────┼────────────────┼────────────────┼─────────┤
│ Jam 1-2  │ 🟢 Upacara &   │ 📐 Matematika  │ 🇮🇩 B. Indonesia│ 🔬 IPA         │ 🕌 PAI   │
│ 07:00-   │    Wali Kelas  │    Pak Joko    │    Bu Ratna    │    Bu Rina     │  Ust. Ali│
│ 08:30    │                │                │                │                │         │
├──────────┼────────────────┼────────────────┼────────────────┼────────────────┼─────────┤
│ Jam 3-4  │ 🇬🇧 B. Inggris  │ 📐 Matematika  │ 🎨 Seni Budaya │ 🔬 IPA         │ 🏃 PJOK │
│ 08:45-   │    Miss Sarah  │    Pak Joko    │    Pak Hendra  │    Bu Rina     │  Pak Doni│
│ 10:15    │                │                │                │                │         │
├──────────┼────────────────┼────────────────┼────────────────┼────────────────┼─────────┤
│ ISTIRAHAT│ ☕ (30 Menit)  │ ☕ (30 Menit)  │ ☕ (30 Menit)  │ ☕ (30 Menit)  │ ☕ (15m)│
├──────────┼────────────────┼────────────────┼────────────────┼────────────────┼─────────┤
│ Jam 5-6  │ 🌍 IPS         │ 💻 Informatika │ 🇮🇩 B. Indonesia│ 📚 BK          │         │
│ 10:45-   │    Bu Maya     │    Pak Reza    │    Bu Ratna    │    Bu Siti     │  PULANG │
│ 12:15    │                │                │                │                │         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

##### Fitur Pencegahan Kesalahan Jadwal (Anti-Conflict Engine):
* Jika Admin mencoba menjadwalkan `Pak Joko (Matematika)` di Kelas VIII-A pada Jam 1-2 hari Selasa, padahal Pak Joko sudah terjadwal di Kelas IX-C:
  * Sistem langsung menampilkan kartu berkedip merah: **⚠️ BENTROK JADWAL: Pak Joko sudah terjadwal di Kelas IX-C pada jam ini!**
  * Tombol simpan dinonaktifkan sampai bentrok diselesaikan, mencegah kesalahan fatal jadwal sekolah.

---

#### 4.4. Layar Admin: Monitoring Pengisian Jurnal Real-Time

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 📊 Supervisi Jurnal Harian: Kamis, 22 Oktober 2026                 [ ⬇️ Ekspor Rekap ▼] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Ringkasan Hari Ini:                                                                    │
│ [ Total Sesi: 48 ]   [ 🟢 Sudah Diisi: 38 (79%) ]   [ 🟡 Berlangsung: 4 ]   [ 🔴 Belum: 6 ]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ DAFTAR GURU & KELAS             JAM       MAPEL        STATUS        AKSI              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Bu Rina, S.Pd (VIII-A)     08:45-10:15  IPA         🟢 Lengkap    [ 👁️ Lihat Detail ]│
│ 2. Pak Joko, M.Pd (IX-C)      07:00-08:30  Matematika  🟢 Lengkap    [ 👁️ Lihat Detail ]│
│ 3. Bu Maya, S.Sos (VII-B)     08:45-10:15  IPS         🟡 Sedang KBM [ 🔔 Kirim Nudge ]│
│ 4. Pak Reza, S.Kom (VIII-D)   07:00-08:30  Informatika 🔴 Belum Isi  [ 📲 Colek via WA ]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

#### 4.5. Layar Admin: Pengalih Lembaga & Manajemen Multi-Sekolah (Desktop View)

Untuk Admin yang mengelola lebih dari 1 lembaga (misalnya Super Admin Yayasan atau Pengawas Sekolah):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🏫 JurnalGuru Admin    [ 🏢 Yayasan Harapan Bangsa ▼ ]          [ 👤 Bu Hj. Farida ▼ ] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 📍 LEMBAGA AKTIF SAAT INI:                                                             │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │  🏫 SMP Harapan 1 (Token: SMPHARAPAN)                        [ 🔄 Beralih Lembaga ] │ │
│ │  Alamat: Jl. Melati No. 12 • Jenjang: SMP • 24 Rombel • 42 Guru                    │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                        │
│ 🏢 DAFTAR LEMBAGA TERDAFTAR (3 LEMBAGA)                       [ ➕ Tambah Lembaga Baru ] │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ NAMA LEMBAGA        JENJANG   TOKEN LEMBAGA     GURU    STATUS    AKSI             │ │
│ ├────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ 1. SMP Harapan 1     SMP      `SMPHARAPAN`      42      🟢 Aktif  [ Masuk Panel ]  │ │
│ │    ↳ Link Cepat: jurnalguru.id/masuk?token=SMPHARAPAN  [📋 Salin] [📲 Share WA]    │ │
│ │                                                                                    │ │
│ │ 2. SMA Harapan 1     SMA      `SMAHARAPAN`      38      🟢 Aktif  [ Masuk Panel ]  │ │
│ │    ↳ Link Cepat: jurnalguru.id/masuk?token=SMAHARAPAN  [📋 Salin] [📲 Share WA]    │ │
│ │                                                                                    │ │
│ │ 3. SMK Harapan       SMK      `SMKHARAPAN`      45      🟢 Aktif  [ Masuk Panel ]  │ │
│ │    ↳ Link Cepat: jurnalguru.id/masuk?token=SMKHARAPAN  [📋 Salin] [📲 Share WA]    │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

##### Interaksi Pengalihan Lembaga (*Instant Switching*):
* Admin cukup mengklik tombol **[ Masuk Panel ]** pada lembaga yang diinginkan, atau memilih lembaga dari *dropdown switcher* di bar navigasi atas.
* Seluruh tampilan dashboard, jadwal, nama guru, rombel kelas, dan rekapitulasi jurnal langsung terfilter secara instan sesuai lembaga yang dipilih tanpa perlu relogin.
* Admin dapat menyalin *Magic Link* atau mengunduh template *Poster QR Code* siap cetak untuk dipajang di ruang guru sekolah tersebut.

---

### 5. Komponen Interaktif Kunci (Component Specs)

#### 5.1. Quick Attendance Pill Selector
Komponen untuk menandai kehadiran siswa dengan jempol satu tangan tanpa membuka dropdown:

```
[ Ahmad Fauzi                  ]
┌─────────┬─────────┬─────────┬─────────┐
│ (H)ADIR │ (S)AKIT │ (I)ZIN  │ (A)LPA  │
│ [Green] │ [Amber] │ [Blue]  │  [Red]  │
└─────────┴─────────┴─────────┴─────────┘
```
* **Status Default**: Kotak `(H)ADIR` terarsir hijau aktif.
* **Interaksi**: Sekali klik pada `(S)AKIT`, warna aktif berpindah ke kuning amber dan kotak input surat izin otomatis muncul secara halus (*expandable drawer*).

#### 5.2. Method & Activity Tags (Multi-Select Chips)
Tombol oval yang dapat di-tap berulang kali untuk memilih metode belajar:
* Tampilan sebelum dipilih: Latar putih, border abu-abu `border-slate-300 text-slate-700`.
* Tampilan setelah dipilih: Latar `bg-teal-500 text-white shadow-sm`.

#### 5.3. Client-Side Image Compressor
Komponen penangkap foto ruang kelas:
* Mengambil foto beresolusi tinggi dari kamera HP (biasanya 5MB - 12MB).
* Menggunakan HTML5 Canvas API untuk me-resize gambar ke resolusi maksimal 1280x720 piksel dan mengompresnya ke format WebP/JPEG dengan kualitas 75%.
* Hasil akhir ukuran file: **150KB - 250KB**. Sangat ringan untuk diunggah bahkan saat sinyal di sekolah hanya 1-2 bar.

#### 5.4. Offline Draft Saver (Penyelamat Saat Sinyal Hilang)
* Saat guru sedang mengetik catatan di kelas dan koneksi internet sekolah terputus, muncul indikator kecil di sudut atas:
  * `🟠 Tersimpan di memori HP (Mode Offline)`
* Begitu HP guru kembali mendapatkan sinyal WiFi di ruang guru, data otomatis tersinkronisasi ke server dengan indikator hijau:
  * `🟢 Berhasil disinkronkan ke server`

#### 5.5. Smart Token Input & Live School Card (Lembaga Terverifikasi)
Komponen input pada layar login yang ramah guru awam:
* **Real-time Debounced Lookup**: Begitu pengguna selesai mengetik Token Lembaga (misal `SMPHARAPAN`), aplikasi memicu pengecekan ringan (debounced 300ms).
* **Indikator Sukses Visual**:
  * Menampilkan kartu mini berlatar hijau lembut (`bg-emerald-50 border-emerald-200`).
  * Menampilkan logo resmi lembaga, nama lengkap sekolah, dan centang hijau tebal `✓ Terverifikasi`.
  * Mencegah rasa ragu atau cemas pada guru senior ("Apakah saya salah masuk web app?").
* **One-Click Switch Token**: Menyediakan teks tombol kecil `"Bukan guru di sekolah ini? Ganti Token"` yang membersihkan memori token dan membuka kembali kolom input token baru secara leluasa.

---

### 6. Aksesibilitas (A11y) & Panduan Inklusivitas

Untuk memastikan aplikasi nyaman digunakan oleh guru senior usia 50 tahun ke atas:

1. **Rasio Kontras Warna Minimum 4.5:1 (WCAG AA & AAA)**
   * Semua teks hitam/slate di atas latar belakang putih memiliki rasio kontras 12:1.
   * Tidak ada teks berwarna abu-abu muda di atas latar putih.
2. **Ukuran Target Sentuh (Touch Target Area)**
   * Minimal dimensi tombol aksi adalah **48px x 48px**.
   * Spasi antar tombol minimal 12px untuk menghindari salah klik.
3. **Dukungan Perubahan Ukuran Teks (Dynamic Font Rescaling)**
   * Antarmuka menggunakan satuan rem dan flexbox elastis. Jika guru menyetel ukuran huruf HP-nya ke *"Sangat Besar"* di menu pengaturan Android/iOS, layout aplikasi tidak akan terpotong atau saling tumpang tindih.
4. **Indikator Visual Ganda (Tidak Hanya Warna)**
   * Setiap status warna selalu disertai teks keterangan dan ikon (contoh: Centang untuk Hadir, Huruf 'S' untuk Sakit, Tanda Silang untuk Alpa).

---

### 7. Rekomendasi Arsitektur Teknologi & Implementasi Frontend

Untuk mewujudkan desain di atas dengan performa secepat kilat pada perangkat mobile:

* **Framework UI**: React / Next.js atau Vite + Tailwind CSS (menjamin ukuran bundle sangat kecil dan styling cepat).
* **Komponen & Ikon**: Lucide React (ikon garis tegas, ringan, dan jelas).
* **Kompresi Gambar**: `browser-image-compression` (kompresi sisi klien).
* **Penyimpanan Lokal**: IndexedDB via `idb-keyval` atau LocalStorage untuk auto-save draft.
* **Format Ekspor**: `jspdf` + `jspdf-autotable` untuk pembuatan PDF agenda mengajar resmi langsung dari browser tanpa membebani CPU server.

---
*Dokumen desain ini menjadi panduan visual dan interaksi bagi tahap implementasi kode antarmuka JurnalGuru.*
