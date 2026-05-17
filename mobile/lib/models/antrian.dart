class Antrian {
  final int id;
  final int userId;
  final String layananId;
  final String nomorAntrian;
  final String tanggal;
  final String status;
  final String? catatan;
  final String? namaLayanan;
  final int? estimasiMenit;
  final int? totalHarga;
  final String? rincianHarga;
  final int? posisiAntrian;
  final String? slotWaktu;

  Antrian({
    required this.id,
    required this.userId,
    required this.layananId,
    required this.nomorAntrian,
    required this.tanggal,
    required this.status,
    this.catatan,
    this.namaLayanan,
    this.estimasiMenit,
    this.totalHarga,
    this.rincianHarga,
    this.posisiAntrian,
    this.slotWaktu,
  });

  factory Antrian.fromJson(Map<String, dynamic> json) {
    return Antrian(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      userId: json['user_id'] is int ? json['user_id'] : int.tryParse(json['user_id'].toString()) ?? 0,
      layananId: json['layanan_id']?.toString() ?? '',
      nomorAntrian: json['nomor_antrian'] ?? '',
      tanggal: json['tanggal'] ?? '',
      status: json['status'] ?? 'menunggu',
      catatan: json['catatan'],
      namaLayanan: json['nama_layanan'],
      estimasiMenit: json['estimasi_menit'] is int ? json['estimasi_menit'] : int.tryParse(json['estimasi_menit']?.toString() ?? ''),
      totalHarga: json['total_harga'] is int ? json['total_harga'] : int.tryParse(json['total_harga']?.toString() ?? ''),
      rincianHarga: json['rincian_harga'],
      posisiAntrian: json['posisi_antrian'] is int ? json['posisi_antrian'] : int.tryParse(json['posisi_antrian']?.toString() ?? ''),
      slotWaktu: json['slot_waktu'],
    );
  }
}
