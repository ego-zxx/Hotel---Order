// app/api/menu/route.ts
import { NextResponse } from 'next/server';
import { getMenuItems } from '@/lib/store';

export async function GET() {
  try {
    const items = getMenuItems();
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}
