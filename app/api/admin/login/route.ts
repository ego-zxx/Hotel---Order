// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const token = authenticateAdmin(username, password);
    if (!token) {
      return NextResponse.json({ error: 'Invalid administrators credentials' }, { status: 401 });
    }

    return NextResponse.json({ token, message: 'Authentication successful' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed during authenticating' }, { status: 500 });
  }
}
