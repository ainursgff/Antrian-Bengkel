class UserModel {
  final int id;
  final String nama;
  final String email;
  final String? noHp;
  final String role;
  final int? isBusy;
  final String? activeAntrianNomor;
  final String? activeKendaraan;

  UserModel({
    required this.id,
    required this.nama,
    required this.email,
    this.noHp,
    required this.role,
    this.isBusy,
    this.activeAntrianNomor,
    this.activeKendaraan,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      nama: json['nama']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      noHp: json['no_hp']?.toString(),
      role: json['role']?.toString() ?? 'pelanggan',
      isBusy: json['is_busy'] is int ? json['is_busy'] : int.tryParse(json['is_busy']?.toString() ?? '0'),
      activeAntrianNomor: json['active_antrian_nomor']?.toString(),
      activeKendaraan: json['active_kendaraan']?.toString(),
    );
  }

  bool get busy => (isBusy ?? 0) > 0;
}
