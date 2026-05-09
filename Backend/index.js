const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRouter = require('./routes/auth');
const antrianRouter = require('./routes/antrian');
const layananRouter = require('./routes/layanan');
const jadwalRouter = require('./routes/jadwal');
const notifikasiRouter = require('./routes/notifikasi');
const laporanRouter = require('./routes/laporan');

app.use('/api/auth', authRouter);
app.use('/api/antrian', antrianRouter);
app.use('/api/layanan', layananRouter);
app.use('/api/jadwal', jadwalRouter);
app.use('/api/notifikasi', notifikasiRouter);
app.use('/api/laporan', laporanRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Sistem Antrian Online UMKM Bengkel — API Berjalan' });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});

