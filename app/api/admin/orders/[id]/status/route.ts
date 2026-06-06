// app/api/admin/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus, OrderStatus } from '@/lib/store';
import { verifyAdminToken } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ error: 'Unauthorized credentials' }, { status: 401 });
    }

    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const { status } = await req.json();
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const updatedOrder = updateOrderStatus(decodedId, status as OrderStatus);
    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
