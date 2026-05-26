// FILE: frontend/src/utils/dateFormatter.js
/**
 * Centralized Date Formatter Utility for BengkelKu React Frontend
 * Standardizes all date representations across components (Public Portal, Admin & Montir Dashboard).
 * Strictly formats dates to Indonesian locale without timezone leakage or hardcoded defaults.
 */

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const dateFormatter = {
  /**
   * Formats YYYY-MM-DD string into "DD MMMM YYYY" (e.g. "18 Mei 2026")
   */
  formatIndonesian(dateStr) {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) {
        // Fallback for full ISO string
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
      }
      const year = parseInt(parts[0]);
      const monthIdx = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);

      if (monthIdx < 0 || monthIdx > 11) return dateStr;
      return `${day} ${MONTHS_ID[monthIdx]} ${year}`;
    } catch {
      return dateStr;
    }
  },

  /**
   * Returns today's date in YYYY-MM-DD format (WIB context)
   */
  getTodayLocalString() {
    const now = new Date();
    // Shift timezone offset to Jakarta context (WIB = GMT+7)
    const tzOffset = 7 * 60; // 7 hours in minutes
    const localTime = new Date(now.getTime() + (tzOffset + now.getTimezoneOffset()) * 60 * 1000);
    
    const y = localTime.getFullYear();
    const m = String(localTime.getMonth() + 1).padStart(2, '0');
    const d = String(localTime.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  /**
   * Returns relative human-readable status of a date (Hari ini, Besok, etc.)
   */
  getRelativeDayLabel(dateStr) {
    if (!dateStr) return '';
    const today = this.getTodayLocalString();
    
    // Calculate tomorrow
    const now = new Date();
    const tzOffset = 7 * 60;
    const tomorrowTime = new Date(now.getTime() + (tzOffset + now.getTimezoneOffset()) * 60 * 1000 + 24 * 60 * 60 * 1000);
    const tomorrowStr = `${tomorrowTime.getFullYear()}-${String(tomorrowTime.getMonth() + 1).padStart(2, '0')}-${String(tomorrowTime.getDate()).padStart(2, '0')}`;

    if (dateStr === today) {
      return 'Hari ini';
    } else if (dateStr === tomorrowStr) {
      return 'Besok';
    }
    return this.formatIndonesian(dateStr);
  },

  /**
   * Safe duration formatter (minutes to readable hours/minutes)
   */
  formatDuration(minutes) {
    const mins = parseInt(minutes) || 0;
    if (mins < 60) return `${mins} menit`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs} jam ${rem} menit` : `${hrs} jam`;
  }
};

export default dateFormatter;
