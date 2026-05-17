# Antrian Bengkel — Mobile App (Flutter)

Aplikasi mobile resmi untuk sistem **Antrian Bengkel UMKM**, dibangun menggunakan arsitektur modern **Flutter** yang bertindak sebagai antarmuka (client-side) dari **Express.js API Backend** yang sudah ada.

Aplikasi ini tidak memiliki database lokal yang independen; semua data operasional, validasi penting, dan *business logic* sepenuhnya tersinkronisasi dan dikendalikan oleh backend `Node.js + MySQL`.

---

## 🏗 Arsitektur & Teknologi

Sistem aplikasi mengikuti prinsip **Clean Architecture** ringan dan terstruktur agar *scalable* serta mudah di-*maintain*.

*   **SDK & Bahasa**: Flutter (Versi Stabil Terbaru) & Dart
*   **Networking**: `Dio` (HTTP Client) dengan *Token Auth Interceptors*
*   **State Management**: `Provider` (Untuk Auth State Global & Lifecycle)
*   **Routing & Navigasi**: `Go Router` dengan *Role-Based Access Control* (Pelanggan, Montir, Admin)
*   **Local Storage**: `SharedPreferences` (Untuk *persistence* token sesi agar fitur Auto-Login berjalan lancar)
*   **Theming**: Custom Material 3 Theming yang seragam dengan *UI Desktop/Web* (Premium Automotive Style: Oranye + Hitam).

### 📂 Struktur Direktori

```text
mobile/
├── lib/
│ ├── core/              # Komponen utama yang dipakai berulang di seluruh aplikasi
│ │ ├── constants/       # Konstanta string, warna, dan assets path
│ │ ├── network/         # Konfigurasi Dio Client & API Interceptors
│ │ ├── theme/           # Konfigurasi Custom Tema & Typography (Google Fonts)
│ │ ├── utils/           # Helper functions (Date formatter, Currency format, dsb)
│ │ └── widgets/         # Reusable UI widgets (Custom Buttons, Inputs, Cards)
│ │
│ ├── features/          # Modul fitur mandiri (Screen UI & Logic spesifik fitur)
│ │ ├── auth/            # Halaman Login, Register, Forgot Password
│ │ ├── antrian/         # Halaman Ambil Antrian & Kartu Detail Antrian
│ │ ├── layanan/         # List & Detail Layanan Servis
│ │ ├── admin/           # Dashboard & Panel Khusus Admin
│ │ └── montir/          # Papan Kerja Montir & Update Progress Servis
│ │
│ ├── models/            # Struktur Data JSON Serialization (Dart Objects)
│ ├── providers/         # Global state controllers (seperti AuthProvider)
│ ├── routes/            # Konfigurasi GoRouter & proteksi navigasi berdasarkan Role
│ ├── services/          # Endpoint wrapper spesifik per modul (API Repository)
│ └── main.dart          # Entry point inisialisasi aplikasi
```

---

## 🚀 Panduan Menjalankan Proyek (Setup & Build)

### 1. Menghubungkan Emulator ke Localhost Express.js
Secara *default*, *backend* Anda berjalan di **`http://localhost:5001`**. 
Namun, Android Emulator **TIDAK BISA** mengakses `localhost` langsung karena itu merujuk ke sistem internal emulator tersebut.

*   Untuk **Android Emulator**, ganti `localhost` menjadi IP khusus: **`http://10.0.2.2:5001`**
*   Buka file `lib/core/network/dio_client.dart` dan pastikan konfigurasi `baseUrl` sudah benar:
    ```dart
    static const String baseUrl = 'http://10.0.2.2:5001/api'; 
    ```
*(Jika Anda menggunakan Real Device, sambungkan HP dan Laptop ke jaringan WiFi yang sama, lalu gunakan IP IPv4 Laptop Anda, contoh: `http://192.168.1.5:5001/api`).*

### 2. Mengunduh Dependensi
Jalankan perintah ini di dalam folder `/mobile`:
```bash
flutter pub get
```

### 3. Menjalankan Aplikasi
Pilih emulator yang tersedia atau *device* yang terkoneksi, lalu jalankan:
```bash
flutter run
```

---

## 🔒 Konsep Sinkronisasi Autentikasi (JWT)
1. **Login**: User memasukkan email/password → Flutter memanggil `POST /api/auth/login`.
2. **Simpan Token**: Jika sukses, `JWT Token`, `Role`, dan Data `User` disimpan secara permanen di memori HP menggunakan `SharedPreferences`.
3. **API Interceptor**: File `dio_client.dart` akan mencegat setiap *request API* selanjutnya (seperti Get Antrian) dan menyisipkan:
   `Authorization: Bearer <TOKEN>`
4. **Auto-Login**: Saat aplikasi dimatikan dan dibuka kembali, `main.dart` akan meminta `AuthProvider` untuk mengecek token yang tersimpan dan memutuskan apakah harus melempar *user* ke Halaman Dashboard atau ke Halaman Login.

## 🎨 Pedoman Desain UI Mobile-First
UI dibangun dengan pendekatan *Glassmorphism* dan *Premium Card UI* menyerupai website aslinya. Elemen penting yang digunakan:
*   **Bottom Navigation**: Kemudahan bernavigasi menggunakan satu tangan (Layanan, Antrian, Notifikasi, Profil).
*   **Empty States & Skeleton Loading**: *Placeholder* animasi cerdas saat mengambil data API untuk UX yang responsif (menghindari blank screen).
*   **Pull to Refresh**: Mengambil ulang status pembaruan antrian secara real-time dengan mengusap layar ke bawah.
*   **Snackbar/Toast**: Pemberitahuan kilat di bawah layar usai *action* penting (misal: "Nomor antrian berhasil dibatalkan").
