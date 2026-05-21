import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  login,
  registerEmail,
  loginEmail
} from './lib/firebase';

import Layout from './components/Layout';

import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import History from './pages/History';
import Prediction from './pages/Prediction';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  // FORM
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // =========================
  // LISTENER AUTH
  // =========================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // =========================
  // LOGIN / REGISTER
  // =========================
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        await registerEmail(
          email,
          password,
          name
        );
      } else {
        await loginEmail(
          email,
          password
        );
      }

      setEmail('');
      setPassword('');
      setName('');

    } catch (err: any) {
      setError(
        'Gagal login / daftar: ' +
        err.message
      );
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-soft-brown">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-maroon"></div>
      </div>
    );
  }

  // =========================
  // LOGIN PAGE
  // =========================
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-soft-brown p-4 font-sans text-gray-900">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-4 border-maroon">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img
                src="/logo.jpg"
                alt="SembaGo Logo"
                className="w-20 h-20 rounded-2xl shadow-lg border-2 border-maroon object-cover"
              />
            </div>

            <h1 className="text-3xl font-black text-maroon">
              SembaGo
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              {isRegistering
                ? 'Buat Akun Admin Baru'
                : 'Login Sistem Pengelolaan Stok'}
            </p>
          </div>

          <form
            onSubmit={handleAuth}
            className="space-y-4"
          >
            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-maroon uppercase mb-1">
                  Nama Lengkap
                </label>

                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-maroon outline-none"
                  placeholder="Nama Pemilik"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-maroon uppercase mb-1">
                Email
              </label>

              <input
                required
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-maroon outline-none"
                placeholder="admin@gmail.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-maroon uppercase mb-1">
                Password
              </label>

              <input
                required
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-maroon outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs font-bold text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-maroon text-white py-4 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              {isRegistering
                ? 'Daftar Sekarang'
                : 'Masuk ke Sistem'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>

              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">
                  Atau
                </span>
              </div>
            </div>

            <button
              onClick={login}
              className="w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt=""
                className="w-5 h-5"
              />
              Google Login
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            {isRegistering
              ? 'Sudah punya akun? '
              : 'Belum punya akses? '}

            <button
              onClick={() =>
                setIsRegistering(!isRegistering)
              }
              className="text-maroon font-bold hover:underline"
            >
              {isRegistering
                ? 'Login di sini'
                : 'Daftar Admin'}
            </button>
          </p>

        </div>
      </div>
    );
  }

  // =========================
  // APP
  // =========================
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/history" element={<History />} />
          <Route path="/prediction" element={<Prediction />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}