import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/i18n';
import {
  LayoutDashboard, Users, Building2, CalendarDays, AlertTriangle,
  FileText, UserCog, LogOut, Menu, X, Sparkles, Moon, Sun,
  Clock, Star, Wallet, FileBarChart, Languages
} from 'lucide-react';

export default function Layout() {
  const { t, lang, toggleLang } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: t.nav_dashboard, icon: LayoutDashboard, gradient: 'from-emerald-500 to-teal-600' },
    { to: '/employees', label: t.nav_employees, icon: Users, gradient: 'from-blue-500 to-indigo-600' },
    { to: '/departments', label: t.nav_departments, icon: Building2, gradient: 'from-emerald-500 to-teal-600' },
    { to: '/attendance', label: t.nav_attendance, icon: Clock, gradient: 'from-teal-500 to-cyan-600' },
    { to: '/leaves', label: t.nav_leaves, icon: CalendarDays, gradient: 'from-amber-500 to-orange-600' },
    { to: '/performance', label: t.nav_performance, icon: Star, gradient: 'from-fuchsia-500 to-pink-600' },
    { to: '/salaries', label: t.nav_salaries, icon: Wallet, gradient: 'from-green-500 to-emerald-600' },
    { to: '/warnings', label: t.nav_warnings, icon: AlertTriangle, gradient: 'from-rose-500 to-red-600' },
    { to: '/documents', label: t.nav_documents, icon: FileText, gradient: 'from-cyan-500 to-sky-600' },
    { to: '/reports', label: t.nav_reports, icon: FileBarChart, gradient: 'from-indigo-500 to-violet-600' },
    ...(user?.role === 'admin' ? [{ to: '/users', label: t.nav_users, icon: UserCog, gradient: 'from-fuchsia-500 to-pink-600' }] : []),
  ];

  const toggleDark = () => {
    setDark(d => !d);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-screen gradient-mesh flex" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 right-0 z-40">
        <div className="flex-1 flex flex-col m-4 rounded-3xl bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] shadow-2xl overflow-hidden">
          <div className="p-6 flex items-center gap-3 border-b border-white/10">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white leading-tight">{t.appName}</h1>
              <p className="text-xs text-white/50">{t.appTagline}</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-thin">
            {navItems.map((item, i) => (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-l ' + item.gradient + ' text-white shadow-lg'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </NavLink>
              </motion.div>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white/70 hover:bg-rose-500/20 hover:text-rose-300 transition-all duration-300"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">{t.logout}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed inset-y-0 right-0 w-72 z-50 bg-[hsl(var(--sidebar-bg))] flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-base font-extrabold text-white">{t.appName}</h1>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/70">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                        isActive ? 'bg-gradient-to-l ' + item.gradient + ' text-white' : 'text-white/70 hover:bg-white/5'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
              <div className="p-4 border-t border-white/10">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white/70 hover:bg-rose-500/20">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium text-sm">{t.logout}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:mr-72 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass border-b border-border/50">
          <div className="flex items-center justify-between px-5 lg:px-8 py-4">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-muted">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden lg:block">
              <h2 className="text-xl font-extrabold text-gradient">{t.welcomeTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.welcomeSub}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-bold"
                title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
              >
                <Languages className="w-5 h-5" />
                <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
              </button>
              <button onClick={toggleDark} className="p-2.5 rounded-xl hover:bg-muted transition-colors">
                {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30">
                {(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="p-5 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}