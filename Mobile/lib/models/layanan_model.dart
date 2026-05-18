class LayananKategoriModel {
  final int id;
  final String namaKategori;

  LayananKategoriModel({
    required this.id,
    required this.namaKategori,
  });

  factory LayananKategoriModel.fromJson(Map<String, dynamic> json) {
    return LayananKategoriModel(
      id: _parseInt(json['id']),
      namaKategori: json['nama_kategori']?.toString() ?? '',
    );
  }

  static int _parseInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '0') ?? 0;
  }
}

class LayananModel {
  final int id;
  final int? kategoriId;
  final String namaLayanan;
  final String? deskripsi;
  final int estimasiMenit;
  final int harga;
  final int isAktif;
  final LayananKategoriModel? kategori;

  LayananModel({
    required this.id,
    this.kategoriId,
    required this.namaLayanan,
    this.deskripsi,
    required this.estimasiMenit,
    required this.harga,
    required this.isAktif,
    this.kategori,
  });

  factory LayananModel.fromJson(Map<String, dynamic> json) {
    return LayananModel(
      id: _parseInt(json['id']),
      kategoriId: json['kategori_id'] != null ? _parseInt(json['kategori_id']) : null,
      namaLayanan: json['nama_layanan']?.toString() ?? '',
      deskripsi: json['deskripsi']?.toString(),
      estimasiMenit: _parseInt(json['estimasi_menit']),
      harga: _parseInt(json['harga']),
      isAktif: _parseInt(json['is_aktif']),
      kategori: json['kategori'] != null 
          ? LayananKategoriModel.fromJson(json['kategori'] as Map<String, dynamic>)
          : null,
    );
  }

  bool get aktif => isAktif == 1;

  static int _parseInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '0') ?? 0;
  }
}
