// FILE: backend/services/date.service.js
/**
 * Centralized Date Service for BengkelKu (Operational SaaS)
 * Handles Western Indonesia Time (WIB / Asia/Jakarta Timezone, UTC+7) natively.
 * Eliminates timezone shift issues, fallback mock dates, or third-party dependency requirements.
 */

const DateService = {
  /**
   * Retrieves specific parts of the current date/time in Asia/Jakarta timezone
   */
  getJakartaParts(dateObj = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(dateObj);
    const map = {};
    parts.forEach(p => {
      map[p.type] = p.value;
    });
    return {
      year: parseInt(map.year),
      month: parseInt(map.month),
      day: parseInt(map.day),
      hour: parseInt(map.hour),
      minute: parseInt(map.minute),
      second: parseInt(map.second)
    };
  },

  /**
   * Returns current date in YYYY-MM-DD format (WIB)
   */
  getTodayLocal() {
    const p = this.getJakartaParts();
    const mm = String(p.month).padStart(2, '0');
    const dd = String(p.day).padStart(2, '0');
    return `${p.year}-${mm}-${dd}`;
  },

  /**
   * Returns tomorrow's date in YYYY-MM-DD format (WIB)
   */
  getBesokLocal() {
    const now = new Date();
    // Add 24 hours to secure tomorrow in GMT+7
    const besok = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const p = this.getJakartaParts(besok);
    const mm = String(p.month).padStart(2, '0');
    const dd = String(p.day).padStart(2, '0');
    return `${p.year}-${mm}-${dd}`;
  },

  /**
   * Returns relative date YYYY-MM-DD based on offset
   */
  getDateString(daysOffset = 0) {
    const now = new Date();
    const target = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    const p = this.getJakartaParts(target);
    const mm = String(p.month).padStart(2, '0');
    const dd = String(p.day).padStart(2, '0');
    return `${p.year}-${mm}-${dd}`;
  },

  /**
   * Formats a Date object to YYYY-MM-DD HH:mm:ss in WIB (Asia/Jakarta)
   */
  toTimestampWIB(dateObj = new Date()) {
    const p = this.getJakartaParts(dateObj);
    const mm = String(p.month).padStart(2, '0');
    const dd = String(p.day).padStart(2, '0');
    const hh = String(p.hour).padStart(2, '0');
    const min = String(p.minute).padStart(2, '0');
    const ss = String(p.second).padStart(2, '0');
    return `${p.year}-${mm}-${dd} ${hh}:${min}:${ss}`;
  },

  /**
   * Formats a database YYYY-MM-DD string to Indonesian (e.g., "18 Mei 2026")
   */
  formatIndonesian(dateStr) {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      
      const year = parseInt(parts[0]);
      const monthIdx = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      
      if (monthIdx < 0 || monthIdx > 11) return dateStr;
      return `${day} ${months[monthIdx]} ${year}`;
    } catch {
      return dateStr;
    }
  },

  /**
   * Checks if a YYYY-MM-DD string lies strictly in the past (before today in WIB)
   */
  isPastDate(dateStr) {
    if (!dateStr) return false;
    const todayStr = this.getTodayLocal();
    return dateStr < todayStr;
  }
};

module.exports = DateService;
