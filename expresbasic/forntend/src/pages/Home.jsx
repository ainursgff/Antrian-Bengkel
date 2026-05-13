import React from "react";
import { Container, Card, Alert } from "react-bootstrap";
import Logout from "./Logout";

function Home() {
  const token = localStorage.getItem("token");

  return (
    <Container className="py-5 text-center">
      <Card className="shadow-lg p-5 border-0 rounded-4">
        <h1 className="fw-bold text-primary mb-4">
          Selamat datang di Management Ainur Segaf
        </h1>
        <p className="text-muted lead mb-4">
          Anda berhasil masuk ke sistem menggunakan autentikasi Token JWT.
        </p>

        {token && (
          <Alert variant="info" className="text-break mb-4 p-3 bg-light border-info border-opacity-25">
            <small className="text-uppercase fw-bold text-secondary d-block mb-1">
              Your Active JWT Token:
            </small>
            <code className="text-dark" style={{ fontSize: '0.85rem', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
              {token}
            </code>
          </Alert>
        )}

        <div className="d-flex justify-content-center">
          <Logout />
        </div>
      </Card>
    </Container>
  );
}

export default Home;
