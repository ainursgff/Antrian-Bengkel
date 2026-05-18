class AntrianModel {
  final int id;
  final int userId;
  final String layananId;
  final String nomorAntrian;
  final String tanggal;
  final String status;
  final String? slotWaktu;
  final String? catatan;
  final String? kendaraan;
  final String? namaLayanan;
  final int? estimasiMenit;
  final int? totalHarga;
  final String? rincianHarga;
  final int? posisiAntrian;
  final String? namaPelanggan;
  final String? noHp;
  final String? email;
  final String? namaMontir;
  final String? createdAt;

  AntrianModel({
    required this.id,
    required this.userId,
    required this.layananId,
    required this.nomorAntrian,
    required this.tanggal,
    required this.status,
    this.slotWaktu,
    this.catatan,
    this.kendaraan,
    this.namaLayanan,
    this.estimasiMenit,
    this.totalHarga,
    this.rincianHarga,
    this.posisiAntrian,
    this.namaPelanggan,
    this.noHp,
    this.email,
    this.namaMontir,
    this.createdAt,
  });

  factory AntrianModel.fromJson(Map<String, dynamic> json) {
    return AntrianModel(
      id: _parseInt(json['id']),
      userId: _parseInt(json['user_id']),
      layananId: json['layanan_id']?.toString() ?? '',
      nomorAntrian: json['nomor_antrian']?.toString() ?? '',
      tanggal: json['tanggal']?.toString() ?? '',
      status: json['status']?.toString() ?? 'menunggu',
      slotWaktu: json['slot_waktu']?.toString(),
      catatan: json['catatan']?.toString(),
      kendaraan: json['kendaraan']?.toString(),
      namaLayanan: json['nama_layanan']?.toString(),
      estimasiMenit: _parseIntNullable(json['estimasi_menit']),
      totalHarga: _parseIntNullable(json['total_harga']),
      rincianHarga: json['rincian_harga']?.toString(),
      posisiAntrian: _parseIntNullable(json['posisi_antrian']),
      namaPelanggan: json['nama_pelanggan']?.toString(),
      noHp: json['no_hp']?.toString(),
      email: json['email']?.toString(),
      namaMontir: json['nama_montir']?.toString(),
      createdAt: json['created_at']?.toString(),
    );
  }

  bool get isActive => ['menunggu', 'dipanggil', 'sedang_dilayani'].contains(status);
  bool get canCancel => status == 'menunggu' || status == 'dipanggil';

  static int _parseInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '0') ?? 0;
  }

  static int? _parseIntNullable(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    return int.tryParse(value.toString());
  }
}
