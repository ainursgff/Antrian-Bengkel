import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Table, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import api from '../api';
import DeleteProduk from '../components/DeleteProduk';

const Produk = () => {
  const [produks, setProduks] = useState([]);
  const [kategoris, setKategoris] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [namaProduk, setNamaProduk] = useState('');
  const [kategoriId, setKategoriId] = useState('');
  const [gambarProduk, setGambarProduk] = useState(null);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [respProduk, respKategori] = await Promise.all([
        api.get('/produk'),
        api.get('/kategori'),
      ]);
      
      setProduks(respProduk.data.data?.data || respProduk.data.data || []);
      
      // Handle Kategoris
      const katData = respKategori.data.data;
      setKategoris(Array.isArray(katData) ? katData : (katData?.data || []));
    } catch (err) {
      setError('Gagal mengambil data. Pastikan backend & worker berjalan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!namaProduk.trim() || !kategoriId) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('nama_produk', namaProduk);
    formData.append('kategori_id', kategoriId);
    if (gambarProduk) formData.append('gambar_produk', gambarProduk);

    try {
      if (editId) {
        await api.patch(`/produk/update/${editId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccessMsg('Produk berhasil diperbarui!');
      } else {
        await api.post('/produk/store', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccessMsg('Produk berhasil ditambahkan!');
      }
      resetForm();
      setTimeout(fetchData, 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id_produk || item.id);
    setNamaProduk(item.nama_produk);
    setKategoriId(item.kategori_id);
    setGambarProduk(null);
    setSuccessMsg('');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setEditId(null);
    setNamaProduk('');
    setKategoriId('');
    setGambarProduk(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getKategoriName = (id) => {
    const kat = kategoris.find(k => k.id_kategori == id);
    return kat ? kat.nama_kategori : id;
  };

  return (
    <Container className="py-4">
      <h2 className="fw-bold mb-4">Manajemen Produk</h2>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {successMsg && <Alert variant="success" onClose={() => setSuccessMsg('')} dismissible>{successMsg}</Alert>}

      {/* Form Tambah/Edit */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white fw-semibold">
          {editId ? '✏️ Edit Produk' : '➕ Tambah Produk'}
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="namaProduk">
                  <Form.Label>Nama Produk</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Masukkan nama produk"
                    value={namaProduk}
                    onChange={(e) => setNamaProduk(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="kategoriId">
                  <Form.Label>Kategori</Form.Label>
                  <Form.Select value={kategoriId} onChange={(e) => setKategoriId(e.target.value)} required>
                    <option value="">-- Pilih Kategori --</option>
                    {kategoris.map(kat => (
                      <option key={kat.id_kategori} value={kat.id_kategori}>{kat.nama_kategori}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="gambarProduk">
                  <Form.Label>Gambar Produk {editId && <small className="text-muted">(opsional)</small>}</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => setGambarProduk(e.target.files[0])}
                    required={!editId}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? <Spinner animation="border" size="sm" /> : (editId ? 'Simpan Perubahan' : 'Tambahkan')}
              </Button>
              {editId && (
                <Button variant="secondary" onClick={resetForm}>Batal</Button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Tabel Data */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white fw-semibold">📋 Data Produk</Card.Header>
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
                  <th width="60">No</th>
                  <th width="80">Gambar</th>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th width="180">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {produks.length > 0 ? (
                  produks.map((item, idx) => {
                    const idProd = item.id_produk || item.id;
                    return (
                      <tr key={idProd || idx}>
                        <td>{idx + 1}</td>
                        <td>
                          {item.gambar_produk ? (
                            <img
                              src={`http://localhost:3000/static/${item.gambar_produk}`}
                              alt={item.nama_produk}
                              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                            />
                          ) : (
                            <div style={{ width: '50px', height: '50px', background: '#e9ecef', borderRadius: '6px' }}></div>
                          )}
                        </td>
                        <td className="align-middle">{item.nama_produk}</td>
                        <td className="align-middle">{getKategoriName(item.kategori_id)}</td>
                        <td className="align-middle">
                          <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(item)}>
                            Edit
                          </Button>
                          <DeleteProduk id={idProd} onSuccess={fetchData} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">Belum ada data produk</td>
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

export default Produk;
