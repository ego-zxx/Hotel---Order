// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '@/lib/store';
import { verifyAdminToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ error: 'Unauthorized credentials' }, { status: 401 });
    }
    
    const orders = getOrders();
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve admin orders' }, { status: 500 });
  }
}
