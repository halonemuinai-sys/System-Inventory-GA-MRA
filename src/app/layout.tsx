'use client';

import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Truck, HardDrive,
  Users, ShieldCheck, FileText, Wrench, BarChart3,
  Settings, LogOut, Bell, ChevronRight, Sun, Moon,
} from 'lucide-react';
import { ThemeProvider, useTheme } from '@/lib/theme';

const menuGroups = [
  {
    label: 'OVERVIEW',
    items: [{ icon: LayoutDashboard, label: 'Dashboard', href: '/' }],
  },
  {
    label: 'ASET & KENDARAAN',
    items: [
      { icon: Package,   label: 'Assets',        href: '/assets' },
      { icon: Truck,     label: 'Vehicles',       href: '/vehicles' },
      { icon: HardDrive, label: 'Device Rental',  href: '/rentals' },
      { icon: Wrench,    label: 'Maintenance',    href: '/maintenance' },
    ],
  },
  {
    label: 'VENDOR & DOKUMEN',
    items: [
      { icon: Users,       label: 'Vendors',   href: '/vendors' },
      { icon: ShieldCheck, label: 'Insurance', href: '/insurance' },
      { icon: FileText,    label: 'Documents', href: '/documents' },
    ],
  },
  {
    label: 'KEUANGAN',
    items: [{ icon: BarChart3, label: 'Expenses', href: '/expenses' }],
  },
];

// ── iOS-style toggle pill ──────────────────────────────────────
function ThemeTogglePill() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="theme-toggle-pill"
    >
      <div className="theme-track">
        <div className="theme-thumb">
          {dark
            ? <Moon size={10} className="text-blue" strokeWidth={2.5} />
            : <Sun  size={10} className="text-amber" strokeWidth={2.5} />
          }
        </div>
      </div>
      <span className="text-sm font-600 text-text-2">
        {dark ? 'Dark Mode' : 'Light Mode'}
      </span>
    </button>
  );
}

// ── Navbar theme icon (compact) ────────────────────────────────
function NavThemeBtn() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="nav-btn-compact"
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

// ── Shell (uses theme) ─────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div>
            <p className="text-sm font-900 letter-tight text-text leading-tight">
              MRA Inventory
            </p>
            <p className="text-xs-bold text-blue mt-0.5">
              General Affairs
            </p>
          </div>
        </div>

        <nav className="sidebar-menu">
          {menuGroups.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="text-xxs-bold px-3.5 py-2.5 pb-1 text-text-3 uppercase letter-wide">
                {group.label}
              </p>
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} className="block no-underline">
                    <div className={`sidebar-item${active ? ' active' : ''}`}>
                      <item.icon size={16} className={`shrink-0 ${active ? 'text-blue' : 'text-text-3'}`} />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight size={13} className="text-blue shrink-0 opacity-60" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <ThemeTogglePill />
          <div className="h-1.5" />
          <div className="sidebar-item">
            <Settings size={15} className="text-text-3 shrink-0" />
            <span>Settings</span>
          </div>
          <div className="sidebar-item text-rose">
            <LogOut size={15} className="shrink-0 text-rose" />
            <span>Logout</span>
          </div>
          <p className="text-xxxs text-text-3 text-center mt-2.5 leading-normal opacity-60">
            © 2026 MRA Group
          </p>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content">
        <nav className="navbar">
          <div className="nav-right">
            <NavThemeBtn />
            <div className="relative cursor-pointer" aria-label="Notifications" title="Notifications">
              <Bell size={17} className="text-text-3" />
              <div className="notif-badge" />
            </div>
            <span className="nav-version">v1.0.0</span>
            <div className="nav-avatar" aria-label="User Avatar">GA</div>
          </div>
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}

// ── Root layout ────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <title>MRA Inventory — General Affairs System</title>
      </head>
      <body>
        <ThemeProvider>
          <Shell>{children}</Shell>
        </ThemeProvider>
      </body>
    </html>
  );
}
