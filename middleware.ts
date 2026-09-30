import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const pass = process.env.APP_PASSWORD
  if (!pass) return NextResponse.next()
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Basic ')) {
    const given = atob(auth.slice(6)).split(':').slice(1).join(':')
    if (given === pass) return NextResponse.next()
  }
  return new NextResponse('Login diperlukan', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Peminjaman"' },
  })
}
