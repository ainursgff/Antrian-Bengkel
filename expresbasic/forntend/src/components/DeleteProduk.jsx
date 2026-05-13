import React from "react";
import { Button } from "react-bootstrap";
import api from "../api";

function DeleteProduk({ id, onSuccess }) {
  const handleDelete = async () => {
    const confirmDelete = window.confirm("Yakin hapus data ini?");
    if (confirmDelete) {
      try {
        const res = await api.delete(`/produk/delete/${id}`);
        if (res.data.status) {
          alert("Berhasil hapus data.");
          if (onSuccess) onSuccess();
          // Kita bisa menggunakan onSuccess (fetchData ulang) daripada window.location.reload()
        } else {
          alert("Gagal hapus.");
        }
      } catch (err) {
        console.error("Error:", err);
        alert("Terjadi kesalahan pada handle delete");
      }
    }
  };

  return (
    <Button variant="danger" size="sm" onClick={handleDelete}>
      Hapus
    </Button>
  );
}

export default DeleteProduk;
