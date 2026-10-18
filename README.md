# MySch — Web App Jurnal Harian Guru & Presensi Terpadu

Aplikasi web modern berbasis **Next.js**, **React**, dan **CSS 4 (Tailwind CSS v4)** dengan arsitektur **Mobile-First** dan dukungan **Multi-Lembaga (Multi-Tenancy)** menggunakan **Token Lembaga**.

Aplikasi ini dioptimalkan khusus untuk **Firebase Spark Plan (100% Free Tier)** dan siap di-deploy langsung ke **Firebase Hosting (`*.web.app`)**.

---

## 🌟 Fitur Utama

1. **Alur 3-Ketukan Cepat untuk Guru (*The 3-Tap Rule*)**:
   * **Deteksi Jadwal Otomatis**: Buka web app, sistem langsung mendeteksi kelas dan mata pelajaran yang sedang berlangsung saat itu.
   * **Default Hadir Semua**: Semua siswa otomatis berstatus **Hadir (H)**. Guru cukup mengetuk 1–2 siswa yang Sakit (S), Izin (I), atau Alpa (A).
   * **Preset Materi & Aktivitas**: Pilihan cepat metode ajar (Ceramah, Diskusi, Praktikum, dll.) tanpa repot mengetik panjang di HP.
   * **Kompresi Foto Otomatis**: Foto dokumentasi kelas dikompresi di sisi browser (< 300 KB) agar hemat kuota internet guru.
2. **Sistem Multi-Lembaga & Token Lembaga**:
   * Pengguna login dengan **Token Lembaga** (misal: `SMPHARAPAN`, `SMAHARAPAN`, `SMKHARAPAN`).
   * Validasi visual instan (kartu terverifikasi sekolah & logo).
   * Token tersimpan otomatis di perangkat (*Auto-Remember*) atau dapat diakses via poster QR Code di ruang guru.
3. **Panel Admin Kurikulum & Super Admin Yayasan**:
   * **Matriks Jadwal Mingguan Interaktif**: Penyusunan jadwal jam ke-1 s/d jam ke-10.
   * **Mesin Anti-Bentrok Jadwal**: Otomatis memperingatkan warna merah jika guru dijadwalkan di dua kelas pada jam yang sama.
   * **Monitoring & Supervisi Real-Time**: Status keterisian jurnal guru hari ini dengan tombol pengingat *"Colek via WhatsApp"*.
   * **Institution Switcher**: Berpindah antar sekolah binaan yayasan hanya dalam 1 klik dari bilah atas tanpa relogin.

---

## 🚀 Panduan Menjalankan di Komputer Lokal

### 1. Jalankan Server Development
```bash
npm run dev
```
Buka peramban di `http://localhost:3000`.

### 2. Akun Demo Cepat (1-Click Login)
Pada halaman login, tersedia tombol demo 1-klik untuk menguji semua peran:
* **Bu Rina, S.Pd (Guru IPA)**: Token `SMPHARAPAN` • PIN `123456`
* **Pak Joko, M.Pd (Guru Senior)**: Token `SMPHARAPAN` • PIN `123456`
* **Pak Budi, S.Kom (Admin Kurikulum)**: Token `SMPHARAPAN` • PIN `123456`
* **Ibu Hj. Farida, M.M (Super Admin Yayasan)**: Token `SMPHARAPAN` • PIN `123456`

*(Aplikasi secara default menggunakan mode penyimpanan lokal berdaya tahan tinggi jika kredensial Firebase belum dimasukkan, sehingga seluruh fitur CRUD jadwal, presensi, dan riwayat jurnal langsung dapat dicoba tanpa konfigurasi awal).*

---

## 🔥 Cara Menghubungkan ke Firebase (Spark Plan / Free Tier)

1. Buka [Firebase Console](https://console.firebase.google.com) dan buat proyek baru (misal: `jurnal-guru-sekolah`).
2. Masuk ke menu **Firestore Database** -> klik **Create database** -> pilih lokasi terdekat (misal: `asia-southeast2` Jakarta).
3. Di **Project Settings** -> tab **General** -> klik ikon Web (`</>`) untuk mendaftarkan Web App.
4. Salin file `.env.local.example` menjadi `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
5. Buka `.env.local` dan masukkan kunci API yang Anda dapatkan dari Firebase Console:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jurnal-guru-sekolah.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=jurnal-guru-sekolah
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jurnal-guru-sekolah.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
   NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
   ```

---

## 🌐 Cara Deploy ke Firebase Hosting (`*.web.app`)

Aplikasi ini dikonfigurasi dengan *Static HTML Export* Next.js, sehingga dapat di-host secara gratis 100% pada **Firebase Spark Plan** tanpa memerlukan Cloud Functions atau kartu kredit (Blaze):

```bash
# 1. Login ke Firebase CLI
npx firebase login

# 2. Tautkan dengan proyek Firebase Anda
npx firebase use --add

# 3. Build & Deploy otomatis dalam satu perintah
npm run deploy
```

Setelah proses selesai, aplikasi web Anda akan langsung aktif dan dapat dibuka oleh seluruh guru melalui URL:
`https://<project-id>.web.app`

---

## 📁 Struktur Berkas Proyek

```
mysch/
├── prd.md                    # Product Requirements Document resmi
├── design.md                 # UI/UX Specification & Mobile-First Wireframes
├── firebase.json             # Konfigurasi Firebase Hosting & Firestore
├── firestore.rules           # Aturan keamanan multi-tenant Firestore
├── next.config.ts            # Konfigurasi Next.js static export
├── package.json              # Skrip & dependensi proyek
└── src/
    ├── app/
    │   ├── globals.css       # Token warna & styling Tailwind CSS v4
    │   ├── layout.tsx        # Layout utama & viewport responsif mobile
    │   └── page.tsx          # Halaman utama orkestrasi Login, Guru & Admin
    ├── components/
    │   ├── Navbar.tsx        # Header & institution switcher
    │   ├── LoginView.tsx     # Layar masuk dengan Token Lembaga & QR Scan
    │   ├── TeacherDashboard.tsx # Beranda guru (Hero card & timeline hari ini)
    │   ├── JournalWizardModal.tsx # Form 3 langkah (Presensi, Materi, Catatan)
    │   ├── JournalHistoryModal.tsx # Riwayat jurnal mengajar terarsip
    │   ├── AdminDashboard.tsx # Matriks jadwal mingguan, data guru & monitoring
    │   └── QuickPill.tsx     # Chip presensi kilat (H, S, I, A)
    └── lib/
        ├── types.ts          # Model data TypeScript
        ├── firebase.ts       # Inisialisasi Firebase SDK
        ├── mockData.ts       # Data awal realistis sekolah Indonesia
        └── storage.ts        # Adaptor penyimpanan terpadu (Firestore & Local)
```
