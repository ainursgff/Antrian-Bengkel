import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

const Navigation = ({ token, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-white d-flex align-items-center gap-2">
          <i className="fas fa-box-open"></i>
          Management Ainur Segaf
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="ms-auto align-items-center">
            {token ? (
              <>
                <Nav.Link as={Link} to="/kategori" active={location.pathname === '/kategori'}>
                  Kategori
                </Nav.Link>
                <Nav.Link as={Link} to="/produk" active={location.pathname === '/produk'}>
                  Produk
                </Nav.Link>
                <Button variant="outline-light" size="sm" className="ms-3" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" active={location.pathname === '/login'}>
                  Login
                </Nav.Link>
                <Button as={Link} to="/register" variant="primary" size="sm" className="ms-2">
                  Register
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
