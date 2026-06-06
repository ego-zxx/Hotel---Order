// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getOrders } from "@/lib/store";
import { verifyAdminToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const orders = await getOrders();
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
