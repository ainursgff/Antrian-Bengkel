// FILE: services/workloadService.js
const pool = require('../db');

class WorkloadService {
  /**
   * Get all active mechanics with their realtime workload metrics, skillsets, and performance
   */
  static async getMechanicsWorkload() {
    // 1. Fetch all mechanics
    const [mechanics] = await pool.query(`
      SELECT id, nama, email, no_hp, is_aktif, role, skills
      FROM users 
      WHERE role = 'montir' AND is_deleted = 0
      ORDER BY nama ASC
    `);

    if (mechanics.length === 0) return [];

    // 2. Fetch performance metrics dynamically in real-time
    const [perfRows] = await pool.query(`
      SELECT montir_id AS user_id, COUNT(*) AS total_servis 
      FROM antrian 
      WHERE status = 'selesai' AND montir_id IS NOT NULL 
      GROUP BY montir_id
    `);
    const perfMap = {};
    perfRows.forEach(row => {
      perfMap[row.user_id] = {
        rating: 5.0,
        total_servis: parseInt(row.total_servis) || 0,
        avg_duration_minutes: 30
      };
    });

    // 4. Fetch active queues today to calculate workload
    const todayStr = new Date().toISOString().split('T')[0];
    const [queues] = await pool.query(`
      SELECT id, nomor_antrian, status, montir_id, kendaraan, tanggal, slot_waktu 
      FROM antrian 
      WHERE tanggal = ? AND status IN ('dipanggil', 'sedang_dilayani')
    `, [todayStr]);

    const activeQueuesMap = {};
    queues.forEach(q => {
      if (q.montir_id) {
        if (!activeQueuesMap[q.montir_id]) activeQueuesMap[q.montir_id] = [];
        activeQueuesMap[q.montir_id].push(q);
      }
    });

    // 5. Build rich operational payload
    return mechanics.map(m => {
      const activeTasks = activeQueuesMap[m.id] || [];
      const numActive = activeTasks.length;
      
      // Calculate workload percentage (1 task = 40%, 2 tasks = 80%, >=3 tasks = OVERLOAD)
      let workloadPercent = Math.min(numActive * 40, 100);
      let status = 'available';
      if (numActive > 0) {
        status = 'busy';
      }
      
      // Generate warnings
      let warning = null;
      if (m.is_aktif === 0) {
        status = 'offline';
        workloadPercent = 0;
      } else if (numActive === 0) {
        warning = 'IDLE';
      } else if (numActive >= 3) {
        warning = 'OVERLOAD';
      }

      const mSkills = m.skills ? m.skills.split(',').map(s => s.trim()) : [];
      const mPerf = perfMap[m.id] || { rating: 5.0, total_servis: 0, avg_duration_minutes: 30 };

      // Calculate progress of current service
      // (Simplified: if status is 'sedang_dilayani', progress is around 60%, otherwise if 'dipanggil' it is 10%)
      let progress = 0;
      let activeVehicles = [];
      let estimasiSelesai = '-';

      if (numActive > 0) {
        activeVehicles = activeTasks.map(t => t.kendaraan);
        const latestTask = activeTasks[0];
        if (latestTask.status === 'sedang_dilayani') {
          progress = 65;
          estimasiSelesai = latestTask.slot_waktu ? `${latestTask.slot_waktu.substring(0, 5)} WIB` : '15 Mins';
        } else {
          progress = 15;
          estimasiSelesai = 'Waiting Boarding';
        }
      }

      return {
        id: m.id,
        nama: m.nama,
        email: m.email,
        no_hp: m.no_hp,
        role: m.role || 'montir',
        is_aktif: m.is_aktif,
        status, // 'available' | 'busy' | 'offline'
        workloadPercent,
        activeTasksCount: numActive,
        activeVehicles,
        progress,
        estimasiSelesai,
        warning, // 'IDLE' | 'OVERLOAD' | null
        skills: mSkills,
        performance: mPerf
      };
    });
  }

  /**
   * Smart Assignment Recommendation:
   * Rank mechanics for a given queue based on their matching skills, current workload, and availability
   */
  static async getRecommendation(queueId) {
    // 1. Fetch queue and its service requirements
    const [queueRows] = await pool.query(`
      SELECT a.*, l.nama_layanan, l.kategori_id, k.nama_kategori
      FROM antrian a
      LEFT JOIN antrian_layanan al ON a.id = al.antrian_id
      LEFT JOIN layanan l ON al.layanan_id = l.id
      LEFT JOIN kategori_kendaraan k ON l.kategori_id = k.id
      WHERE a.id = ?
    `, [queueId]);

    if (queueRows.length === 0) return [];

    const queueInfo = queueRows[0];
    const categoryName = (queueInfo.nama_kategori || '').toLowerCase();

    // Map queue category to skill tags
    let requiredSkill = 'motor';
    if (categoryName.includes('mobil') || categoryName.includes('suv') || categoryName.includes('sedan')) {
      requiredSkill = 'mobil';
    } else if (categoryName.includes('diesel') || categoryName.includes('truk') || categoryName.includes('bus')) {
      requiredSkill = 'diesel';
    }

    // 2. Fetch mechanics workload
    const mechanics = await this.getMechanicsWorkload();

    // 3. Score each mechanic
    const scoredMechanics = mechanics.map(m => {
      let score = 100;
      const reasons = [];

      // Penalty for offline
      if (m.is_aktif === 0 || m.status === 'offline') {
        score = 0;
        reasons.push('Offline / Tidak Aktif');
        return { ...m, score, recommendationReason: reasons.join(', ') };
      }

      // Penalty for workload
      if (m.activeTasksCount >= 3) {
        score -= 50;
        reasons.push('Overload (>=3 tugas aktif)');
      } else if (m.activeTasksCount === 2) {
        score -= 20;
        reasons.push('Beban kerja sedang (2 tugas aktif)');
      } else if (m.activeTasksCount === 0) {
        score += 15;
        reasons.push('Available & Siap Kerja');
      }

      // Skill match bonus
      const hasSkill = m.skills.some(s => s.toLowerCase() === requiredSkill.toLowerCase());
      if (hasSkill) {
        score += 20;
        reasons.push(`Keahlian cocok (${requiredSkill})`);
      } else {
        score -= 30;
        reasons.push(`Kurang keahlian (${requiredSkill})`);
      }

      // Rating bonus
      if (m.performance && m.performance.rating >= 4.7) {
        score += 10;
        reasons.push('Rating tinggi (Performa Bagus)');
      }

      return {
        ...m,
        score: Math.max(0, score),
        recommendationReason: reasons.join(', ')
      };
    });

    // Sort by recommendation score descending
    return scoredMechanics.sort((a, b) => b.score - a.score);
  }
}

module.exports = WorkloadService;
