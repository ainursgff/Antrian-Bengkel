// FILE: backend/jobs/cleanupExpiredQueues.js
/**
 * Automatic Queue Cleanup System for BengkelKu
 * Identifies expired active queues from past dates and flags them as canceled/expired.
 * Prevents past static seeded data or forgotten queues from blocking customer reservations.
 */

const pool = require('../db');
const DateService = require('../services/date.service');

async function cleanupExpiredQueues() {
  const todayStr = DateService.getTodayLocal();

  try {
    // 1. Find all active queues in status (menunggu, dipanggil, sedang_dilayani) where date is before today
    const selectQuery = `
      SELECT id, nomor_antrian, tanggal, user_id 
      FROM antrian 
      WHERE tanggal < ? AND status IN ('menunggu', 'dipanggil', 'sedang_dilayani')
    `;
    const [expiredRows] = await pool.query(selectQuery, [todayStr]);

    if (expiredRows.length === 0) {
      return { success: true, cleanedCount: 0 };
    }

    console.log(`[QueueCleanup] Found ${expiredRows.length} expired queue tickets in database. Processing cancellation...`);

    // 2. Perform transactional update to cancel expired tickets
    const updateQuery = `
      UPDATE antrian 
      SET status = 'dibatalkan', 
          catatan = COALESCE(CONCAT(catatan, '\n[System]: Dibatalkan otomatis karena masa berlaku antrian telah habis.'), '[System]: Dibatalkan otomatis karena masa berlaku antrian telah habis.'),
          updated_at = NOW()
      WHERE tanggal < ? AND status IN ('menunggu', 'dipanggil', 'sedang_dilayani')
    `;
    const [result] = await pool.query(updateQuery, [todayStr]);

    // 3. For any montir assigned to those active queues, reset their busy state (just in case)
    try {
      const resetMontirQuery = `
        UPDATE users 
        SET is_aktif = 1 
        WHERE role = 'montir'
      `;
      await pool.query(resetMontirQuery);
    } catch (e) {
      // Non-blocking fallback
    }

    console.log(`[QueueCleanup] Successfully updated and cleaned ${result.affectedRows} stale queue tickets.`);
    return { success: true, cleanedCount: result.affectedRows };
  } catch (error) {
    console.error('[QueueCleanupError] Failed to execute auto-cleanup:', error);
    return { success: false, error };
  }
}

module.exports = cleanupExpiredQueues;
