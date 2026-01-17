# Rencana Pengembangan Time Table Management Excavator

Dokumen ini merinci langkah-langkah pembangunan aplikasi kalender timeline untuk memantau operasional excavator secara efisien.

## 1. Antarmuka Kalender Utama
- **Visualisasi Timeline**: Menampilkan kalender bulanan/mingguan yang interaktif.
- **Kategorisasi Warna (Status)**:
  - **Hijau**: Operasional (Kerja).
  - **Merah**: Downtime (Excavator Rusak).
  - **Kuning**: Maintenance (Perbaikan Terjadwal).
  - **Abu-abu**: Libur/Off.

## 2. Fitur Input Aktivitas
- **Klik & Input**: Klik pada tanggal untuk mengisi detail harian.
- **Data yang Dicatat**:
  - Jumlah Trip.
  - Total Pendapatan Harian.
  - Catatan Perbaikan (jika ada).
  - Alasan Libur/Rusak.

## 3. Laporan & Statistik (Auto-Calculated)
- **Ringkasan Keuangan**: Kalkulasi total pendapatan berdasarkan range tanggal yang dipilih.
- **Efisiensi Alat**: Menghitung jumlah hari kerja vs hari rusak dalam sebulan.
- **Log Perbaikan**: Daftar riwayat kerusakan untuk analisis pemeliharaan alat.

## 4. Teknologi yang Digunakan
- **Frontend**: React dengan Tailwind CSS untuk UI yang responsif.
- **Komponen**: Shadcn UI + Lucide Icons.
- **State Management**: React Query untuk sinkronisasi data.

---

## Tasklist Pengerjaan

### Tahap 1: Inisialisasi & UI Dasar
- [ ] Buat file halaman `CalendarPage.tsx`.
- [ ] Implementasi library kalender dasar.
- [ ] Integrasi Sidebar untuk navigasi cepat.

### Tahap 2: Logika Data & Interaksi
- [ ] Tambahkan Modal/Dialog untuk input data harian.
- [ ] Buat sistem state untuk menyimpan data operasional (sementara di MemStorage).
- [ ] Implementasi logika perubahan warna sel kalender berdasarkan status.

### Tahap 3: Finalisasi & Laporan
- [ ] Buat widget ringkasan (Total Trip & Revenue) di bagian atas kalender.
- [ ] Tambahkan filter kategori status.
- [ ] Uji coba input dan validasi data.