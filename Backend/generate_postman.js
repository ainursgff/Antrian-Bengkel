const fs = require('fs');

const collection = {
    info: {
        name: "BengkelKu Testing Cepat",
        description: "Postman Collection untuk testing secara berurutan sesuai Sprint Backlog",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    variable: [
        { key: "baseUrl", value: "http://localhost:5000", type: "string" },
        { key: "token_admin", value: "MASUKKAN_TOKEN_ADMIN_DI_SINI", type: "string" },
        { key: "token_montir", value: "MASUKKAN_TOKEN_MONTIR_DI_SINI", type: "string" },
        { key: "token_pelanggan", value: "MASUKKAN_TOKEN_PELANGGAN_DI_SINI", type: "string" }
    ],
    item: [
        {
            name: "1. Kelola Layanan",
            item: [
                {
                    name: "GET Layanan (Semua Role)",
                    request: {
                        method: "GET",
                        url: "{{baseUrl}}/api/layanan",
                    }
                },
                {
                    name: "POST Layanan (Admin)",
                    request: {
                        method: "POST",
                        header: [ { key: "Authorization", value: "Bearer {{token_admin}}" } ],
                        url: "{{baseUrl}}/api/layanan",
                        body: {
                            mode: "raw",
                            raw: JSON.stringify({
                                nama_layanan: "Servis Ringan Motor",
                                deskripsi: "Servis ringan rutin untuk sepeda motor",
                                estimasi_menit: 45,
                                harga: 75000,
                                is_aktif: 1
                            }, null, 4),
                            options: { raw: { language: "json" } }
                        }
                    }
                },
                {
                    name: "PUT Layanan (Admin)",
                    request: {
                        method: "PUT",
                        header: [ { key: "Authorization", value: "Bearer {{token_admin}}" } ],
                        url: "{{baseUrl}}/api/layanan/1",
                        body: {
                            mode: "raw",
                            raw: JSON.stringify({
                                nama_layanan: "Servis Ringan Motor Update",
                                deskripsi: "Deskripsi update",
                                estimasi_menit: 50,
                                harga: 80000,
                                is_aktif: 1
                            }, null, 4),
                            options: { raw: { language: "json" } }
                        }
                    }
                },
                {
                    name: "DELETE Layanan (Admin)",
                    request: {
                        method: "DELETE",
                        header: [ { key: "Authorization", value: "Bearer {{token_admin}}" } ],
                        url: "{{baseUrl}}/api/layanan/1",
                    }
                }
            ]
        },
        {
            name: "2. Kelola Jadwal Operasional",
            item: [
                {
                    name: "GET Jadwal",
                    request: { method: "GET", url: "{{baseUrl}}/api/jadwal" }
                },
                {
                    name: "POST Jadwal (Admin)",
                    request: {
                        method: "POST",
                        header: [ { key: "Authorization", value: "Bearer {{token_admin}}" } ],
                        url: "{{baseUrl}}/api/jadwal",
                        body: {
                            mode: "raw",
                            raw: JSON.stringify({
                                hari: "Senin",
                                jam_buka: "08:00:00",
                                jam_tutup: "17:00:00",
                                kuota_per_slot: 5,
                                is_libur: 0
                            }, null, 4),
                            options: { raw: { language: "json" } }
                        }
                    }
                },
                {
                    name: "PUT Jadwal (Admin)",
                    request: {
                        method: "PUT",
                        header: [ { key: "Authorization", value: "Bearer {{token_admin}}" } ],
                        url: "{{baseUrl}}/api/jadwal/1",
                        body: {
                            mode: "raw",
                            raw: JSON.stringify({
                                jam_buka: "09:00:00",
                                jam_tutup: "16:00:00",
                                kuota_per_slot: 10,
                                is_libur: 0
                            }, null, 4),
                            options: { raw: { language: "json" } }
                        }
                    }
                }
            ]
        },
        {
            name: "3. Kelola Pengguna",
            item: [
                {
                    name: "POST Akun Baru (Admin)",
                    request: {
                        method: "POST",
                        header: [ { key: "Authorization", value: "Bearer {{token_admin}}" } ],
                        url: "{{baseUrl}}/api/auth/users",
                        body: {
                            mode: "raw",
                            raw: JSON.stringify({
                                name: "Ahmad Montir",
                                email: "montir.ahmad@bengkel.com",
                                no_hp: "081234567890",
                                role: "montir",
                                password: "password123"
                            }, null, 4),
                            options: { raw: { language: "json" } }
                        }
                    }
                },
                {
                    name: "PUT Update User (Admin)",
                    request: {
                        method: "PUT",
                        header: [ { key: "Authorization", value: "Bearer {{token_admin}}" } ],
                        url: "{{baseUrl}}/api/auth/users/2",
                        body: {
                            mode: "raw",
                            raw: JSON.stringify({
                                name: "Ahmad Montir Update",
                                email: "montir.ahmad1@bengkel.com",
                                no_hp: "081234567891",
                                role: "montir"
                            }, null, 4),
                            options: { raw: { language: "json" } }
                        }
                    }
                },
                {
                    name: "DELETE User (Admin)",
                    request: {
                        method: "DELETE",
                        header: [ { key: "Authorization", value: "Bearer {{token_admin}}" } ],
                        url: "{{baseUrl}}/api/auth/users/2"
                    }
                }
            ]
        },
        {
            name: "4. Kelola Data Montir",
            item: [
                {
                    name: "GET Montir (List id, nama dari role montir)",
                    request: {
                        method: "GET",
                        header: [ { key: "Authorization", value: "Bearer {{token_admin}}" } ],
                        url: "{{baseUrl}}/api/auth/montir"
                    }
                },
                {
                    name: "GET Users dengan Status Busy (Admin)",
                    request: {
                        method: "GET",
                        header: [ { key: "Authorization", value: "Bearer {{token_admin}}" } ],
                        url: "{{baseUrl}}/api/auth/users"
                    }
                }
            ]
        },
        {
            name: "5. Panggil Antrian (Admin & Montir)",
            item: [
                {
                    name: "PUT Panggil Antrian (Dilindungi adminMiddleware)",
                    request: {
                        method: "PUT",
                        header: [ { key: "Authorization", value: "Bearer {{token_admin}}" } ],
                        url: "{{baseUrl}}/api/antrian/1/panggil",
                        body: {
                            mode: "raw",
                            raw: JSON.stringify({ montir_id: null }, null, 4),
                            options: { raw: { language: "json" } }
                        }
                    }
                },
                {
                    name: "PUT Antrian Dilayani (Admin/Montir)",
                    request: {
                        method: "PUT",
                        header: [ { key: "Authorization", value: "Bearer {{token_montir}}" } ],
                        url: "{{baseUrl}}/api/antrian/1/dilayani"
                    }
                },
                {
                    name: "PUT Antrian Selesai (Admin/Montir)",
                    request: {
                        method: "PUT",
                        header: [ { key: "Authorization", value: "Bearer {{token_montir}}" } ],
                        url: "{{baseUrl}}/api/antrian/1/selesai"
                    }
                }
            ]
        },
        {
            name: "6. Dashboard Montir",
            item: [
                {
                    name: "GET Antrian Montir (Role Montir)",
                    request: {
                        method: "GET",
                        header: [ { key: "Authorization", value: "Bearer {{token_montir}}" } ],
                        url: "{{baseUrl}}/api/antrian"
                    }
                }
            ]
        },
        {
            name: "7. Lihat Laporan Antrian (Admin)",
            item: [
                {
                    name: "GET Laporan API",
                    request: {
                        method: "GET",
                        header: [ { key: "Authorization", value: "Bearer {{token_admin}}" } ],
                        url: "{{baseUrl}}/api/laporan"
                    }
                }
            ]
        },
        {
            name: "8. Lihat Notifikasi",
            item: [
                {
                    name: "GET Notifikasi",
                    request: {
                        method: "GET",
                        header: [ { key: "Authorization", value: "Bearer {{token_pelanggan}}" } ],
                        url: "{{baseUrl}}/api/notifikasi"
                    }
                },
                {
                    name: "PUT Tandai Dibaca (1 Notifikasi)",
                    request: {
                        method: "PUT",
                        header: [ { key: "Authorization", value: "Bearer {{token_pelanggan}}" } ],
                        url: "{{baseUrl}}/api/notifikasi/1/read"
                    }
                },
                {
                    name: "PUT Tandai Semua Dibaca",
                    request: {
                        method: "PUT",
                        header: [ { key: "Authorization", value: "Bearer {{token_pelanggan}}" } ],
                        url: "{{baseUrl}}/api/notifikasi/read-all"
                    }
                }
            ]
        }
    ]
};

fs.writeFileSync('BengkelKu_Testing_API.postman_collection.json', JSON.stringify(collection, null, 2));
console.log('Postman Collection generated successfully.');
