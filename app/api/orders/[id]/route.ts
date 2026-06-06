// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const order = getOrders().find(o => o.id === decodedId);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to find order' }, { status: 500 });
  }
}
