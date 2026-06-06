// app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addCategory } from '@/lib/store';
import { verifyAdminToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ error: 'Unauthorized credentials' }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const newCat = addCategory(name);
    return NextResponse.json(newCat, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
