import { useEffect, useState } from 'react';

import { Product, SaleItem } from '../types';

import Scanner from '../components/Scanner';

import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Camera,
  CheckCircle2
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
const API = import.meta.env.VITE_API_URL;
export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [showScanner, setShowScanner] = useState(true);
  const [finished, setFinished] = useState(false);

  // =========================
// FETCH PRODUCTS
// =========================
useEffect(() => {

  const fetchProducts = async () => {

    try {

      const res = await fetch(
        `${API}/products`
      );

      const data = await res.json();

      setProducts(data);

    } catch (error) {

      console.error(
        'Gagal fetch products:',
        error
      );

    }
  };

  fetchProducts();

}, []);

  // =========================
  // AUTO SCAN (BARCODE DEVICE)
  // =========================
  useEffect(() => {
    let barcode = '';
    let timeout: any;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (timeout) clearTimeout(timeout);

      if (e.key === 'Enter') {

  const cleanBarcode = barcode
    .replace(/\D/g, '')
    .replace(/^0+/, '');

  if (cleanBarcode.length > 3) {
    onScan(cleanBarcode);
  }

  barcode = '';

} else {

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
  // SCAN HANDLER
  // =========================
  const onScan = (code: string) => {

  // =========================
  // CLEAN SCAN
  // =========================
  const cleanCode = String(code)
    .trim()
    .replace(/\D/g, '')
    .replace(/^0+/, '');

  // =========================
  // FIND PRODUCT
  // =========================
  const product = products.find((p) => {

    const productBarcode = String(p.barcode)
      .trim()
      .replace(/\D/g, '')
      .replace(/^0+/, '');

    return productBarcode === cleanCode;
  });

  // =========================
  // FOUND
  // =========================
  if (product) {

    addToCart(product);

  } else {

    alert(
      `Produk dengan barcode ${cleanCode} tidak ditemukan.`
    );

  }
};

  // =========================
  // CART LOGIC
  // =========================
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          id_barang: product.id_barang || '',
          barcode: product.barcode,
          name: product.name,
          quantity: 1,
          price: product.price_pcs || 0
        }
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // =========================
  // CHECKOUT
  // =========================
 const handleCheckout = async () => {

  // =========================
  // VALIDASI KERANJANG
  // =========================
  if (cart.length === 0) return;

  try {

    // =========================
    // FORMAT DATA
    // =========================
    const salesData = {
      total_amount: total,
      items: cart.map(item => ({
        product_id: item.productId,
        id_barang: item.id_barang,
        barcode: item.barcode,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    };

    // =========================
    // KIRIM KE BACKEND
    // =========================
    const res = await fetch(
      `${API}/sales`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(salesData)
      }
    );

    const result = await res.json();

    // =========================
    // VALIDASI RESPONSE
    // =========================
    if (result.status !== 'success') {

      alert(
        result.message || 'Transaksi gagal'
      );

      return;
    }

    // =========================
    // REFRESH PRODUCTS
    // =========================
    const productsRes = await fetch(
      `${API}/products`
    );

    const productsData = await productsRes.json();

    setProducts(productsData);

    // =========================
    // SUCCESS
    // =========================
    setFinished(true);

    setCart([]);

    setTimeout(() => {
      setFinished(false);
    }, 3000);

  } catch (error) {

    console.error(error);

    alert('Gagal checkout');

  }
};

  // =========================
  // UI 
  // =========================
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      <div className="space-y-6">
        <header>
          <h1 className="text-4xl font-extrabold text-maroon tracking-tight">Transaksi Penjualan</h1>
          <p className="text-gray-600"></p>
        </header>

        <div className="bg-white p-4 rounded-3xl shadow-lg border border-maroon/10">
          <button 
            onClick={() => setShowScanner(!showScanner)}
            className="w-full mb-4 bg-soft-brown text-maroon py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-soft-brown/80"
          >
            <Camera size={20} />
            {showScanner ? 'Tutup Scanner' : 'Buka Scanner'}
          </button>

          <AnimatePresence>
            {showScanner && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <Scanner onScan={onScan} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CART */}
      <div className="bg-white rounded-3xl shadow-2xl flex flex-col border-4 border-maroon/10 overflow-hidden lg:h-[calc(100vh-140px)]">
        <div className="p-6 bg-maroon text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart size={24} />
            <h2 className="text-xl font-bold">Keranjang</h2>
          </div>
          <span className="bg-white text-maroon px-3 py-1 rounded-full text-xs font-bold">
            {cart.length} Baris
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
              <ShoppingCart size={64} className="mb-4" />
              <p className="font-medium">Belum ada barang</p>
            </div>
          ) : (
            cart.map(item => (
              <motion.div key={item.productId} className="flex items-center justify-between p-4 bg-soft-brown/20 rounded-2xl border border-soft-brown">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-maroon truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">Rp {item.price.toLocaleString()} / item</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateQuantity(item.productId, -1)}><Minus size={16} /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)}><Plus size={16} /></button>
                  <button onClick={() => removeItem(item.productId)}><Trash2 size={18} /></button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t">
          <div className="flex justify-between mb-4">
            <p>Total</p>
            <p className="text-2xl font-bold">Rp {total.toLocaleString()}</p>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full bg-maroon text-white py-3 rounded-xl"
          >
            Bayar Sekarang
          </button>
        </div>
      </div>

      {finished && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/80">
          <div className="bg-maroon text-white p-10 rounded-full text-center">
            <CheckCircle2 size={80} />
            <h2>Berhasil</h2>
          </div>
        </div>
      )}
    </div>
  );
}