import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ReceiptText } from 'lucide-react';

type HistoryItem = {
  id: number;
  timestamp: string;
  id_barang: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
};

export default function History() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // TAMBAHAN FILTER BULAN
  // =========================
  const [selectedMonth, setSelectedMonth] = useState('');

  // =========================
  // FETCH + CACHE
  // =========================
  const fetchSales = async () => {
    try {
      const cached = localStorage.getItem('history_data');

      if (cached) {
        setSales(JSON.parse(cached));
      }

      const res = await fetch(
        'http://127.0.0.1:8000/history'
      );

      const data: HistoryItem[] = await res.json();

      const grouped = data.map((item) => ({
        id: item.id,
        timestamp: item.timestamp,
        items: [
          {
            id_barang: item.id_barang,
            barcode: item.barcode,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          },
        ],
      }));

      setSales(grouped);

      localStorage.setItem(
        'history_data',
        JSON.stringify(grouped)
      );

    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
    }
  };

  // PINDAH KE SINI
  useEffect(() => {
    fetchSales();

    const interval = setInterval(() => {
      localStorage.removeItem('history_data');
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // =========================
  // FILTER BULAN
  // =========================
  const availableMonths = [
    ...new Set(
      sales
        .filter((sale) => sale.timestamp)
        .map((sale) => {
          const d = new Date(sale.timestamp);

          return `${d.getFullYear()}-${String(
            d.getMonth() + 1
          ).padStart(2, '0')}`;
        })
    ),
  ].sort((a, b) => b.localeCompare(a));

  useEffect(() => {
    if (availableMonths.length > 0) {
      setSelectedMonth((prev) =>
        prev && availableMonths.includes(prev)
          ? prev
          : availableMonths[0]
      );
    }
  }, [availableMonths]);

  const currentMonthIndex = Math.max(
    0,
    availableMonths.indexOf(selectedMonth)
  );

  console.log('months =', availableMonths);
  console.log('selected =', selectedMonth);

  // =========================
  // FILTER BULAN + 7 HARI TERAKHIR
  // =========================
  const filteredSales = (() => {
  if (!selectedMonth) return [];

  // =========================
  // FILTER BULAN
  // =========================
  const monthSales = sales.filter((sale) => {
    if (!sale.timestamp) return false;

    const d = new Date(
      String(sale.timestamp).replace(' ', 'T')
    );

    const saleMonth =
      `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, '0')}`;

    return saleMonth === selectedMonth;
  });

  if (monthSales.length === 0) return [];

  // =========================
  // TANGGAL TERBARU BULAN ITU
  // =========================
  const latestTime = Math.max(
    ...monthSales.map((sale) =>
      new Date(
        String(sale.timestamp).replace(' ', 'T')
      ).getTime()
    )
  );

  const latestDate = new Date(latestTime);

  // =========================
  // 7 HARI TERAKHIR
  // =========================
  const sevenDaysAgo = new Date(latestDate);

  sevenDaysAgo.setHours(0, 0, 0, 0);

  sevenDaysAgo.setDate(
    latestDate.getDate() - 6
  );

  // =========================
  // FILTER FINAL
  // =========================
  return monthSales.filter((sale) => {
    const d = new Date(
      String(sale.timestamp).replace(' ', 'T')
    );

    return (
      d.getTime() >= sevenDaysAgo.getTime() &&
      d.getTime() <= latestDate.getTime()
    );
  });
})();

  // =========================
  // TOTAL FILTERED
  // =========================
  const totalPenjualan =
    filteredSales.reduce(
      (total, sale) => {
        const subtotal =
          sale.items.reduce(
            (
              sum: number,
              item: any
            ) =>
              sum +
              item.price *
                item.quantity,
            0
          );

        return total + subtotal;
      },
      0
    );

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-maroon"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header>
        <h1 className="text-4xl font-extrabold text-maroon">
          Riwayat Penjualan
        </h1>

        <p className="text-gray-600">
        </p>
      </header>

      {/* TOTAL + FILTER BULAN */}
      <div className="bg-maroon text-white p-6 rounded-2xl shadow-lg flex justify-between items-center gap-6">
        <div>
          <p className="text-sm opacity-80">
            Total Penjualan
          </p>

          <h2 className="text-3xl font-extrabold">
            Rp{' '}
            {totalPenjualan.toLocaleString()}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={
              currentMonthIndex ===
              availableMonths.length -
                1
            }
            onClick={() =>
              setSelectedMonth(
                availableMonths[
                  currentMonthIndex +
                    1
                ]
              )
            }
            className="px-4 py-2 bg-white/20 rounded-lg disabled:opacity-30"
          >
            ←
          </button>

          <div className="font-bold min-w-[170px] text-center capitalize">
            {selectedMonth
              ? format(
                  new Date(
                    selectedMonth +
                      '-01'
                  ),
                  'MMMM yyyy',
                  {
                    locale: id,
                  }
                )
              : '-'}
          </div>

          <button
            disabled={
              currentMonthIndex ===
              0
            }
            onClick={() =>
              setSelectedMonth(
                availableMonths[
                  currentMonthIndex -
                    1
                ]
              )
            }
            className="px-4 py-2 bg-white/20 rounded-lg disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-maroon/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-maroon text-white">
              <tr>
                <th className="px-6 py-4 text-xs">
                  Tanggal
                </th>
                <th className="px-6 py-4 text-xs">
                  ID Brg
                </th>
                <th className="px-6 py-4 text-xs">
                  Barcode
                </th>
                <th className="px-6 py-4 text-xs">
                  Nama
                </th>
                <th className="px-6 py-4 text-xs">
                  Harga
                </th>
                <th className="px-6 py-4 text-xs">
                  Qty
                </th>
                <th className="px-6 py-4 text-xs text-right">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSales.flatMap(
                (sale) =>
                  sale.items.map(
                    (
                      item: any,
                      idx: number
                    ) => (
                      <tr
                        key={`${sale.id}-${idx}`}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-xs">
                          {sale.timestamp
                            ? format(
                                new Date(
                                  sale.timestamp
                                ),
                                'dd/MM/yyyy HH:mm',
                                {
                                  locale:
                                    id,
                                }
                              )
                            : '-'}
                        </td>

                        <td className="px-6 py-4 font-bold text-gray-400">
                          {
                            item.id_barang
                          }
                        </td>

                        <td className="px-6 py-4 font-mono text-xs">
                          {item.barcode ||
                            '-'}
                        </td>

                        <td className="px-6 py-4 font-bold">
                          {item.name}
                        </td>

                        <td className="px-6 py-4">
                          Rp{' '}
                          {item.price.toLocaleString()}
                        </td>

                        <td className="px-6 py-4 text-center font-black">
                          {
                            item.quantity
                          }
                        </td>

                        <td className="px-6 py-4 text-right font-bold text-maroon">
                          Rp{' '}
                          {(
                            item.price *
                            item.quantity
                          ).toLocaleString()}
                        </td>
                      </tr>
                    )
                  )
              )}
            </tbody>
          </table>

          {/* EMPTY */}
          {filteredSales.length ===
            0 && (
            <div className="p-20 text-center text-gray-400">
              <ReceiptText
                size={48}
                className="mx-auto mb-4 opacity-20"
              />

              <p>
                Belum ada
                riwayat
                transaksi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}