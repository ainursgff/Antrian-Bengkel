// FILE: backend/routes/montir.js
const express = require('express');
const pool = require('../db');
const { adminMiddleware } = require('../middleware/auth');
const WorkloadService = require('../services/workloadService');

const router = express.Router();

const sendResponse = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({ success: true, message, data });
};

/**
 * GET /api/montir/workload
 * Get all mechanics with their active workload, warnings, active vehicles, skills, and rating.
 */
router.get('/workload', adminMiddleware, async (req, res, next) => {
  try {
    const data = await WorkloadService.getMechanicsWorkload();
    return sendResponse(res, 200, 'Data workload montir berhasil dimuat.', data);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/montir/recommendation/:queueId
 * Smart Assignment Recommendation algorithm
 */
router.get('/recommendation/:queueId', adminMiddleware, async (req, res, next) => {
  const { queueId } = req.params;
  try {
    const data = await WorkloadService.getRecommendation(queueId);
    return sendResponse(res, 200, 'Rekomendasi montir terbaik berhasil dimuat.', data);
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/montir/:id/skills
 * Set skills for a specific mechanic
 */
router.post('/:id/skills', adminMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { skills } = req.body; // Array of skills: ['motor', 'mobil', 'diesel', 'transmisi', 'electrical', 'truck/bus']

  if (!Array.isArray(skills)) {
    return res.status(400).json({ success: false, error: 'Skills harus berupa array.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const skillsString = skills.join(', ');
    await conn.query('UPDATE users SET skills = ? WHERE id = ?', [skillsString, id]);

    await conn.commit();
    return sendResponse(res, 200, 'Skillset montir berhasil diperbarui.');
  } catch (error) {
    await conn.rollback();
    return next(error);
  } finally {
    conn.release();
  }
});

module.exports = router;
