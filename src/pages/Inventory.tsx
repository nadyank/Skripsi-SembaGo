import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, Camera, X } from 'lucide-react';
import Scanner from '../components/Scanner';
import { motion, AnimatePresence } from 'motion/react';

type Product = {
  id: number;
  id_barang: string;
  barcode: string;
  name: string;
  unit: string;
  stock: number;
  qty_per_renceng: number;
  qty_per_dus: number;
  qty_per_pack: number;
  price_pcs: number;
  price_renceng: number;
  price_dus: number;
  price_pack: number;
  description: string;
};

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);

  // =========================
  // FETCH
  // =========================
  const fetchProducts = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // =========================
  // AUTO SCAN BARCODE (DEVICE)
  // =========================
  useEffect(() => {
    let barcode = '';
    let timeout: any;

    const handleKeyDown = (e: KeyboardEvent) => {

  if (timeout) clearTimeout(timeout);

  // scanner selesai
  if (e.key === 'Enter') {

    const cleanBarcode = barcode
      .replace(/\D/g, '') // hanya angka
      .replace(/^0+/, ''); // hapus 0 depan

    console.log(cleanBarcode);

    if (cleanBarcode.length > 3) {
      handleScan(cleanBarcode);
    }

    barcode = '';

  } else {

    // hanya simpan angka
    if (/^\d$/.test(e.key)) {
      barcode += e.key;
    }

  }

  timeout = setTimeout(() => {
    barcode = '';
  }, 100);
};

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [products]);

  // =========================
  // HANDLE SCAN
  // =========================
 // =========================
// HANDLE SCAN
// =========================
const handleScan = async (code: string) => {

  // =========================
  // BERSIHKAN BARCODE SCAN
  // =========================
  const cleanCode = String(code)
    .trim()
    .replace(/\D/g, '') // hanya angka
    .replace(/^0+/, ''); // hapus 0 depan

  console.log('SCAN BERSIH =', cleanCode);

  setSearch(cleanCode);

  // =========================
  // CARI PRODUK
  // =========================
  const found = products.find((p) => {

    const productBarcode = String(p.barcode)
      .trim()
      .replace(/\D/g, '')
      .replace(/^0+/, '');

    const productId = String(p.id_barang)
      .trim()
      .replace(/\D/g, '')
      .replace(/^0+/, '');

    return (
      productBarcode === cleanCode ||
      productId === cleanCode
    );
  });

  // =========================
  // JIKA TIDAK DITEMUKAN
  // =========================
  if (!found) {
    alert(
      `Produk dengan barcode ${cleanCode} tidak ditemukan`
    );
    return;
  }

  // =========================
  // CEK STOK
  // =========================
  if (found.stock <= 0) {
    alert("Stok habis");
    return;
  }

  try {

    // =========================
    // KIRIM KE SALES
    // =========================
    const res = await fetch(
      "http://127.0.0.1:8000/sales",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          total_amount: found.price_pcs,

          items: [
            {
              product_id: found.id,
              id_barang: found.id_barang,
              barcode: found.barcode,
              name: found.name,
              quantity: 1,
              price: found.price_pcs
            }
          ]
        })
      }
    );

    if (!res.ok) {
      throw new Error("Gagal scan");
    }

    // =========================
    // REFRESH DATA
    // =========================
    await fetchProducts();

    // =========================
    // NOTIFIKASI
    // =========================
    alert(
      `✔ ${found.name}\nStok berkurang 1`
    );

  } catch (err) {

    console.error(err);
    alert("Gagal transaksi");

  }
};

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id: number) => {

  if (!confirm("Hapus produk ini?")) return;

  try {

    const res = await fetch(
      `http://127.0.0.1:8000/products/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!res.ok) {
      throw new Error("Gagal hapus");
    }

    // refresh tabel otomatis
    await fetchProducts();

    alert("Produk berhasil dihapus");

  } catch (err) {

    console.error(err);
    alert("Gagal menghapus produk");

  }
};

  // =========================
  // FILTER
  // =========================
  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search) ||
    p.id_barang?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-maroon tracking-tight">
            Stok Barang
          </h1>
          <p className="text-gray-600"></p>
        </div>

        <button
          onClick={() => {
            setCurrentProduct({
              barcode: '',
              name: '',
              unit: 'pcs',
              stock: 0,
              qty_per_renceng: 0,
              qty_per_dus: 0,
              qty_per_pack: 0,
              price_pcs: 0,
              price_renceng: 0,
              price_dus: 0,
              price_pack: 0,
              description: ''
            });
            setShowModal(true);
          }}
          className="bg-maroon text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus size={20} />
          Tambah Barang
        </button>
      </header>


      {/* SEARCH */}
      <div className="flex gap-4">
        <input
          className="w-full p-3 border rounded-xl"
          placeholder="Cari barcode / ID / Nama..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          onClick={() => setShowScanner(!showScanner)}
          className="px-4 py-2 border rounded-xl"
        >
          <Camera />
        </button>
      </div>

      {/* SCANNER CAMERA (optional tetap ada) */}
      {showScanner && (
        <div className="bg-white p-4 rounded-xl">
          <Scanner onScan={handleScan} />
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-maroon/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-maroon text-white shrink-0">
              <tr>
                <th className="px-4 py-4">ID / Barcode</th>
                <th className="px-4 py-4">Nama Barang</th>
                <th className="px-4 py-4">Satuan / Stok</th>
                <th className="px-4 py-4">Qty Detail</th>
                <th className="px-4 py-4">Harga</th>
                <th className="px-4 py-4">Ket</th>
                <th className="px-4 py-4 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4">
                    <p className="font-bold text-gray-400">{item.id_barang}</p>
                    <p className="font-mono">{item.barcode}</p>
                  </td>

                  <td className="px-4 py-4 font-bold">
                    {item.name}
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-bold text-maroon">{item.unit}</p>
                    <p>Stok: {item.stock}</p>
                  </td>

                  <td className="px-4 py-4">
                    R:{item.qty_per_renceng}<br />
                    D:{item.qty_per_dus}<br />
                    P:{item.qty_per_pack}
                  </td>

                  <td className="px-4 py-4">
                    Pcs:{item.price_pcs}<br />
                    Ren:{item.price_renceng}<br />
                    Dus:{item.price_dus}
                  </td>

                  <td className="px-4 py-4">
                    {item.description}
                  </td>

                  <td className="px-4 py-4 text-right flex gap-2 justify-end">
                    <button onClick={() => {
                      setCurrentProduct(item);
                      setShowModal(true);
                    }}>
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
{/* MODAL */}
<AnimatePresence>
  {showModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white p-6 rounded-2xl w-full max-w-[600px] shadow-2xl"
      >

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-maroon">
            Edit Barang
          </h2>

          <button
            onClick={() => setShowModal(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <div className="space-y-4">

          <input
            type="text"
            placeholder="ID Barang"
            className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-maroon"
            value={currentProduct?.id_barang || ''}
            onChange={(e) =>
              setCurrentProduct({
                ...currentProduct,
                id_barang: e.target.value
              })
            }
          />

          <input
            type="text"
            placeholder="Barcode"
            className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-maroon"
            value={currentProduct?.barcode || ''}
            onChange={(e) =>
              setCurrentProduct({
                ...currentProduct,
                barcode: e.target.value
              })
            }
          />

          <input
            type="text"
            placeholder="Nama Barang"
            className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-maroon"
            value={currentProduct?.name || ''}
            onChange={(e) =>
              setCurrentProduct({
                ...currentProduct,
                name: e.target.value
              })
            }
          />

          <div className="grid grid-cols-2 gap-4">

            <input
              type="number"
              placeholder="Stok"
              className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-maroon"
              value={currentProduct?.stock || 0}
              onChange={(e) =>
                setCurrentProduct({
                  ...currentProduct,
                  stock: Number(e.target.value)
                })
              }
            />

            <input
              type="number"
              placeholder="Harga PCS"
              className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-maroon"
              value={currentProduct?.price_pcs || 0}
              onChange={(e) =>
                setCurrentProduct({
                  ...currentProduct,
                  price_pcs: Number(e.target.value)
                })
              }
            />

          </div>

          {/* BUTTON */}
          <div className="flex justify-end gap-3 pt-4">

            <button
              onClick={() => setShowModal(false)}
              className="px-5 py-2 border rounded-xl hover:bg-gray-100"
            >
              Batal
            </button>

            <button
  onClick={async () => {
    try {

      // =========================
      // CEK TAMBAH / EDIT
      // =========================
      const isEdit = currentProduct?.id;

      const url = isEdit
        ? `http://127.0.0.1:8000/products/${currentProduct.id}`
        : `http://127.0.0.1:8000/products`;

      const method = isEdit ? 'PUT' : 'POST';


      // VALIDASI FORM
      if (
        !currentProduct?.id_barang?.trim() ||
        !currentProduct?.barcode?.trim() ||
        !currentProduct?.name?.trim()
      ) {
        alert("Semua field harus diisi!");
        return;
      }

      // =========================
      // REQUEST API
      // =========================
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentProduct),
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan data');
      }

      // =========================
      // REFRESH TABLE
      // =========================
      await fetchProducts();

      // tutup modal
      setShowModal(false);

      // reset form
      setCurrentProduct(null);

      alert(
        isEdit
          ? 'Produk berhasil diperbarui'
          : 'Produk berhasil ditambahkan'
      );

    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan produk');
    }
  }}
  className="bg-maroon text-white px-5 py-2 rounded-xl hover:opacity-90"
>
  Simpan Perubahan
</button>

          </div>
        </div>

      </motion.div>
    </div>
  )}
</AnimatePresence>

    </div>
  );
}