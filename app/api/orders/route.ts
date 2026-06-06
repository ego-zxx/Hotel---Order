// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const { roomNumber, items, notes } = await req.json();
    
    if (!roomNumber) {
      return NextResponse.json({ error: 'Room number is required' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Ordered items are required' }, { status: 400 });
    }

    const newOrder = createOrder(roomNumber, items, notes || '');
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
