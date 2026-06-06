// app/api/menu/route.ts
import { NextResponse } from "next/server";
import { getMenuItems } from "@/lib/store";

export async function GET() {
  try {
    const items = await getMenuItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/menu error:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 },
    );
  }
}
