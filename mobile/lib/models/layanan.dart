class Layanan {
  final int id;
  final String namaLayanan;
  final String? deskripsi;
  final int estimasiMenit;
  final int harga;
  final int isAktif;

  Layanan({
    required this.id,
    required this.namaLayanan,
    this.deskripsi,
    required this.estimasiMenit,
    required this.harga,
    required this.isAktif,
  });

  factory Layanan.fromJson(Map<String, dynamic> json) {
    return Layanan(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      namaLayanan: json['nama_layanan'] ?? '',
      deskripsi: json['deskripsi'],
      estimasiMenit: json['estimasi_menit'] is int ? json['estimasi_menit'] : int.tryParse(json['estimasi_menit'].toString()) ?? 0,
      harga: json['harga'] is int ? json['harga'] : int.tryParse(json['harga'].toString()) ?? 0,
      isAktif: json['is_aktif'] is int ? json['is_aktif'] : int.tryParse(json['is_aktif'].toString()) ?? 0,
    );
  }
}
