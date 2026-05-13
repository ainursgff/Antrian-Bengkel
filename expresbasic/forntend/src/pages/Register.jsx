import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import api from '../api';
import ParticlesComponent from '../components/ParticlesComponent';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/register', { username, password });
      setSuccess('Registrasi berhasil! Redirect ke login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <ParticlesComponent id="tsparticles-register" />
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '85vh', position: 'relative', zIndex: 1 }}>
      <Row className="w-100 justify-content-center">
        <Col md={5} lg={4}>
          <Card className="shadow border-0">
            <Card.Body className="p-4">
              <h3 className="text-center fw-bold mb-1">Buat Akun</h3>
              <p className="text-center text-muted mb-4">Daftar untuk mengelola data</p>

              {error && <Alert variant="danger" className="py-2">{error}</Alert>}
              {success && <Alert variant="success" className="py-2">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Pilih username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Buat password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 mt-2" disabled={loading}>
                  {loading ? <Spinner animation="border" size="sm" /> : 'Sign Up'}
                </Button>
              </Form>

              <p className="text-center text-muted mt-3 mb-0" style={{ fontSize: '0.9rem' }}>
                Sudah punya akun? <Link to="/login">Sign In</Link>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </div>
  );
};

export default Register;
