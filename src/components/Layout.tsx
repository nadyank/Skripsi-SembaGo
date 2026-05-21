import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  History,
  TrendingUp,
  LogOut,
  Menu,
  X
} from 'lucide-react';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // TAMBAHAN SIDEBAR DESKTOP
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  // USER LOCAL
  const user = {
    displayName: auth.currentUser?.displayName || 'Admin',
    photoURL: auth.currentUser?.photoURL || '/logo.jpg'
  };

  // FIX LOGOUT
const logout = async () => {
  console.log("logout clicked");

  try {
    await signOut(auth);

    console.log("firebase logout success");

    window.location.href = "/";
  } catch (err) {
    console.error(err);
  }
};

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Stok Barang', path: '/inventory', icon: Package },
    { name: 'Penjualan', path: '/sales', icon: ShoppingCart },
    { name: 'Riwayat', path: '/history', icon: History },
    { name: 'Prediksi', path: '/prediction', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-soft-brown">

      {/* TOMBOL OPEN SIDEBAR */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="hidden md:flex fixed top-4 left-4 z-[9999] bg-maroon text-white p-3 rounded-xl shadow-xl"
        >
          <Menu size={22} />
        </button>
      )}

      {/* Sidebar - Desktop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
            className="hidden md:flex flex-col w-64 bg-maroon text-white shadow-2xl sticky top-0 h-screen border-r-4 border-soft-brown/20 relative"
          >
            <div className="p-6 relative">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all z-50"
              >
                <X size={18} />
              </button>

              <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-2">
                <img
                  src="/logo.jpg"
                  alt="Logo"
                  className="w-15 h-15 rounded-lg object-cover bg-white border border-maroon/20"
                />
                SembaGo
              </h1>

              <p className="text-xs text-soft-brown/70 mt-1">
                Toko SRC Saiful 
              </p>
            </div>

            <nav className="flex-1 mt-6 px-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-soft-brown text-maroon font-bold shadow-lg'
                        : 'hover:bg-soft-brown/10 text-white/80 hover:text-white'
                    }`}
                  >
                    <Icon
                      size={20}
                      className={
                        isActive
                          ? 'text-maroon'
                          : 'group-hover:scale-110 transition-transform'
                      }
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3 px-4 py-3 text-sm text-white/70">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/20">
                  <User size={18} />
                </div>

                <div className="overflow-hidden">
                  <p className="truncate font-medium text-white">
                    {user.displayName}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-3 mt-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <LogOut size={20} />
                Keluar
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Nav */}
      <div className="md:hidden flex items-center justify-between p-4 bg-maroon text-white sticky top-0 z-50 shadow-md border-b border-white/10">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <img
            src="/logo.jpg"
            alt="Logo"
            className="w-8 h-8 rounded-md object-cover bg-white"
          />
          SembaGo
        </h1>

        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed top-16 left-0 right-0 bottom-0 bg-maroon text-white z-40 p-4 shadow-xl border-t border-white/10"
          >
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl ${
                      isActive
                        ? 'bg-soft-brown text-maroon font-bold'
                        : 'text-white/80'
                    }`}
                  >
                    <Icon size={20} />
                    {item.name}
                  </Link>
                );
              })}

              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-4 text-white/80"
              >
                <LogOut size={20} />
                Keluar
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}