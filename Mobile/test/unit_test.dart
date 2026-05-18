import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/utils/helpers.dart';
import 'package:mobile/models/antrian_model.dart';
import 'package:mobile/models/layanan_model.dart';
import 'package:mobile/models/notifikasi_model.dart';

void main() {
  group('Helpers', () {
    test('formatRupiah should format number correctly', () {
      expect(Helpers.formatRupiah(85000), contains('85'));
      expect(Helpers.formatRupiah(0), contains('0'));
      expect(Helpers.formatRupiah('250000'), contains('250'));
      expect(Helpers.formatRupiah(null), contains('0'));
    });

    test('formatDate should format valid date string', () {
      final result = Helpers.formatDate('2026-05-18');
      expect(result, isNot('-'));
    });

    test('formatDate should return dash for null', () {
      expect(Helpers.formatDate(null), '-');
      expect(Helpers.formatDate(''), '-');
    });

    test('formatTime should format correctly', () {
      expect(Helpers.formatTime('08:30:00'), '08:30');
      expect(Helpers.formatTime(null), '-');
    });

    test('getStatusColor should return correct colors', () {
      expect(Helpers.getStatusColor('menunggu'), isNotNull);
      expect(Helpers.getStatusColor('dipanggil'), isNotNull);
      expect(Helpers.getStatusColor('selesai'), isNotNull);
      expect(Helpers.getStatusColor('unknown'), isNotNull);
    });

    test('getStatusLabel should return human readable label', () {
      expect(Helpers.getStatusLabel('menunggu'), 'Menunggu');
      expect(Helpers.getStatusLabel('sedang_dilayani'), 'Sedang Dilayani');
      expect(Helpers.getStatusLabel('selesai'), 'Selesai');
    });

    test('getStatusIcon should return valid icon', () {
      expect(Helpers.getStatusIcon('menunggu'), isNotNull);
      expect(Helpers.getStatusIcon('selesai'), isNotNull);
    });

    test('getRoleLabel should return correct label', () {
      expect(Helpers.getRoleLabel('admin'), 'Admin');
      expect(Helpers.getRoleLabel('montir'), 'Petugas');
      expect(Helpers.getRoleLabel('pelanggan'), 'Pelanggan');
      expect(Helpers.getRoleLabel(null), 'Pengguna');
    });

    test('validateEmail should validate correctly', () {
      expect(Helpers.validateEmail(null), isNotNull);
      expect(Helpers.validateEmail(''), isNotNull);
      expect(Helpers.validateEmail('invalid'), isNotNull);
      expect(Helpers.validateEmail('test@gmail.com'), isNull);
    });

    test('validatePassword should validate correctly', () {
      expect(Helpers.validatePassword(null), isNotNull);
      expect(Helpers.validatePassword(''), isNotNull);
      expect(Helpers.validatePassword('123'), isNotNull);
      expect(Helpers.validatePassword('123456'), isNull);
    });

    test('validateRequired should validate correctly', () {
      expect(Helpers.validateRequired(null, 'Nama'), isNotNull);
      expect(Helpers.validateRequired('', 'Nama'), isNotNull);
      expect(Helpers.validateRequired('Budi', 'Nama'), isNull);
    });

    test('formatRelativeDate should return relative text', () {
      final now = DateTime.now().toIso8601String();
      expect(Helpers.formatRelativeDate(now), 'Baru saja');
      expect(Helpers.formatRelativeDate(null), '-');
    });
  });

  group('AntrianModel', () {
    test('fromJson should parse correctly', () {
      final json = {
        'id': 1,
        'nomor_antrian': 'A001',
        'user_id': 10,
        'layanan_id': '1,2',
        'status': 'menunggu',
        'tanggal': '2026-05-18',
        'slot_waktu': '08:00:00',
        'kendaraan': 'Honda Vario',
        'catatan': 'Test',
        'nama_layanan': 'Ganti Oli',
        'nama_pelanggan': 'Budi',
        'no_hp': '081234',
        'estimasi_menit': 30,
        'total_harga': 85000,
        'created_at': '2026-05-18T07:30:00',
      };
      final antrian = AntrianModel.fromJson(json);
      expect(antrian.id, 1);
      expect(antrian.nomorAntrian, 'A001');
      expect(antrian.status, 'menunggu');
      expect(antrian.namaPelanggan, 'Budi');
    });
  });

  group('LayananModel', () {
    test('fromJson should parse correctly', () {
      final json = {
        'id': 1,
        'nama_layanan': 'Ganti Oli',
        'harga': 85000,
        'estimasi_menit': 15,
        'is_aktif': 1,
      };
      final layanan = LayananModel.fromJson(json);
      expect(layanan.id, 1);
      expect(layanan.namaLayanan, 'Ganti Oli');
      expect(layanan.harga, 85000);
      expect(layanan.aktif, true);
    });
  });

  group('NotifikasiModel', () {
    test('fromJson should parse correctly', () {
      final json = {
        'id': 1,
        'antrian_id': 1,
        'pesan': 'Anda dipanggil',
        'tipe': 'panggilan',
        'is_read': 0,
        'sent_at': '2026-05-18T08:00:00',
        'nomor_antrian': 'A001',
      };
      final notif = NotifikasiModel.fromJson(json);
      expect(notif.id, 1);
      expect(notif.pesan, 'Anda dipanggil');
      expect(notif.isRead, false);
    });
  });
}
