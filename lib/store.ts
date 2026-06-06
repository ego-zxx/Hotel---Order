// lib/store.ts
import pool from "./db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export type OrderStatus =
  | "Pending"
  | "Accepted"
  | "Preparing"
  | "Out For Delivery"
  | "Delivered"
  | "Cancelled";

export interface Category {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  roomNumber: string;
  items: OrderItem[];
  notes: string;
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

// ─── Categories ───────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, name FROM categories ORDER BY name ASC",
  );
  return rows.map((r) => ({ id: String(r.id), name: r.name }));
}

export async function addCategory(name: string): Promise<Category> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO categories (name) VALUES (?)",
    [name.trim()],
  );
  return { id: String(result.insertId), name: name.trim() };
}

export async function updateCategory(
  id: string,
  name: string,
): Promise<Category | null> {
  // Cascade name change to menu_items
  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT name FROM categories WHERE id = ?",
    [id],
  );
  if (!existing.length) return null;

  const oldName = existing[0].name;
  await pool.query("UPDATE categories SET name = ? WHERE id = ?", [
    name.trim(),
    id,
  ]);
  await pool.query("UPDATE menu_items SET category = ? WHERE category = ?", [
    name.trim(),
    oldName,
  ]);

  return { id, name: name.trim() };
}

export async function deleteCategory(id: string): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM categories WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
}

// ─── Menu Items ───────────────────────────────────────────────

export async function getMenuItems(): Promise<MenuItem[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, description, price, category, available FROM menu_items ORDER BY category, name",
  );
  return rows.map((r) => ({
    id: String(r.id),
    name: r.name,
    description: r.description,
    price: parseFloat(r.price),
    category: r.category,
    available: Boolean(r.available),
  }));
}

export async function addMenuItem(
  item: Omit<MenuItem, "id">,
): Promise<MenuItem> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO menu_items (name, description, price, category, available)
     VALUES (?, ?, ?, ?, ?)`,
    [
      item.name,
      item.description,
      item.price,
      item.category,
      item.available ? 1 : 0,
    ],
  );
  return { ...item, id: String(result.insertId) };
}

export async function updateMenuItem(
  id: string,
  updated: Partial<MenuItem>,
): Promise<MenuItem | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updated.name !== undefined) {
    fields.push("name = ?");
    values.push(updated.name);
  }
  if (updated.description !== undefined) {
    fields.push("description = ?");
    values.push(updated.description);
  }
  if (updated.price !== undefined) {
    fields.push("price = ?");
    values.push(updated.price);
  }
  if (updated.category !== undefined) {
    fields.push("category = ?");
    values.push(updated.category);
  }
  if (updated.available !== undefined) {
    fields.push("available = ?");
    values.push(updated.available ? 1 : 0);
  }

  if (!fields.length) return null;

  values.push(id);
  await pool.query(
    `UPDATE menu_items SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, description, price, category, available FROM menu_items WHERE id = ?",
    [id],
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: String(r.id),
    name: r.name,
    description: r.description,
    price: parseFloat(r.price),
    category: r.category,
    available: Boolean(r.available),
  };
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM menu_items WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
}

// ─── Orders ───────────────────────────────────────────────────

export async function getOrders(): Promise<Order[]> {
  const [orders] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM orders ORDER BY created_at DESC",
  );
  if (!orders.length) return [];

  const orderIds = orders.map((o) => o.id);
  const [items] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM order_items WHERE order_id IN (?)",
    [orderIds],
  );

  return orders.map((o) => ({
    id: String(o.id),
    roomNumber: o.room_number,
    items: (items as RowDataPacket[])
      .filter((i) => i.order_id === o.id)
      .map((i) => ({
        id: String(i.menu_item_id),
        name: i.name,
        price: parseFloat(i.price),
        quantity: i.quantity,
      })),
    notes: o.notes || "",
    subtotal: parseFloat(o.subtotal),
    total: parseFloat(o.total),
    status: o.status as OrderStatus,
    createdAt: new Date(o.created_at).toISOString(),
  }));
}

export async function getOrderById(id: string): Promise<Order | null> {
  const [orders] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM orders WHERE id = ?",
    [id],
  );
  if (!orders.length) return null;

  const o = orders[0];
  const [items] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM order_items WHERE order_id = ?",
    [o.id],
  );

  return {
    id: String(o.id),
    roomNumber: o.room_number,
    items: (items as RowDataPacket[]).map((i) => ({
      id: String(i.menu_item_id),
      name: i.name,
      price: parseFloat(i.price),
      quantity: i.quantity,
    })),
    notes: o.notes || "",
    subtotal: parseFloat(o.subtotal),
    total: parseFloat(o.total),
    status: o.status as OrderStatus,
    createdAt: new Date(o.created_at).toISOString(),
  };
}

export async function createOrder(
  roomNumber: string,
  items: OrderItem[],
  notes: string,
): Promise<Order> {
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const total = subtotal;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO orders (room_number, notes, subtotal, total, status)
       VALUES (?, ?, ?, ?, 'Pending')`,
      [roomNumber, notes, subtotal, total],
    );
    const orderId = result.insertId;

    for (const item of items) {
      await conn.query(
        `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.id, item.name, item.price, item.quantity],
      );
    }

    await conn.commit();

    return {
      id: String(orderId),
      roomNumber,
      items,
      notes,
      subtotal,
      total,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order | null> {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, id],
  );
  if (!result.affectedRows) return null;
  return getOrderById(id);
}
