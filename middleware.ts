import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { ROUTE_RULES, ROLE_HOME, toRole } from '@/lib/role';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through: static assets, Next internals, API routes, login page
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/login') ||
    pathname.includes('.') // static files (favicon, images, etc.)
  ) {
    return NextResponse.next();
  }

  // Create a response to potentially mutate cookies
  const response = NextResponse.next();

  // Verify Supabase session (reads from httpOnly cookie set by SSR package)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Not authenticated → redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Read role from cookie (set during login)
  const role = toRole(request.cookies.get('user_role')?.value);

  // Check if current route is allowed for this role
  const rule = ROUTE_RULES.find(r => pathname.startsWith(r.prefix));
  if (rule && !rule.allowed.includes(role)) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  // Root `/` — redirect legal/compliance to their home dashboard
  if (pathname === '/' && (role === 'legal' || role === 'compliance')) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo-mra.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
