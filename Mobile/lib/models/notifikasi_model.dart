class NotifikasiModel {
  final int id;
  final int antrianId;
  final String pesan;
  final String tipe;
  final bool isRead;
  final String? sentAt;
  final String? nomorAntrian;

  NotifikasiModel({
    required this.id,
    required this.antrianId,
    required this.pesan,
    required this.tipe,
    required this.isRead,
    this.sentAt,
    this.nomorAntrian,
  });

  factory NotifikasiModel.fromJson(Map<String, dynamic> json) {
    return NotifikasiModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      antrianId: json['antrian_id'] is int ? json['antrian_id'] : int.tryParse(json['antrian_id']?.toString() ?? '0') ?? 0,
      pesan: json['pesan']?.toString() ?? '',
      tipe: json['tipe']?.toString() ?? '',
      isRead: json['is_read'] == 1 || json['is_read'] == true,
      sentAt: json['sent_at']?.toString(),
      nomorAntrian: json['nomor_antrian']?.toString(),
    );
  }
}
