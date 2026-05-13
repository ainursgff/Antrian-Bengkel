import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Button, Alert, Spinner, InputGroup, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import api from '../api';

const Kategori = () => {
  const [kategoris, setKategoris] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [namaKategori, setNamaKategori] = useState('');
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchKategoris();
  }, []);

  const fetchKategoris = async () => {
    setLoading(true);
    setError(null);

    const serverA = '/kategori';
    const serverB = 'http://localhost:3100/apiserverb/kategori';

    const handleResponse = (response) => {
      // Interceptor sudah menangani dekripsi, kita cukup ambil hasilnya
      const data = response.data.data;
      setKategoris(Array.isArray(data) ? data : (data?.data || []));
    };

    try {
      // Mencoba Server Utama
      const response = await api.get(serverA);
      handleResponse(response);
    } catch (err) {
      console.warn("Server utama gagal, mencoba server cadangan...", err);
      try {
        // Mencoba Server Cadangan (Fallback)
        const response = await axios.get(serverB);
        handleResponse(response);
      } catch (errB) {
        console.error("Kedua server gagal:", errB);
        setError('Gagal mengambil data dari server utama maupun cadangan.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!namaKategori.trim()) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg('');

    try {
      if (editId) {
        await api.patch(`/kategori/update/${editId}`, { nama_kategori: namaKategori });
        setSuccessMsg('Kategori berhasil diperbarui!');
      } else {
        await api.post('/kategori/store', { nama_kategori: namaKategori });
        setSuccessMsg('Kategori berhasil ditambahkan!');
      }
      setNamaKategori('');
      setEditId(null);
      setTimeout(fetchKategoris, 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus kategori ini?')) return;
    setSuccessMsg('');
    try {
      await api.delete(`/kategori/delete/${id}`);
      setSuccessMsg('Kategori berhasil dihapus!');
      setTimeout(fetchKategoris, 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus data');
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id_kategori);
    setNamaKategori(item.nama_kategori);
    setSuccessMsg('');
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setNamaKategori('');
  };

  return (
    <Container className="py-4">
      <h2 className="fw-bold mb-4">Manajemen Kategori</h2>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {successMsg && <Alert variant="success" onClose={() => setSuccessMsg('')} dismissible>{successMsg}</Alert>}

      {/* Form Tambah/Edit */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white fw-semibold">
          {editId ? '✏️ Edit Kategori' : '➕ Tambah Kategori'}
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="align-items-end">
              <Col md={8}>
                <Form.Group controlId="namaKategori">
                  <Form.Label>Nama Kategori</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Masukkan nama kategori"
                    value={namaKategori}
                    onChange={(e) => setNamaKategori(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4} className="mt-2 mt-md-0">
                <div className="d-flex gap-2">
                  <Button variant="primary" type="submit" disabled={submitting}>
                    {submitting ? <Spinner animation="border" size="sm" /> : (editId ? 'Simpan' : 'Tambahkan')}
                  </Button>
                  {editId && (
                    <Button variant="secondary" onClick={handleCancelEdit}>Batal</Button>
                  )}
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Tabel Data */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white fw-semibold">📋 Data Kategori</Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-2">Memuat data...</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th width="80">No</th>
                  <th>Nama Kategori</th>
                  <th width="200">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kategoris.length > 0 ? (
                  kategoris.map((item, idx) => (
                    <tr key={item.id_kategori || idx}>
                      <td>{idx + 1}</td>
                      <td>{item.nama_kategori}</td>
                      <td>
                        <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(item)}>
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(item.id_kategori)}>
                          Hapus
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center text-muted py-4">Belum ada data kategori</td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Kategori;
