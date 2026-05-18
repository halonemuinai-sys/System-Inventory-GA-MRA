import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { ROUTE_RULES, ROLE_HOME, toRole } from '@/lib/role';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through: Next internals, API routes, static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Follow Supabase SSR recommended pattern exactly
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Must set on both request AND response so the session propagates
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() is the secure way — never use getSession() in middleware
  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in and not on login page → redirect to login
  if (!user && !pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Already logged in and on login page → redirect to home
  if (user && pathname.startsWith('/login')) {
    const role = toRole(request.cookies.get('user_role')?.value);
    const url  = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role];
    return NextResponse.redirect(url);
  }

  // Check route access by role
  if (user) {
    const role = toRole(request.cookies.get('user_role')?.value);

    const rule = ROUTE_RULES.find(r => pathname.startsWith(r.prefix));
    if (rule && !rule.allowed.includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[role];
      return NextResponse.redirect(url);
    }

    // Root `/` — redirect legal/compliance to their dashboard
    if (pathname === '/' && (role === 'legal' || role === 'compliance')) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[role];
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo-mra.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
