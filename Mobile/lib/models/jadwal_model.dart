class JadwalModel {
  final int id;
  final int hari;
  final String namaHari;
  final String jamBuka;
  final String jamTutup;
  final int kuotaPerSlot;
  final bool isLibur;

  JadwalModel({
    required this.id,
    required this.hari,
    required this.namaHari,
    required this.jamBuka,
    required this.jamTutup,
    required this.kuotaPerSlot,
    required this.isLibur,
  });

  factory JadwalModel.fromJson(Map<String, dynamic> json) {
    return JadwalModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      hari: json['hari'] is int ? json['hari'] : int.tryParse(json['hari']?.toString() ?? '0') ?? 0,
      namaHari: json['nama_hari']?.toString() ?? _defaultNamaHari(json['hari']),
      jamBuka: json['jam_buka']?.toString() ?? '08:00:00',
      jamTutup: json['jam_tutup']?.toString() ?? '17:00:00',
      kuotaPerSlot: json['kuota_per_slot'] is int ? json['kuota_per_slot'] : int.tryParse(json['kuota_per_slot']?.toString() ?? '5') ?? 5,
      isLibur: json['is_libur'] == 1 || json['is_libur'] == true,
    );
  }

  Map<String, dynamic> toJson() => {
    'hari': hari,
    'jam_buka': jamBuka,
    'jam_tutup': jamTutup,
    'kuota_per_slot': kuotaPerSlot,
    'is_libur': isLibur ? 1 : 0,
  };

  static String _defaultNamaHari(dynamic h) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    final idx = h is int ? h : int.tryParse(h?.toString() ?? '0') ?? 0;
    return idx >= 0 && idx < 7 ? days[idx] : '-';
  }
}
