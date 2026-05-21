import { useState, useMemo } from 'react';
import { TrendingUp, Play, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine,
  LineChart,
  Line
} from 'recharts';
const API = import.meta.env.VITE_API_URL;
// =========================
// TYPES
// =========================
interface ForecastItem {
  id_barang: string;
  nama_barang: string;
  stok: number;
  prediksi_mingguan: number;
  restock: number;
}

interface ChartItem {
  index: number;
  actual: number;
  predicted: number;
}

interface FeatureItem {
  feature: string;
  importance: number;
}

export default function Prediction() {
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [featureData, setFeatureData] = useState<FeatureItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // =========================
  // FILTER SEARCH 
  // =========================
  const filteredForecasts = useMemo(() => {
    return forecasts.filter(f =>
      f.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
      f.id_barang.toLowerCase().includes(search.toLowerCase())
    );
  }, [forecasts, search]);

  // =========================
  // SUMMARY
  // =========================
  const summary = {
    needRestock: filteredForecasts.filter(f => f.restock > 0).length,
    safeStock: filteredForecasts.filter(f => f.restock === 0).length,
    totalRestock: filteredForecasts.reduce((sum, f) => sum + f.restock, 0)
  };

  // =========================
  // API CALL
  // =========================
  const runPrediction = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API}/predict-final`);
      const data = await res.json();

      const sorted = data.data.sort(
        (a: ForecastItem, b: ForecastItem) => b.restock - a.restock
      );

      setForecasts(sorted);
      setChartData(data.chart || []);
      setFeatureData(data.feature_importance || []);

    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-maroon">
            Prediksi Restock
          </h1>
          <p className="text-gray-600">
      
          </p>
        </div>
      </header>

      {/* CONTROL */}
      <div className="flex gap-3 items-center">

        <button
          onClick={runPrediction}
          className="bg-maroon text-white px-5 py-2 rounded-xl font-bold hover:scale-105 flex items-center gap-2"
        >
          <Play size={18} />
          Jalankan Prediksi
        </button>

        {/* SEARCH */}
        <div className="flex items-center border rounded-xl px-3 py-2 bg-white">
          <Search size={16} />
          <input
            type="text"
            placeholder="Cari barang..."
            className="ml-2 outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center font-bold text-maroon animate-pulse">
          Menghitung prediksi...
        </div>
      )}

      {/* SUMMARY */}
      {filteredForecasts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-white p-6 rounded-2xl shadow border flex items-center gap-4">
            <AlertTriangle className="text-red-600" />
            <div>
              <p className="text-sm text-gray-500">Perlu Restock</p>
              <h3 className="text-2xl font-bold text-red-600">
                {summary.needRestock}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow border flex items-center gap-4">
            <CheckCircle className="text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Stok Aman</p>
              <h3 className="text-2xl font-bold text-green-600">
                {summary.safeStock}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow border flex items-center gap-4">
            <TrendingUp className="text-maroon" />
            <div>
              <p className="text-sm text-gray-500">Total Restock</p>
              <h3 className="text-2xl font-bold text-maroon">
                {summary.totalRestock}
              </h3>
            </div>
          </div>

        </div>
      )}

      {/* =========================
    GRAFIK RANDOM FOREST
========================= */}
{chartData.length > 0 && (
  <div className="bg-white p-6 rounded-3xl shadow-xl">
    <h2 className="text-xl font-bold text-maroon mb-4">
      Grafik Prediksi Penjualan
    </h2>

    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip />

          {/* Actual */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#800000"
            strokeWidth={3}
            dot={{ r: 4 }}
            name="Actual"
          />

          {/* Predicted */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#16a34a"
            strokeWidth={3}
            dot={{ r: 4 }}
            strokeDasharray="6 6"
            name="Predicted"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
)}

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

        <table className="w-full text-left">

          <thead className="bg-maroon text-white">
            <tr>
              <th className="px-6 py-4 text-xs">ID</th>
              <th className="px-6 py-4 text-xs">Nama</th>
              <th className="px-6 py-4 text-xs text-center">Stok</th>
              <th className="px-6 py-4 text-xs text-center">Prediksi</th>
              <th className="px-6 py-4 text-xs text-right">Restock</th>
            </tr>
          </thead>

          <tbody>
            {filteredForecasts.map((item) => (
              <tr key={item.id_barang} className="border-b hover:bg-gray-50">

                <td className="px-6 py-4 text-gray-400 font-bold">
                  {item.id_barang}
                </td>

                <td className="px-6 py-4 font-bold text-gray-800">
                  {item.nama_barang}
                </td>

                <td className="px-6 py-4 text-center">
                  {item.stok}
                </td>

                <td className="px-6 py-4 text-center text-maroon font-bold">
                  {item.prediksi_mingguan}
                </td>

                <td className="px-6 py-4 text-right">
                  {item.restock > 0 ? (
                    <span className="text-red-600 font-bold">
                      +{item.restock}
                    </span>
                  ) : (
                    <span className="text-green-600 font-bold">
                      Aman
                    </span>
                  )}
                </td>

              </tr>
            ))}
          </tbody>

        </table>

        {filteredForecasts.length === 0 && !loading && (
          <div className="p-10 text-center text-gray-400">
            Data tidak ditemukan
          </div>
        )}
      </div>
    </div>
  );
}