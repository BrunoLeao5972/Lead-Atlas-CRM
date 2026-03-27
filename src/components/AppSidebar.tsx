import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Filter,
  UserCheck,
  Map,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface AppSidebarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/funil', label: 'Funil de Vendas', icon: Filter },
  { path: '/clientes', label: 'Clientes', icon: UserCheck },
  { path: '/mapa', label: 'Mapa', icon: Map },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function AppSidebar({ theme, onToggleTheme }: AppSidebarProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={`
              relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
              transition-colors duration-150
              ${isActive
                ? 'text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent'
              }
            `}
          >
            {isActive && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-lg bg-sidebar-primary/90"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-3">
              <Icon size={18} />
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-card p-2 shadow-md lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={20} className="text-foreground" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-screen w-64 flex-col
          bg-sidebar border-r border-sidebar-border
          transition-transform duration-200
          lg:relative lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Lead Atlas" className="h-12 w-12 object-contain" />
            <span className="text-lg font-bold text-sidebar-accent-foreground tracking-tight">
              Lead Atlas
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded p-1 text-sidebar-muted hover:text-sidebar-foreground lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto pt-2 scrollbar-thin">
          {navContent}
        </div>

        {/* Footer */}
        <div className="border-t border-sidebar-border px-5 py-4">
          <button
            onClick={onToggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground
                       hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </button>
        </div>
      </aside>
    </>
  );
}
