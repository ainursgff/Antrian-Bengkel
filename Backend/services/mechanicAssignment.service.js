// FILE: backend/services/mechanicAssignment.service.js
const pool = require('../db');
const { AppError } = require('../middleware/errorHandler');

class MechanicAssignmentService {
  /**
   * Assigns a mechanic to an queue ticket safely under strict transactional isolation and locks
   * @param {number} antrianId 
   * @param {number} montirId 
   * @returns {Promise<object>} updated antrian data
   */
  static async assignMechanicSafely(antrianId, montirId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Lock the mechanic user row strictly to prevent concurrent assignments from bypassing the threshold limit
      const [mechanicRows] = await connection.query(
        'SELECT id, nama, role, is_aktif FROM users WHERE id = ? AND role = "montir" FOR UPDATE',
        [montirId]
      );

      if (mechanicRows.length === 0) {
        throw new AppError('Mekanik tidak ditemukan atau peran tidak valid.', 404);
      }

      const mechanic = mechanicRows[0];
      if (mechanic.is_aktif === 0) {
        throw new AppError('Mekanik sedang tidak aktif atau sedang berhalangan.', 400);
      }

      // 2. Count active workloads for the mechanic inside the lock transaction
      const [workloadRows] = await connection.query(
        `SELECT COUNT(*) as active_count 
         FROM antrian 
         WHERE montir_id = ? AND status IN ('dipanggil', 'sedang_dilayani')`,
        [montirId]
      );

      const activeCount = workloadRows[0].active_count;
      if (activeCount >= 2) {
        throw new AppError(
          `⚠️ Montir ${mechanic.nama} saat ini sedang sibuk melayani ${activeCount} antrian aktif. Maksimal pengerjaan adalah 2 antrian.`, 
          400
        );
      }

      // 3. Verify the antrian ticket exists and lock it
      const [antrianRows] = await connection.query(
        'SELECT id, nomor_antrian, status FROM antrian WHERE id = ? FOR UPDATE',
        [antrianId]
      );

      if (antrianRows.length === 0) {
        throw new AppError('Antrian tidak ditemukan.', 404);
      }

      const antrian = antrianRows[0];
      if (antrian.status === 'selesai' || antrian.status === 'dibatalkan') {
        throw new AppError('Tidak bisa menugaskan montir pada antrian yang sudah selesai atau dibatalkan.', 400);
      }

      // 4. Update the antrian assignment
      await connection.query(
        "UPDATE antrian SET montir_id = ?, status = 'dipanggil', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [montirId, antrianId]
      );

      // Create notification audit log
      await connection.query(
        "INSERT INTO notifikasi (antrian_id, pesan, tipe) VALUES (?, ?, 'panggilan')",
        [
          antrianId, 
          `Kendaraan Anda dengan nomor antrian ${antrian.nomor_antrian} dipanggil! Mekanik ${mechanic.nama} telah ditugaskan.`
        ]
      );

      // Create audit trail entry
      try {
        await connection.query(
          "INSERT INTO audit_trails (action, table_name, record_id, old_value, new_value, performed_by) VALUES (?, ?, ?, ?, ?, ?)",
          [
            'ASSIGN_MECHANIC', 
            'antrian', 
            antrianId, 
            JSON.stringify({ montir_id: null, status: antrian.status }),
            JSON.stringify({ montir_id: montirId, status: 'dipanggil' }),
            'admin'
          ]
        );
      } catch (e) { /* Fallback if table audit_trails doesn't exist yet */ }

      // Log to service_activity_logs for Queue Journey Timeline
      try {
        await connection.query(
          `INSERT INTO service_activity_logs (antrian_id, status_sebelumnya, status_baru, actor_id, catatan) VALUES (?, ?, ?, ?, ?)`,
          [antrianId, antrian.status, 'dipanggil', null, `Montir ${mechanic.nama} ditugaskan dan antrean dipanggil`]
        );
      } catch (e) { /* Fallback if table doesn't exist yet */ }

      await connection.commit();
      return { antrianId, montirId, montirName: mechanic.nama };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = MechanicAssignmentService;
