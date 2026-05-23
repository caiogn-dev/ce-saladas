import { NextResponse } from 'next/server';

export function middleware(request) {
  const host = request.headers.get('host') || '';
  const domain = host.split(':')[0];

  // Propagar domínio como header de request para getInitialProps em ctx.req.headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-store-domain', domain);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff2?)).*)'],
};
