'use client';

import './globals.css';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from './login/actions';
import {
  LayoutDashboard, Package, Truck, HardDrive,
  Users, ShieldCheck, FileText, Wrench, BarChart3,
  Settings, LogOut, Bell, ChevronRight, ChevronLeft, Sun, Moon, Barcode, Menu, Database,
  FileSignature, Building2, BadgeCheck, ClipboardList, BookOpen,
  Gavel, UserCheck, Landmark, FlaskConical,
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

// ── Shell (uses theme) ─────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [isCollapsed, setIsCollapsed]       = useState(false);
  const [alertTotal, setAlertTotal]     = useState(0);
  const [alertByModule, setAlertByModule] = useState<Record<string, number>>({});

  // Close sidebar when navigating on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Fetch legal-docs notification counts
  useEffect(() => {
    fetch('/api/legal-docs/notifications')
      .then(r => r.json())
      .then(d => {
        setAlertTotal(d.total || 0);
        setAlertByModule(d.perModule || {});
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
                General Affairs
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
                  <Link key={item.href} href={item.href} className="block no-underline">
                    <div className={`sidebar-item${active ? ' active' : ''}`} title={isCollapsed ? item.label : ''}>
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
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <ThemeTogglePill />
          <div className="h-1.5" />
          <Link href="/settings/password" className="block no-underline">
            <div className={`sidebar-item${pathname === '/settings/password' ? ' active' : ''}`} title={isCollapsed ? 'Settings' : ''}>
              <Settings size={15} className={`shrink-0 ${pathname === '/settings/password' ? 'text-blue' : 'text-text-3'}`} />
              <span>Settings</span>
            </div>
          </Link>
          <button className="sidebar-item text-rose w-full text-left bg-transparent border-none font-inherit outline-none" title={isCollapsed ? 'Logout' : ''} onClick={() => logout()}>
            <LogOut size={15} className="shrink-0 text-rose" />
            <span>Logout</span>
          </button>
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
            <div
              className="relative cursor-pointer"
              aria-label="Notifications"
              title={alertTotal > 0 ? `${alertTotal} dokumen perlu perhatian` : 'Notifications'}
              onClick={() => router.push('/compliance/licenses')}
            >
              <Bell size={17} className={alertTotal > 0 ? 'text-rose' : 'text-text-3'} />
              {alertTotal > 0 && <div className="notif-badge" />}
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
        <title>MRA Inventory — General Affairs System</title>
      </head>
      <body>
        <ThemeProvider>
          {isLoginPage ? children : <Shell>{children}</Shell>}
        </ThemeProvider>
      </body>
    </html>
  );
}
