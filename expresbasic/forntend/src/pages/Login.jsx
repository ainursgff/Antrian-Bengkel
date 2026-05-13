import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import api from '../api';
import ParticlesComponent from '../components/ParticlesComponent';

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/login', { username, password });
      const token = response.data.token || "mock_token";
      localStorage.setItem('token', token);
      setToken(token);
      navigate('/kategori');
    } catch (err) {
      if (err.response?.status === 429) {
        setError(err.response.data?.message || 'Terlalu banyak percobaan login. Silakan tunggu 5 menit.');
      } else {
        setError(err.response?.data?.message || 'Login gagal. Periksa username dan password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <ParticlesComponent id="tsparticles" />
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '85vh', position: 'relative', zIndex: 1 }}>
      <Row className="w-100 justify-content-center">
        <Col md={5} lg={4}>
          <Card className="shadow border-0">
            <Card.Body className="p-4">
              <h3 className="text-center fw-bold mb-1">Welcome Back</h3>
              <p className="text-center text-muted mb-4">Sign in to access your dashboard</p>

              {error && <Alert variant="danger" className="py-2">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 mt-2" disabled={loading}>
                  {loading ? <Spinner animation="border" size="sm" /> : 'Sign In'}
                </Button>
              </Form>

              <p className="text-center text-muted mt-3 mb-0" style={{ fontSize: '0.9rem' }}>
                Belum punya akun? <Link to="/register">Daftar</Link>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </div>
  );
};

export default Login;
