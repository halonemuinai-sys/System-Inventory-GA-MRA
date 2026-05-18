export type UserRole = 'admin' | 'ga' | 'legal' | 'compliance';

export const VALID_ROLES: UserRole[] = ['admin', 'ga', 'legal', 'compliance'];

export function toRole(raw: string | undefined | null): UserRole {
  if (raw && VALID_ROLES.includes(raw as UserRole)) return raw as UserRole;
  return 'ga';
}

// Home redirect per role
export const ROLE_HOME: Record<UserRole, string> = {
  admin:      '/',
  ga:         '/',
  legal:      '/legal/dashboard',
  compliance: '/compliance/dashboard',
};

// Route prefix → roles allowed (undefined = admin + ga only)
export const ROUTE_RULES: { prefix: string; allowed: UserRole[] }[] = [
  { prefix: '/legal',      allowed: ['admin', 'legal'] },
  { prefix: '/compliance', allowed: ['admin', 'compliance'] },
  { prefix: '/settings',   allowed: ['admin', 'ga', 'legal', 'compliance'] },
  { prefix: '/barcode',    allowed: ['admin', 'ga'] },
  { prefix: '/stock-opname', allowed: ['admin', 'ga'] },
  { prefix: '/master-data',  allowed: ['admin', 'ga'] },
  { prefix: '/assets',     allowed: ['admin', 'ga'] },
  { prefix: '/vehicles',   allowed: ['admin', 'ga'] },
  { prefix: '/rentals',    allowed: ['admin', 'ga'] },
  { prefix: '/maintenance',allowed: ['admin', 'ga'] },
  { prefix: '/vendors',    allowed: ['admin', 'ga'] },
  { prefix: '/insurance',  allowed: ['admin', 'ga'] },
  { prefix: '/documents',  allowed: ['admin', 'ga'] },
  { prefix: '/expenses',   allowed: ['admin', 'ga'] },
];

// Sidebar group label → roles that can see it
export const GROUP_ACCESS: Record<string, UserRole[]> = {
  'OVERVIEW':          ['admin', 'ga'],
  'ASET & KENDARAAN':  ['admin', 'ga'],
  'VENDOR & DOKUMEN':  ['admin', 'ga'],
  'KEUANGAN':          ['admin', 'ga'],
  'LEGAL':             ['admin', 'legal'],
  'COMPLIANCE':        ['admin', 'compliance'],
  'TOOLS':             ['admin', 'ga'],
};

export function filterMenuGroups<T extends { label: string }>(
  groups: T[],
  role: UserRole,
): T[] {
  return groups.filter(g => (GROUP_ACCESS[g.label] ?? ['admin']).includes(role));
}

export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .join('')
    .slice(0, 2);
}
