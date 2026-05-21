export interface Product {
  id: string;
  id_barang: string;
  barcode: string; // kode_barcode
  name: string; // nama_barang
  unit: string; // satuan
  stock: number; // jumlah_stok
  qty_per_renceng: number;
  qty_per_dus: number;
  qty_per_pack: number;
  price_pcs: number;
  price_renceng: number;
  price_dus: number;
  price_pack: number;
  description: string; // keterangan
  updatedAt: any;
}

export interface SaleItem {
  productId: string;
  id_barang: string;
  barcode: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  timestamp: any;
  totalAmount: number;
  items: SaleItem[];
}

export interface PredictionResult {
  productId: string;
  name: string;
  suggestedRestock: number;
  confidence: number;
}
