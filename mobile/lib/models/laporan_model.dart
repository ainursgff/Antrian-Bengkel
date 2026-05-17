class LaporanModel {
  final LaporanHariIni hariIni;
  final List<LaporanPerLayanan> perLayanan;
  final List<LaporanMingguan> mingguan;

  LaporanModel({required this.hariIni, required this.perLayanan, required this.mingguan});

  factory LaporanModel.fromJson(Map<String, dynamic> json) {
    return LaporanModel(
      hariIni: LaporanHariIni.fromJson(json['hari_ini'] as Map<String, dynamic>),
      perLayanan: (json['per_layanan'] as List? ?? [])
          .map((e) => LaporanPerLayanan.fromJson(e as Map<String, dynamic>))
          .toList(),
      mingguan: (json['mingguan'] as List? ?? [])
          .map((e) => LaporanMingguan.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class LaporanHariIni {
  final String tanggal;
  final int total;
  final int menunggu;
  final int dipanggil;
  final int sedangDilayani;
  final int selesai;
  final int dibatalkan;

  LaporanHariIni({
    required this.tanggal, required this.total, required this.menunggu,
    required this.dipanggil, required this.sedangDilayani,
    required this.selesai, required this.dibatalkan,
  });

  factory LaporanHariIni.fromJson(Map<String, dynamic> json) {
    return LaporanHariIni(
      tanggal: json['tanggal']?.toString() ?? '',
      total: _p(json['total']),
      menunggu: _p(json['menunggu']),
      dipanggil: _p(json['dipanggil']),
      sedangDilayani: _p(json['sedang_dilayani']),
      selesai: _p(json['selesai']),
      dibatalkan: _p(json['dibatalkan']),
    );
  }

  static int _p(dynamic v) => v is int ? v : int.tryParse(v?.toString() ?? '0') ?? 0;
}

class LaporanPerLayanan {
  final String namaLayanan;
  final int total;
  final int selesai;
  final int menunggu;

  LaporanPerLayanan({required this.namaLayanan, required this.total, required this.selesai, required this.menunggu});

  factory LaporanPerLayanan.fromJson(Map<String, dynamic> json) {
    return LaporanPerLayanan(
      namaLayanan: json['nama_layanan']?.toString() ?? '',
      total: _p(json['total']),
      selesai: _p(json['selesai']),
      menunggu: _p(json['menunggu']),
    );
  }

  static int _p(dynamic v) => v is int ? v : int.tryParse(v?.toString() ?? '0') ?? 0;
}

class LaporanMingguan {
  final String tanggal;
  final int total;
  final int selesai;

  LaporanMingguan({required this.tanggal, required this.total, required this.selesai});

  factory LaporanMingguan.fromJson(Map<String, dynamic> json) {
    return LaporanMingguan(
      tanggal: json['tanggal']?.toString() ?? '',
      total: _p(json['total']),
      selesai: _p(json['selesai']),
    );
  }

  static int _p(dynamic v) => v is int ? v : int.tryParse(v?.toString() ?? '0') ?? 0;
}
