import 'package:mobile/models/antrian_model.dart';
import 'package:mobile/models/layanan_model.dart';
import 'package:mobile/models/notifikasi_model.dart';

class MockData {
  MockData._();

  static AntrianModel get antrianMenunggu => AntrianModel(
    id: 1,
    nomorAntrian: 'A001',
    userId: 10,
    layananId: '1,2',
    status: 'menunggu',
    tanggal: '2026-05-18',
    slotWaktu: '08:00:00',
    kendaraan: 'Honda Vario 125 - B 1234 XY',
    catatan: 'Suara mesin kasar',
    namaLayanan: 'Ganti Oli, Tune Up',
    namaPelanggan: 'Budi Santoso',
    noHp: '081234567890',
    estimasiMenit: 45,
    totalHarga: 250000,
    createdAt: '2026-05-18T07:30:00',
  );

  static AntrianModel get antrianDilayani => AntrianModel(
    id: 2,
    nomorAntrian: 'A002',
    userId: 11,
    layananId: '3',
    status: 'sedang_dilayani',
    tanggal: '2026-05-18',
    slotWaktu: '09:00:00',
    kendaraan: 'Yamaha NMAX - AB 5678 CD',
    namaLayanan: 'Ganti Ban',
    namaPelanggan: 'Andi Pratama',
    noHp: '089876543210',
    estimasiMenit: 30,
    totalHarga: 350000,
    createdAt: '2026-05-18T08:15:00',
  );

  static AntrianModel get antrianSelesai => AntrianModel(
    id: 3,
    nomorAntrian: 'A003',
    userId: 12,
    layananId: '1',
    status: 'selesai',
    tanggal: '2026-05-18',
    slotWaktu: '10:00:00',
    kendaraan: 'Honda Beat - D 9999 EF',
    namaLayanan: 'Ganti Oli',
    namaPelanggan: 'Siti Rahayu',
    noHp: '081122334455',
    estimasiMenit: 15,
    totalHarga: 85000,
    createdAt: '2026-05-18T09:00:00',
  );

  static List<AntrianModel> get antrianList => [antrianMenunggu, antrianDilayani, antrianSelesai];

  static LayananModel get layananGantiOli => LayananModel(
    id: 1,
    namaLayanan: 'Ganti Oli',
    harga: 85000,
    estimasiMenit: 15,
    isAktif: 1,
  );

  static LayananModel get layananTuneUp => LayananModel(
    id: 2,
    namaLayanan: 'Tune Up',
    harga: 165000,
    estimasiMenit: 30,
    isAktif: 1,
  );

  static List<LayananModel> get layananList => [layananGantiOli, layananTuneUp];

  static NotifikasiModel get notifPanggilan => NotifikasiModel(
    id: 1,
    antrianId: 1,
    pesan: 'Nomor antrian A001 dipanggil! Silakan menuju counter.',
    tipe: 'panggilan',
    isRead: false,
    sentAt: '2026-05-18T08:00:00',
    nomorAntrian: 'A001',
  );

  static List<NotifikasiModel> get notifikasiList => [notifPanggilan];
}
