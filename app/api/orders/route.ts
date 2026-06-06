// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { roomNumber, items, notes } = await req.json();

    if (!roomNumber || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "roomNumber and at least one item are required" },
        { status: 400 },
      );
    }

    const order = await createOrder(roomNumber, items, notes || "");
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 },
    );
  }
}
