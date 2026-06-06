// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addMenuItem } from '@/lib/store';
import { verifyAdminToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ error: 'Unauthorized credentials' }, { status: 401 });
    }

    const { name, description, price, category, image, available } = await req.json();

    if (!name || !description || price === undefined || !category) {
      return NextResponse.json({ error: 'Name, description, price, and category are required' }, { status: 400 });
    }

    const item = addMenuItem({
      name,
      description,
      price: Number(price),
      category,
      image: image || 'https://picsum.photos/seed/placeholder/600/400',
      available: available !== undefined ? Boolean(available) : true
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
