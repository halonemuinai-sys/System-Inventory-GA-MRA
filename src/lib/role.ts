export type UserRole = 'admin' | 'ga' | 'legal' | 'compliance' | 'legal_compliance';

export const VALID_ROLES: UserRole[] = ['admin', 'ga', 'legal', 'compliance', 'legal_compliance'];

export function toRole(raw: string | undefined | null): UserRole {
  if (raw && VALID_ROLES.includes(raw as UserRole)) return raw as UserRole;
  return 'ga';
}

// Home redirect per role
export const ROLE_HOME: Record<UserRole, string> = {
  admin:             '/',
  ga:                '/',
  legal:             '/legal/dashboard',
  compliance:        '/compliance/dashboard',
  legal_compliance:  '/legal/dashboard',
};

// Route prefix → roles allowed
export const ROUTE_RULES: { prefix: string; allowed: UserRole[] }[] = [
  { prefix: '/settings/users', allowed: ['admin'] },
  { prefix: '/legal',          allowed: ['admin', 'legal', 'legal_compliance'] },
  { prefix: '/compliance',     allowed: ['admin', 'compliance', 'legal_compliance'] },
  { prefix: '/settings',       allowed: ['admin', 'ga', 'legal', 'compliance', 'legal_compliance'] },
  { prefix: '/barcode',        allowed: ['admin', 'ga'] },
  { prefix: '/stock-opname',   allowed: ['admin', 'ga'] },
  { prefix: '/master-data',    allowed: ['admin', 'ga'] },
  { prefix: '/assets',         allowed: ['admin', 'ga'] },
  { prefix: '/vehicles',       allowed: ['admin', 'ga'] },
  { prefix: '/rentals',        allowed: ['admin', 'ga'] },
  { prefix: '/maintenance',    allowed: ['admin', 'ga'] },
  { prefix: '/vendors',        allowed: ['admin', 'ga'] },
  { prefix: '/insurance',      allowed: ['admin', 'ga'] },
  { prefix: '/documents',      allowed: ['admin', 'ga'] },
  { prefix: '/expenses',       allowed: ['admin', 'ga'] },
];

// Sidebar group label → roles that can see it
export const GROUP_ACCESS: Record<string, UserRole[]> = {
  'OVERVIEW':          ['admin', 'ga'],
  'ASET & KENDARAAN':  ['admin', 'ga'],
  'VENDOR & DOKUMEN':  ['admin', 'ga'],
  'KEUANGAN':          ['admin', 'ga'],
  'LEGAL':             ['admin', 'legal', 'legal_compliance'],
  'COMPLIANCE':        ['admin', 'compliance', 'legal_compliance'],
  'TOOLS':             ['admin', 'ga'],
  'ADMIN':             ['admin'],
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
