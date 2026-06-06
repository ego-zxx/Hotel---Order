// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateMenuItem, deleteMenuItem } from '@/lib/store';
import { verifyAdminToken } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ error: 'Unauthorized credentials' }, { status: 401 });
    }

    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const body = await req.json();

    const updated = updateMenuItem(decodedId, {
      ...body,
      price: body.price !== undefined ? Number(body.price) : undefined
    });

    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ error: 'Unauthorized credentials' }, { status: 401 });
    }

    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const success = deleteMenuItem(decodedId);

    if (!success) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
