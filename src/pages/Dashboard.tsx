import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, ShoppingBag } from 'lucide-react';

export default function Dashboard() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

const API = import.meta.env.VITE_API_URL;

useEffect(() => {
  const fetchSales = async () => {
    try {
      const res = await fetch(`${API}/history`);
      const data = await res.json();

      const withTotal = data.map((item: any) => ({
        ...item,
        total: Number(item.total_harga || 0)
      }));

      setSales(withTotal);

    } catch (error) {
      console.error("Fetch error:", error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  fetchSales();
}, []);

  // =========================
  // CHART DATA (FIXED)
  // =========================
  const getChartData = () => {
    if (!sales.length) return [];

    // 🔥 ambil tanggal terbaru
    const latestDate = new Date(
      Math.max(...sales.map(s => new Date(s.timestamp).getTime()))
    );

    // ================= DAILY =================
    if (viewMode === 'daily') {
      const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

      return days.map((day, index) => {
        const total = sales
          .filter(s => {
            if (!s.timestamp) return false;

            const d = new Date(s.timestamp);

            // 🔥 hanya minggu terbaru
            const sameWeek =
              d.getFullYear() === latestDate.getFullYear() &&
              getWeek(d) === getWeek(latestDate);

            const jsDay = d.getDay();
            const targetDay = index === 6 ? 0 : index + 1;

            return sameWeek && jsDay === targetDay;
          })
          .reduce((sum, s) => sum + s.total, 0);

        return { name: day, total };
      });
    }

    // ================= MONTHLY =================
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

    return months.map((month, index) => {
      const total = sales
        .filter(s => {
          if (!s.timestamp) return false;

          const d = new Date(s.timestamp);

          return (
            d.getFullYear() === latestDate.getFullYear() &&
            d.getMonth() === index
          );
        })
        .reduce((sum, s) => sum + s.total, 0);

      return { name: month, total };
    });
  };

  // =========================
  // TOTAL
  // =========================
  // =========================
  const latestDate = new Date(
    Math.max(
      ...sales.map((s) =>
        new Date(s.timestamp).getTime()
      )
    )
  );

  const sevenDaysAgo = new Date(latestDate);

  sevenDaysAgo.setDate(
    latestDate.getDate() - 6
  );

  const totalRevenue = sales
    .filter((s) => {
      if (!s.timestamp) return false;

      const d = new Date(s.timestamp);

      return (
        d >= sevenDaysAgo &&
        d <= latestDate
      );
    })
    .reduce(
      (sum, s) => sum + s.total,
      0
    );

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-maroon"></div>
        <p className="text-maroon mt-3">Loading data...</p>
      </div>
    );
  }
  const chartData = getChartData();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-extrabold text-maroon">Dashboard</h1>
        <p className="text-gray-600 mt-1">Laporan penjualan terbaru</p>
      </header>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          title="Total Omset" 
          value={`Rp ${totalRevenue.toLocaleString()}`} 
          icon={<TrendingUp className="text-green-600" />} 
          subtitle="Semua transaksi"
        />
        <StatCard 
          title="Total Transaksi" 
          value={sales.length.toString()} 
          icon={<ShoppingBag className="text-blue-600" />} 
          subtitle="Jumlah transaksi"
        />
      </div>

      {/* CHART */}
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-maroon/10">
  <div className="flex justify-between items-center mb-6">
    <div>
      <h2 className="text-2xl font-bold text-maroon">
        Grafik Total Penjualan
      </h2>
    </div>

    <div className="bg-[#f5eee6] p-1 rounded-2xl flex gap-1">
      <button
        onClick={() => setViewMode('daily')}
        className={`px-5 py-2 rounded-xl font-semibold transition ${
          viewMode === 'daily'
            ? 'bg-maroon text-white shadow'
            : 'text-maroon'
        }`}
      >
        Harian
      </button>

      <button
        onClick={() => setViewMode('monthly')}
        className={`px-5 py-2 rounded-xl font-semibold transition ${
          viewMode === 'monthly'
            ? 'bg-maroon text-white shadow'
            : 'text-maroon'
        }`}
      >
        Bulanan
      </button>
    </div>
  </div>

  <ResponsiveContainer width="100%" height={380}>
    <BarChart
      data={chartData}
      margin={{
        top: 10,
        right: 10,
        left: 10,
        bottom: 0
      }}
    >
      <CartesianGrid
        strokeDasharray="4 4"
        vertical={false}
        stroke="#ddd"
      />

      <XAxis
        dataKey="name"
        tick={{ fill: '#666', fontSize: 14 }}
        axisLine={false}
        tickLine={false}
      />

      <YAxis
        tickFormatter={(v) =>
          `Rp ${(v / 1000000).toFixed(0)}jt`
        }
        tick={{ fill: '#666', fontSize: 12 }}
        axisLine={false}
        tickLine={false}
      />

      <Tooltip
        formatter={(v: any) =>
          [`Rp ${Number(v).toLocaleString()}`, 'Omset']
        }
        contentStyle={{
          borderRadius: 16,
          border: 'none',
          boxShadow: '0 8px 30px rgba(0,0,0,.08)'
        }}
      />

      <Bar
        dataKey="total"
        radius={[12, 12, 0, 0]}
        barSize={50}
      >
        {chartData.map((entry, i) => (
          <Cell
            key={i}
            fill={
              entry.total > 0
                ? '#800000'
                : '#e5e5e5'
            }
          />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</div>
    </div>
  );
}

// =========================
// HELPER WEEK
// =========================
function getWeek(date: Date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = (date.getTime() - firstDay.getTime()) / 86400000;
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}

// =========================
// STAT CARD
// =========================
function StatCard({ title, value, icon, subtitle }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow">
      {icon}
      <p>{title}</p>
      <h3 className="text-xl font-bold">{value}</h3>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}