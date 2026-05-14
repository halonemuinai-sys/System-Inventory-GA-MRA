'use client';

import './globals.css';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from './login/actions';
import {
  LayoutDashboard, Package, Truck, HardDrive,
  Users, ShieldCheck, FileText, Wrench, BarChart3,
  Settings, LogOut, Bell, ChevronRight, ChevronLeft, Sun, Moon, Barcode, Menu, Database,
  FileSignature, Building2, BadgeCheck, ClipboardList, BookOpen,
  Gavel, UserCheck, Landmark, FlaskConical, AlertTriangle, X,
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
  {
    label: 'LEGAL',
    items: [
      { icon: LayoutDashboard, label: 'Legal Dashboard',     href: '/legal/dashboard'                                    },
      { icon: FileSignature,   label: 'Contract & Agreement', href: '/legal/contracts',   module: 'contract'  },
      { icon: Building2,       label: 'Corporate Legal',      href: '/legal/corporate',   module: 'corporate' },
      { icon: Gavel,           label: 'Litigation & Dispute', href: '/legal/litigation',  module: 'litigation' },
    ],
  },
  {
    label: 'COMPLIANCE',
    items: [
      { icon: LayoutDashboard, label: 'Compliance Dashboard', href: '/compliance/dashboard'                                       },
      { icon: BadgeCheck,      label: 'License & Permit',     href: '/compliance/licenses',   module: 'license'           },
      { icon: ClipboardList,   label: 'Compliance Docs',      href: '/compliance/monitoring', module: 'monitoring'        },
      { icon: BookOpen,        label: 'SOP & Policy',         href: '/compliance/sop',        module: 'sop'               },
      { icon: UserCheck,       label: 'HR & Employment',      href: '/compliance/hr',         module: 'hr_compliance'     },
      { icon: Landmark,        label: 'Tax & Finance',        href: '/compliance/tax',        module: 'tax_finance'       },
      { icon: FlaskConical,    label: 'Product Regulatory',   href: '/compliance/product',    module: 'product_regulatory'},
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { icon: Barcode, label: 'Barcode Generator', href: '/barcode' },
      { icon: ShieldCheck, label: 'Stock Opname', href: '/stock-opname' },
      { icon: Database, label: 'Master Data', href: '/master-data' },
    ],
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

// ── Notification item type ────────────────────────────────────
interface NotifItem {
  id: number;
  module: string;
  doc_name: string;
  category: string;
  expiry_date: string;
  pic: string;
  status: 'Expired' | 'Critical' | 'Warning';
  days_until_expiry: number;
}

const MODULE_LABELS: Record<string, string> = {
  contract: 'Contract', corporate: 'Corporate', litigation: 'Litigation',
  license: 'License', monitoring: 'Compliance', sop: 'SOP',
  hr_compliance: 'HR', tax_finance: 'Tax', product_regulatory: 'Product',
};

function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

// ── Bell notification panel ───────────────────────────────────
function NotifPanel({ items, total, onClose }: { items: NotifItem[]; total: number; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="notif-panel"
    >
      {/* Header */}
      <div className="notif-panel-header">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-blue" />
          <span className="text-xs font-800 text-text">Notifikasi Dokumen</span>
          {total > 0 && (
            <span className="bg-rose text-white text-xxxs font-800 px-1.5 py-0.5 rounded-full">{total}</span>
          )}
        </div>
        <button type="button" onClick={onClose} title="Tutup" className="p-1 rounded-lg hover:bg-surface-2 transition-colors text-text-3 hover:text-text">
          <X size={13} />
        </button>
      </div>

      {/* Body */}
      <div className="notif-panel-body">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <Bell size={20} className="text-emerald-500" />
            </div>
            <p className="text-xs font-600 text-text-2">Semua dokumen dalam kondisi baik</p>
            <p className="text-xxs text-text-3">Tidak ada dokumen kritis atau kadaluarsa</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {items.map((item) => {
              const days = Number(item.days_until_expiry);
              const isExp = days < 0;
              const accent = isExp ? 'var(--rose)' : days <= 7 ? 'var(--rose)' : days <= 30 ? '#f97316' : '#eab308';
              const badgeCls = isExp || days <= 7 ? 'notif-badge-red' : days <= 30 ? 'notif-badge-orange' : 'notif-badge-yellow';
              const dayLabel = isExp ? `${Math.abs(days)}h lalu` : days === 0 ? 'Hari ini' : `${days} hari lagi`;
              return (
                <div key={item.id} className="notif-item" style={{ borderLeftColor: accent }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xxs font-700 text-text-3 uppercase tracking-wide">
                      {MODULE_LABELS[item.module] ?? item.module} · {item.category}
                    </span>
                    <span className={`notif-day-badge ${badgeCls}`}>{dayLabel}</span>
                  </div>
                  <p className="text-xs font-700 text-text leading-snug mb-1 truncate" title={item.doc_name}>{item.doc_name}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xxs text-text-3">PIC: {item.pic}</span>
                    <span className="text-xxs text-text-3">{fmtDate(item.expiry_date)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="notif-panel-footer">
          <Link href="/legal/dashboard" className="notif-footer-link" onClick={onClose}>
            Lihat Legal Dashboard →
          </Link>
          <Link href="/compliance/dashboard" className="notif-footer-link" onClick={onClose}>
            Lihat Compliance Dashboard →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Shell (uses theme) ─────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [isCollapsed, setIsCollapsed]       = useState(false);
  const [alertTotal, setAlertTotal]         = useState(0);
  const [alertByModule, setAlertByModule]   = useState<Record<string, number>>({});
  const [notifItems, setNotifItems]         = useState<NotifItem[]>([]);
  const [notifOpen, setNotifOpen]           = useState(false);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    setSidebarOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  // Fetch legal-docs notification counts + items
  useEffect(() => {
    fetch('/api/legal-docs/notifications')
      .then(r => r.json())
      .then(d => {
        setAlertTotal(d.total || 0);
        setAlertByModule(d.perModule || {});
        setNotifItems(d.items || []);
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <div className="app-container">
      {/* OVERLAY FOR MOBILE */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''} lg:hidden`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Modern Desktop Collapse Toggle */}
        <button 
          className="hidden lg:flex absolute -right-4 top-10 w-8 h-8 bg-surface border border-slate-200 rounded-full items-center justify-center text-slate-500 hover:text-blue hover:border-blue hover:bg-blue-50 shadow-md hover:shadow-lg transition-all z-[300] cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <ChevronLeft size={16} className={`transition-transform duration-500 ease-in-out ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        <div className="sidebar-logo">
          <img 
            src="/logo-mra.png" 
            alt="Logo" 
            className={`${isCollapsed ? 'h-7 w-7' : 'h-8 w-auto'} object-contain transition-all`} 
          />
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <p className="text-sm font-900 letter-tight text-text leading-tight">
                MRA Inventory
              </p>
              <p className="text-xs-bold text-blue mt-0.5">
                Corporate Support
              </p>
            </div>
          )}
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
                  <div key={item.href} className="sidebar-item-wrap">
                    <Link href={item.href} className="block no-underline">
                      <div className={`sidebar-item${active ? ' active' : ''}`}>
                        <item.icon size={16} className={`shrink-0 ${active ? 'text-blue' : 'text-text-3'}`} />
                        <span className="flex-1">{item.label}</span>
                        {!isCollapsed && (item as any).module && alertByModule[(item as any).module] > 0 && (
                          <span className="ml-1 bg-rose text-white text-xxxs font-800 min-w-4 h-4 flex items-center justify-center rounded-full px-1 shrink-0">
                            {alertByModule[(item as any).module] > 99 ? '99+' : alertByModule[(item as any).module]}
                          </span>
                        )}
                        {active && !isCollapsed && <ChevronRight size={13} className="text-blue shrink-0 opacity-60" />}
                      </div>
                    </Link>
                    {isCollapsed && <div className="flyout-label">{item.label}</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <ThemeTogglePill />
          <div className="h-1.5" />
          <div className="sidebar-item-wrap">
            <Link href="/settings/password" className="block no-underline">
              <div className={`sidebar-item${pathname === '/settings/password' ? ' active' : ''}`}>
                <Settings size={15} className={`shrink-0 ${pathname === '/settings/password' ? 'text-blue' : 'text-text-3'}`} />
                <span>Settings</span>
              </div>
            </Link>
            {isCollapsed && <div className="flyout-label">Settings</div>}
          </div>
          <div className="sidebar-item-wrap">
            <button type="button" className="sidebar-item text-rose w-full text-left bg-transparent border-none font-inherit outline-none" onClick={() => logout()}>
              <LogOut size={15} className="shrink-0 text-rose" />
              <span>Logout</span>
            </button>
            {isCollapsed && <div className="flyout-label">Logout</div>}
          </div>
          {!isCollapsed && (
            <p className="text-xxxs text-text-3 text-center mt-2.5 leading-normal opacity-60">
              © 2026 MRA Group
            </p>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div className={`main-content ${isCollapsed ? 'collapsed' : ''}`}>
        <nav className="navbar">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-1.5 -ml-2 text-text-2 hover:bg-surface-2 rounded-md"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Menu"
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="nav-right ml-auto">
            <NavThemeBtn />
            <div className="relative">
              <button
                type="button"
                title={alertTotal > 0 ? `${alertTotal} dokumen perlu perhatian` : 'Notifications'}
                aria-label="Notifications"
                className="relative p-1 rounded-lg hover:bg-surface-2 transition-colors"
                onClick={() => setNotifOpen(o => !o)}
              >
                <Bell size={17} className={alertTotal > 0 ? 'text-rose animate-[bell-ring_1s_ease-in-out_infinite]' : 'text-text-3'} />
                {alertTotal > 0 && <div className="notif-badge" />}
              </button>
              {notifOpen && (
                <NotifPanel
                  items={notifItems}
                  total={alertTotal}
                  onClose={() => setNotifOpen(false)}
                />
              )}
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
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <title>MRA Inventory — Corporate Support System</title>
      </head>
      <body>
        <ThemeProvider>
          {isLoginPage ? children : <Shell>{children}</Shell>}
        </ThemeProvider>
      </body>
    </html>
  );
}
