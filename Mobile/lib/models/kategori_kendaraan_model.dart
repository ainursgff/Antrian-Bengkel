class KategoriKendaraanModel {
  final int id;
  final String namaKategori;
  final String? deskripsi;
  final String? icon;
  final bool isActive;

  KategoriKendaraanModel({
    required this.id,
    required this.namaKategori,
    this.deskripsi,
    this.icon,
    this.isActive = true,
  });

  factory KategoriKendaraanModel.fromJson(Map<String, dynamic> json) {
    final activeVal = json['is_active'];
    bool active = true;
    if (activeVal != null) {
      active = (activeVal == 1 || activeVal == true || activeVal.toString() == '1');
    }
    return KategoriKendaraanModel(
      id: _parseInt(json['id']),
      namaKategori: json['nama_kategori']?.toString() ?? '',
      deskripsi: json['deskripsi']?.toString(),
      icon: json['icon']?.toString(),
      isActive: active,
    );
  }

  static int _parseInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '0') ?? 0;
  }
}
