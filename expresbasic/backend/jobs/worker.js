const { kategoriQueue, produkQueue } = require('../config/middleware/queue'); // [cite: 263]
const Model_Kategori = require('../model/Model_Kategori'); // [cite: 265]
const Model_Produk = require('../model/Model_Produk'); //

kategoriQueue.process(async (job) => {
    // Ambil action dan Data dari job
    const { action, id, Data } = job.data;
    console.log(`Memproses antrian kategori... (ID: ${job.id}, Action: ${action})`); 

    try {
        if (action === 'store') {
            // Memanggil fungsi Store dari model dengan parameter Data
            await Model_Kategori.Store(Data);
            return { message: "Kategori berhasil ditambahkan" };
        } else if (action === 'get') {
            const hasilQuery = await Model_Kategori.getAll();
            return { data: hasilQuery };
        } else if (action === 'update') {
            await Model_Kategori.Update(id, Data);
            return { message: "Kategori berhasil di perbarui" };
        } else if (action === 'delete') {
            await Model_Kategori.Delete(id);
            return { message: "Data berhasil di hapus" };
        }
    } catch (err) {
        console.error("Worker Error:", err);
        throw err; // Penting agar router tahu jika proses gagal
    }
}); 
produkQueue.process(async (job) => {
    const { action, id, Data } = job.data;
    console.log(`Memproses antrian Produk... (ID: ${job.id}, Action: ${action})`); // 

    if (action === 'get') {
        const hasilQuery = await Model_Produk.getAll(); // [cite: 463]
        console.log(`Antrian ID ${job.id} selesai: Data Produk diambil.`); // [cite: 466]
        return { data: hasilQuery };
    } else if (action === 'store') {
        await Model_Produk.Store(Data);
        return { message: "Produk berhasil ditambahkan" };
    } else if (action === 'update') {
        await Model_Produk.Update(id, Data);
        return { message: "Produk berhasil diperbarui" };
    } else if (action === 'delete') {
        await Model_Produk.Delete(id);
        return { message: "Produk berhasil dihapus" };
    }
});
console.log("Worker berjalan dan siap memproses banyak antrian...");