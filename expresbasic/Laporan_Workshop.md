# Laporan Management Ainur Segaf - Modul 5-11

## 1. Implementasi Fitur Utama

### A. Keamanan Data (Enkripsi AES)
Kami mengimplementasikan modul `crypto-js` untuk mengamankan data yang dikirim antara backend dan frontend.
- **Backend**: Data dienkripsi menggunakan AES-256-CBC sebelum dikirim ke client.
- **Frontend**: Menggunakan Axios Response Interceptor untuk mendeteksi data terenkripsi dan melakukan dekripsi secara otomatis menggunakan `SECRET_KEY` dan `IV` yang cocok.
- **Analisa**: Hal ini meningkatkan keamanan karena data yang terlihat di Network Tab browser akan berupa string acak (ciphertext), bukan JSON mentah yang mudah dibaca.

### B. Background Processing (Bull Queue & Redis)
Operasi database untuk Kategori dan Produk dilakukan melalui sistem antrian.
- **Queue**: Menggunakan `Bull` dan `Redis`.
- **Worker**: Proses penulisan dan pembacaan data dilakukan oleh worker terpisah untuk menjaga keandalan sistem saat beban tinggi.
- **Analisa**: Dengan membagi beban kerja ke worker, aplikasi dapat menangani permintaan secara lebih efisien tanpa memblokir thread utama Node.js.

### D. Modul Dekripsi & Modularisasi UI
- **Decrypted Utility**: Kami menggunakan `utils/crypto.js` untuk manajemen kunci terpusat. `SECRET_KEY` telah disinkronkan dengan standar workshop: `nasipadangdiamaknsamadaunapa????`.
- **Modularisasi Komponen**: Fitur hapus data dipisahkan menjadi komponen mandiri `DeleteProduk.jsx`. Hal ini memungkinkan logika penghapusan digunakan kembali (reusable) di berbagai bagian aplikasi tanpa menulis ulang kode yang sama.
- **Analisa**: Modularisasi meningkatkan maintainability kode. Jika ada perubahan pada alur penghapusan (misal: tambah modal konfirmasi), kita hanya perlu mengubah satu file saja.

## 2. Analisa Hasil (Step-by-Step)

| Langkah | Deskripsi Analisa |
| :--- | :--- |
| **Langkah 1-3** | Implementasi Form Tambah Produk dan integrasi Queue. |
| **Langkah 4: Edit Data** | Penggunaan `GET /api/produk/:id` untuk fetch data spesifik. |
| **Langkah 8: Delete Data** | Pembuatan komponen `DeleteProduk` yang menerima `id` sebagai props. |
| **Langkah 9: Decrypt Data** | Sinkronisasi `SECRET_KEY` 32-byte untuk menjamin integritas data terenkripsi. |
| **Langkah 10: JWT Auth** | Integrasi Bearer Token pada Axios Interceptor dan pembuatan halaman `Home` serta komponen `Logout`. |
| **Langkah 11: Fallback** | Implementasi mekanisme failover ke server cadangan (`localhost:3100`) jika server utama tidak merespons. |

## 3. Peningkatan Estetika (Rich UI)
Aplikasi telah ditingkatkan dengan:
- **tsparticles**: Efek background interaktif yang memberikan kesan premium.
- **React Bootstrap**: Penggunaan komponen Card dan Table yang responsif.
- **Glassmorphism**: Desain UI yang modern dengan efek blur pada background card.

---
*Laporan ini disusun untuk memenuhi tugas Workshop Pemrograman Framework Semester 4.*
