import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/home', '/historico', '/rastreador', '/performance', '/categorias', '/menu', '/objetivos', '/revisao']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!PROTECTED.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value

  if (!token || isExpired(token)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

function isExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1]
    const { exp } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export const config = {
  matcher: ['/home/:path*', '/historico/:path*', '/rastreador/:path*', '/performance/:path*', '/categorias/:path*', '/menu/:path*', '/objetivos/:path*', '/revisao/:path*'],
}
