class LayananModel {
  final int id;
  final String namaLayanan;
  final String? deskripsi;
  final int estimasiMenit;
  final int harga;
  final int isAktif;

  LayananModel({
    required this.id,
    required this.namaLayanan,
    this.deskripsi,
    required this.estimasiMenit,
    required this.harga,
    required this.isAktif,
  });

  factory LayananModel.fromJson(Map<String, dynamic> json) {
    return LayananModel(
      id: _parseInt(json['id']),
      namaLayanan: json['nama_layanan']?.toString() ?? '',
      deskripsi: json['deskripsi']?.toString(),
      estimasiMenit: _parseInt(json['estimasi_menit']),
      harga: _parseInt(json['harga']),
      isAktif: _parseInt(json['is_aktif']),
    );
  }

  bool get aktif => isAktif == 1;

  static int _parseInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '0') ?? 0;
  }
}
