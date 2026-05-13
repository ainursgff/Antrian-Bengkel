import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";

function Logout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    // Gunakan window.location agar statetoken di App.jsx ter-reset secara alami (reload)
    // atau navigate ke root yang akan memicu redirect
    window.location.href = "/"; 
  };

  return (
    <Button variant="outline-danger" onClick={handleLogout}>
      Logout
    </Button>
  );
}

export default Logout;
