// app/admin/page.tsx
"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3,
  Briefcase,
  Utensils,
  Plus,
  Edit,
  Trash2,
  ListOrdered,
  LogOut,
  Sliders,
  DollarSign,
  Clock,
  CheckCircle,
  RefreshCw,
  X,
  Check,
  Power,
  Layers,
} from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  roomNumber: string;
  items: OrderItem[];
  notes: string;
  subtotal: number;
  total: number;
  status:
    | "Pending"
    | "Accepted"
    | "Preparing"
    | "Out For Delivery"
    | "Delivered"
    | "Cancelled";
  createdAt: string;
}

export default function AdminDashboardApp() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // ── Navigation ────────────────────────────────────────────────────────────
  const [selectedTab, setSelectedTab] = useState<
    "dashboard" | "orders" | "menu" | "categories" | "analytics"
  >("dashboard");

  // ── Data ──────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);

  // ── UI State ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Product Modal ─────────────────────────────────────────────────────────
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productFormType, setProductFormType] = useState<"create" | "edit">(
    "create",
  );
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    available: true,
  });

  // ── Category Modal ────────────────────────────────────────────────────────
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryFormType, setCategoryFormType] = useState<"create" | "edit">(
    "create",
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [categoryNameInput, setCategoryNameInput] = useState("");

  const [detailedOrder, setDetailedOrder] = useState<Order | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const triggerSuccessAlert = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // ── Fetch Data ────────────────────────────────────────────────────────────
  const fetchAdminData = async (activeToken: string) => {
    setLoading(true);
    setErrorMsg(null);
    const headers = { Authorization: `Bearer ${activeToken}` };
    try {
      const [ordRes, catRes, prodRes] = await Promise.all([
        fetch("/api/admin/orders", { headers }),
        fetch("/api/categories"),
        fetch("/api/menu"),
      ]);
      if (ordRes.ok && catRes.ok && prodRes.ok) {
        setOrders(await ordRes.json());
        setCategories(await catRes.json());
        setProducts(await prodRes.json());
      } else {
        if (ordRes.status === 401) {
          localStorage.removeItem("admin_auth_token");
          setToken(null);
          setAuthError("Session expired. Please log in again.");
        } else {
          setErrorMsg("Failed to sync database entities correctly.");
        }
      }
    } catch {
      setErrorMsg("Network timeout during data synchronization.");
    } finally {
      setLoading(false);
    }
  };

  // ── Hydration: read localStorage only on client ───────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem("admin_auth_token");
    setToken(savedToken);
    setHydrated(true);
    if (savedToken) {
      fetchAdminData(savedToken);
    }
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        localStorage.setItem("admin_auth_token", data.token);
        triggerSuccessAlert("Administrative access granted");
        fetchAdminData(data.token);
      } else {
        const data = await res.json();
        setAuthError(data.error || "Invalid credentials. Please try again.");
      }
    } catch {
      setAuthError("Connection failure while validating credentials.");
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      localStorage.removeItem("admin_auth_token");
      setToken(null);
      setOrders([]);
      setCategories([]);
      setProducts([]);
      triggerSuccessAlert("Signed out successfully");
    }
  };

  // ── Order Status ──────────────────────────────────────────────────────────
  const updateOrderStatusAction = async (orderId: string, status: string) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );
      if (res.ok) {
        const updatedOrd = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? updatedOrd : o)),
        );
        if (detailedOrder?.id === orderId) setDetailedOrder(updatedOrd);
        triggerSuccessAlert(`Order ${orderId} updated to ${status}`);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Failure to execute status change.");
      }
    } catch {
      setErrorMsg("Network error updating status.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Product CRUD ──────────────────────────────────────────────────────────
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);
    try {
      const isEdit = productFormType === "edit";
      const url = isEdit
        ? `/api/admin/products/${encodeURIComponent(selectedProductId || "")}`
        : `/api/admin/products`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productForm),
      });
      if (res.ok) {
        const savedItem = await res.json();
        if (isEdit) {
          setProducts((prev) =>
            prev.map((p) => (p.id === selectedProductId ? savedItem : p)),
          );
          triggerSuccessAlert(`"${savedItem.name}" modified`);
        } else {
          setProducts((prev) => [...prev, savedItem]);
          triggerSuccessAlert(`"${savedItem.name}" created successfully`);
        }
        setProductModalOpen(false);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to submit product.");
      }
    } catch {
      setErrorMsg("Network error submitting product data.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!token || !window.confirm("Delete this food item permanently?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(prodId)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== prodId));
        triggerSuccessAlert("Food item removed successfully");
      } else {
        setErrorMsg("Failed to delete item.");
      }
    } catch {
      setErrorMsg("Network error deleting item.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Category CRUD ─────────────────────────────────────────────────────────
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !categoryNameInput.trim()) return;
    setActionLoading(true);
    try {
      const isEdit = categoryFormType === "edit";
      const url = isEdit
        ? `/api/admin/categories/${encodeURIComponent(selectedCategoryId || "")}`
        : `/api/admin/categories`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: categoryNameInput.trim() }),
      });
      if (res.ok) {
        const saved = await res.json();
        if (isEdit) {
          setCategories((prev) =>
            prev.map((c) => (c.id === selectedCategoryId ? saved : c)),
          );
          triggerSuccessAlert(`Category modified to "${saved.name}"`);
        } else {
          setCategories((prev) => [...prev, saved]);
          triggerSuccessAlert(`Category "${saved.name}" created`);
        }
        setCategoryModalOpen(false);
        setCategoryNameInput("");
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to submit category.");
      }
    } catch {
      setErrorMsg("Network error submitting category.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (
      !token ||
      !window.confirm("Delete this category? Items will need re-assignment.")
    )
      return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/categories/${encodeURIComponent(catId)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== catId));
        triggerSuccessAlert("Category deleted successfully");
      } else {
        setErrorMsg("Failed to erase category.");
      }
    } catch {
      setErrorMsg("Network error deleting category.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Modal Openers ─────────────────────────────────────────────────────────
  const openProductModal = (type: "create" | "edit", item?: MenuItem) => {
    setProductFormType(type);
    if (type === "edit" && item) {
      setSelectedProductId(item.id);
      setProductForm({
        name: item.name,
        description: item.description,
        price: String(item.price),
        category: item.category,
        available: item.available,
      });
    } else {
      setSelectedProductId(null);
      setProductForm({
        name: "",
        description: "",
        price: "",
        category: categories[0]?.name || "",
        available: true,
      });
    }
    setProductModalOpen(true);
  };

  const openCategoryModal = (type: "create" | "edit", cat?: Category) => {
    setCategoryFormType(type);
    if (type === "edit" && cat) {
      setSelectedCategoryId(cat.id);
      setCategoryNameInput(cat.name);
    } else {
      setSelectedCategoryId(null);
      setCategoryNameInput("");
    }
    setCategoryModalOpen(true);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== "Cancelled");
    return {
      total: orders.length,
      revenue: validOrders.reduce((acc, o) => acc + o.total, 0),
      pending: orders.filter((o) => o.status === "Pending").length,
      delivered: orders.filter((o) => o.status === "Delivered").length,
    };
  }, [orders]);

  // ── Analytics ─────────────────────────────────────────────────────────────
  const analyticsData = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    const categoryRev: Record<string, number> = {};
    categories.forEach((c) => {
      categoryCounts[c.name] = 0;
      categoryRev[c.name] = 0;
    });

    orders.forEach((o) => {
      if (o.status === "Cancelled") return;
      o.items.forEach((itm) => {
        const prod = products.find(
          (p) => p.id === itm.id || p.name === itm.name,
        );
        const cat = prod ? prod.category : "Other";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + itm.quantity;
        categoryRev[cat] = (categoryRev[cat] || 0) + itm.price * itm.quantity;
      });
    });

    const categorySummary = Object.entries(categoryCounts).map(
      ([name, count]) => ({
        name,
        count,
        revenue: categoryRev[name] || 0,
      }),
    );

    const itemSales: Record<
      string,
      { name: string; qty: number; rev: number }
    > = {};
    orders.forEach((o) => {
      if (o.status === "Cancelled") return;
      o.items.forEach((itm) => {
        if (!itemSales[itm.name])
          itemSales[itm.name] = { name: itm.name, qty: 0, rev: 0 };
        itemSales[itm.name].qty += itm.quantity;
        itemSales[itm.name].rev += itm.price * itm.quantity;
      });
    });
    const productsOrderedSorted = Object.values(itemSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const dailySalesMap: Record<string, number> = {};
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((d) => {
      dailySalesMap[d] = 0;
    });
    orders.forEach((o) => {
      try {
        const dayName = new Date(o.createdAt).toLocaleDateString("en-US", {
          weekday: "short",
        });
        dailySalesMap[dayName] = (dailySalesMap[dayName] || 0) + o.total;
      } catch {}
    });
    const weekSales = Object.entries(dailySalesMap).map(([day, revenue]) => ({
      day,
      revenue,
    }));

    return { categorySummary, productsOrderedSorted, weekSales };
  }, [orders, categories, products]);

  // ── Status badge helper ───────────────────────────────────────────────────
  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Accepted":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "Preparing":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "Out For Delivery":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "Delivered":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }
  };

  // ── Hydration guard ───────────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700" />
          <div className="text-center mb-8">
            <span className="p-3 bg-slate-800 border border-slate-700 rounded-2xl inline-flex justify-center items-center mb-4 text-indigo-500">
              <Briefcase className="w-8 h-8" />
            </span>
            <h1 className="font-sans text-xl font-bold tracking-tight text-white">
              L&apos;Atelier Backoffice
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">
              Management Command Deck
            </p>
          </div>

          {authError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl mb-6">
              {authError}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-4 text-xs font-semibold"
          >
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-bold">
                Backoffice Login
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Username (e.g., admin)"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600/20 text-slate-200 outline-none transition-all font-medium"
                required
                id="admin-username-input"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-bold">
                Administrative Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600/20 text-slate-200 outline-none transition-all font-medium"
                required
                id="admin-password-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-4"
              id="admin-login-submit"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Access Command Center</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <Link
              href="/"
              className="text-slate-500 hover:text-slate-300 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              &larr; Return to Guest View
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold text-xs uppercase"
          >
            <Check size={13} className="stroke-[3]" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 shrink-0 flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-800/80">
            <span className="p-2.5 bg-indigo-600 text-white rounded-xl">
              <Briefcase size={18} />
            </span>
            <div>
              <h1 className="font-sans text-sm font-bold text-white">
                Backoffice Desk
              </h1>
              <span className="text-[9px] tracking-widest text-indigo-400 font-bold uppercase">
                Command Deck
              </span>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            {[
              { id: "dashboard", name: "Dashboard Home", icon: Sliders },
              { id: "orders", name: "Active Orders", icon: ListOrdered },
              { id: "menu", name: "Menu Master", icon: Utensils },
              { id: "categories", name: "Categories Admin", icon: Layers },
              { id: "analytics", name: "Visual Analytics", icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedTab(tab.id as typeof selectedTab);
                    setErrorMsg(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all cursor-pointer ${isActive ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"}`}
                  id={`tab-${tab.id}`}
                >
                  <Icon size={15} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white text-sm">
              A
            </div>
            <div className="text-[10px]">
              <p className="font-bold text-slate-200">Executive Chef</p>
              <button
                onClick={() => token && fetchAdminData(token)}
                className="text-indigo-400 flex items-center gap-1 hover:underline text-[9px] cursor-pointer"
              >
                <RefreshCw
                  size={8}
                  className="animate-spin"
                  style={{ animationDuration: "6s" }}
                />
                <span>Synchronize</span>
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="flex-1 py-1.5 px-3 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
              id="view-guest-from-admin-btn"
            >
              Guest View
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 bg-rose-950/25 text-rose-400 border border-rose-900/20 hover:bg-rose-900/40 rounded-lg transition-colors cursor-pointer"
              id="admin-logout-btn"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-x-hidden">
        {actionLoading && (
          <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white rounded-xl px-4 py-2.5 shadow-md flex items-center gap-2 text-xs font-bold uppercase">
            <RefreshCw size={12} className="animate-spin" />
            <span>Fulfilling transaction...</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center justify-between">
            <p className="font-semibold">{errorMsg}</p>
            <button
              onClick={() => setErrorMsg(null)}
              className="font-bold underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── DASHBOARD ── */}
          {selectedTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div>
                <h2 className="font-sans text-2xl font-bold tracking-tight text-white">
                  Backoffice Overview
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Realtime room dining operations and metrics.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: "Total Orders",
                    value: stats.total,
                    icon: ListOrdered,
                    color: "text-indigo-400 bg-indigo-500/10",
                  },
                  {
                    title: "Revenue",
                    value: `Rs.${stats.revenue.toFixed(2)}`,
                    icon: DollarSign,
                    color: "text-emerald-400 bg-emerald-500/10",
                  },
                  {
                    title: "Pending Orders",
                    value: stats.pending,
                    icon: Clock,
                    color: "text-amber-400 bg-amber-400/10",
                  },
                  {
                    title: "Delivered",
                    value: stats.delivered,
                    icon: CheckCircle,
                    color: "text-sky-400 bg-sky-400/10",
                  },
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between"
                    >
                      <div className="space-y-1.5">
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                          {stat.title}
                        </p>
                        <p className="font-sans text-2xl font-bold text-white">
                          {stat.value}
                        </p>
                      </div>
                      <span className={`p-3 rounded-xl ${stat.color}`}>
                        <Icon size={18} />
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                  <h3 className="font-sans text-sm font-bold text-white">
                    Active Suite Orders
                  </h3>
                  <button
                    onClick={() => setSelectedTab("orders")}
                    className="text-xs text-indigo-400 hover:underline font-bold cursor-pointer"
                  >
                    Manage Full Log &rarr;
                  </button>
                </div>
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    No active orders yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800/60 uppercase tracking-widest text-[9px]">
                          <th className="py-3 px-4">Order ID</th>
                          <th className="py-3 px-4">Room</th>
                          <th className="py-3 px-4">Time</th>
                          <th className="py-3 px-4">Items</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {orders.slice(0, 5).map((o) => (
                          <tr
                            key={o.id}
                            className="hover:bg-slate-800/20 text-slate-300"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                              {o.id}
                            </td>
                            <td className="py-3 px-4 font-bold">
                              Suite {o.roomNumber}
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              {new Date(o.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                              {o.items
                                .map((i) => `${i.quantity}x ${i.name}`)
                                .join(", ")}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${statusBadgeClass(o.status)}`}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold">
                              Rs.{o.total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── ORDERS ── */}
          {selectedTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-sans text-2xl font-bold tracking-tight text-white">
                    Fulfillment Queue
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Accept, monitor and dispatch food packages.
                  </p>
                </div>
                <button
                  onClick={() => token && fetchAdminData(token)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-slate-200"
                >
                  <RefreshCw size={12} />
                  <span>Synchronize</span>
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
                  <ListOrdered className="mx-auto w-12 h-12 text-slate-500" />
                  <h3 className="mt-4 font-sans text-sm font-bold text-slate-300">
                    Queue Empty
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Ready for incoming room orders.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-4"
                      id={`admin-order-${o.id}`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-800/80 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400 bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-md">
                              {o.id}
                            </span>
                            <span className="font-sans text-base font-bold text-white">
                              Suite Room {o.roomNumber}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {new Date(o.createdAt).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${statusBadgeClass(o.status)}`}
                          >
                            {o.status}
                          </span>
                          <span className="text-lg font-bold text-white">
                            Rs.{o.total.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">
                            Gourmet Selections
                          </p>
                          <div className="space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                            {o.items.map((itm, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-slate-300"
                              >
                                <span>
                                  {itm.quantity}x {itm.name}
                                </span>
                                <span className="font-bold">
                                  Rs.{itm.price.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            Culinary Directives
                          </p>
                          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 min-h-[50px] text-slate-400 italic">
                            {o.notes
                              ? `"${o.notes}"`
                              : "No special instructions."}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 justify-end">
                        {o.status === "Pending" && (
                          <button
                            onClick={() =>
                              updateOrderStatusAction(o.id, "Accepted")
                            }
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase cursor-pointer"
                          >
                            Accept Order
                          </button>
                        )}
                        {o.status === "Accepted" && (
                          <button
                            onClick={() =>
                              updateOrderStatusAction(o.id, "Preparing")
                            }
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase cursor-pointer"
                          >
                            Mark Preparing
                          </button>
                        )}
                        {o.status === "Preparing" && (
                          <button
                            onClick={() =>
                              updateOrderStatusAction(o.id, "Out For Delivery")
                            }
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase cursor-pointer"
                          >
                            Mark Dispatch
                          </button>
                        )}
                        {o.status === "Out For Delivery" && (
                          <button
                            onClick={() =>
                              updateOrderStatusAction(o.id, "Delivered")
                            }
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase cursor-pointer"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {o.status !== "Delivered" &&
                          o.status !== "Cancelled" && (
                            <button
                              onClick={() =>
                                updateOrderStatusAction(o.id, "Cancelled")
                              }
                              className="border border-rose-900/40 hover:bg-rose-950/20 text-rose-400 font-bold px-3 py-2 rounded-xl text-xs uppercase cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── MENU ── */}
          {selectedTab === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-sans text-2xl font-bold tracking-tight text-white">
                    Culinary Catalog
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Add, edit and manage available suite recipes.
                  </p>
                </div>
                <button
                  onClick={() => openProductModal("create")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase flex items-center gap-1 cursor-pointer transition-all"
                  id="admin-add-product-btn"
                >
                  <Plus size={13} className="stroke-[3]" />
                  <span>Add Item</span>
                </button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
                  <Utensils className="mx-auto w-12 h-12 text-slate-500" />
                  <h3 className="mt-4 font-sans text-sm font-bold text-slate-300">
                    Catalog Empty
                  </h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 hover:border-slate-700 transition-colors"
                      id={`admin-product-${item.id}`}
                    >
                      <div className="flex-1 flex flex-col justify-between font-medium">
                        <div>
                          <div className="flex justify-between gap-1 items-start">
                            <h4 className="font-sans text-sm font-bold text-slate-100">
                              {item.name}
                            </h4>
                            <span className="text-xs font-bold text-indigo-400 shrink-0">
                              Rs.{item.price.toFixed(2)}
                            </span>
                          </div>
                          <span className="text-[9px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full inline-block mt-1 font-bold uppercase">
                            {item.category}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <button
                            onClick={async () => {
                              setActionLoading(true);
                              try {
                                const nextState = !item.available;
                                const res = await fetch(
                                  `/api/admin/products/${encodeURIComponent(item.id)}`,
                                  {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                      available: nextState,
                                    }),
                                  },
                                );
                                if (res.ok) {
                                  setProducts((prev) =>
                                    prev.map((p) =>
                                      p.id === item.id
                                        ? { ...p, available: nextState }
                                        : p,
                                    ),
                                  );
                                  triggerSuccessAlert(
                                    `"${item.name}" is now ${nextState ? "Available" : "Unavailable"}`,
                                  );
                                }
                              } finally {
                                setActionLoading(false);
                              }
                            }}
                            className={`text-[9px] font-bold border px-2.5 py-1 rounded-lg flex items-center gap-1 uppercase cursor-pointer ${item.available ? "border-emerald-900 bg-emerald-950/20 text-emerald-400" : "border-rose-900 bg-rose-950/20 text-rose-400"}`}
                            id={`toggle-availability-${item.id}`}
                          >
                            <Power size={10} />
                            <span>
                              {item.available ? "Available" : "Unavailable"}
                            </span>
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openProductModal("edit", item)}
                              className="p-1 px-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                              id={`edit-product-${item.id}`}
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(item.id)}
                              className="p-1 px-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg cursor-pointer"
                              id={`delete-product-${item.id}`}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── CATEGORIES ── */}
          {selectedTab === "categories" && (
            <motion.div
              key="categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-sans text-2xl font-bold tracking-tight text-white">
                    Category Management
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Classify your hotel culinary crafts logically.
                  </p>
                </div>
                <button
                  onClick={() => openCategoryModal("create")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase flex items-center gap-1 cursor-pointer transition-all"
                  id="admin-add-category-btn"
                >
                  <Plus size={13} className="stroke-[3]" />
                  <span>New Category</span>
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
                  <Layers className="mx-auto w-12 h-12 text-slate-500" />
                  <h3 className="mt-4 font-sans text-sm font-bold text-slate-300">
                    No categories loaded
                  </h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => {
                    const itemCount = products.filter(
                      (p) => p.category === cat.name,
                    ).length;
                    return (
                      <div
                        key={cat.id}
                        className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-colors"
                        id={`category-${cat.id}`}
                      >
                        <div className="space-y-1">
                          <h4 className="font-sans text-base font-bold text-slate-100">
                            {cat.name}
                          </h4>
                          <p className="text-[10px] text-indigo-400 font-bold uppercase">
                            {itemCount} Selections
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openCategoryModal("edit", cat)}
                            className="p-1 px-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                            id={`edit-category-${cat.id}`}
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 px-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/20 cursor-pointer"
                            id={`delete-category-${cat.id}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── ANALYTICS ── */}
          {selectedTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div>
                <h2 className="font-sans text-2xl font-bold tracking-tight text-white">
                  Visual Operations Analytics
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Metric streams and statistical distribution charts.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Line Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-4">
                  <h3 className="font-sans text-sm font-bold text-white">
                    Weekly Revenue Trend
                  </h3>
                  <div className="h-64 w-full relative pt-2">
                    <svg className="w-full h-full" viewBox="0 0 500 220">
                      <line
                        x1="30"
                        y1="30"
                        x2="480"
                        y2="30"
                        stroke="#1e293b"
                        strokeDasharray="3"
                      />
                      <line
                        x1="30"
                        y1="80"
                        x2="480"
                        y2="80"
                        stroke="#1e293b"
                        strokeDasharray="3"
                      />
                      <line
                        x1="30"
                        y1="130"
                        x2="480"
                        y2="130"
                        stroke="#1e293b"
                        strokeDasharray="3"
                      />
                      <line
                        x1="30"
                        y1="180"
                        x2="480"
                        y2="180"
                        stroke="#1e293b"
                      />
                      {(() => {
                        const maxVal = Math.max(
                          ...analyticsData.weekSales.map((d) => d.revenue),
                          100,
                        );
                        const points = analyticsData.weekSales.map(
                          (d, idx) => ({
                            x: 30 + idx * 75,
                            y: 180 - (d.revenue / maxVal) * 130,
                            label: d.day,
                            val: d.revenue,
                          }),
                        );
                        const pathD =
                          points.length > 0
                            ? `M ${points[0].x} ${points[0].y} ` +
                              points
                                .slice(1)
                                .map((p) => `L ${p.x} ${p.y}`)
                                .join(" ")
                            : "";
                        const fillD =
                          points.length > 0
                            ? `${pathD} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`
                            : "";
                        return (
                          <>
                            <defs>
                              <linearGradient
                                id="indigo-grad"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop offset="0%" stopColor="#4f46e5" />
                                <stop
                                  offset="100%"
                                  stopColor="#4f46e5"
                                  stopOpacity="0"
                                />
                              </linearGradient>
                            </defs>
                            {fillD && (
                              <path
                                d={fillD}
                                fill="url(#indigo-grad)"
                                opacity="0.12"
                              />
                            )}
                            {pathD && (
                              <path
                                d={pathD}
                                fill="none"
                                stroke="#6366f1"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                            {points.map((p, idx) => (
                              <g key={idx}>
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r="4.5"
                                  className="fill-indigo-500 stroke-slate-900 stroke-2"
                                />
                                <text
                                  x={p.x}
                                  y={p.y - 10}
                                  textAnchor="middle"
                                  className="fill-indigo-400 font-mono font-bold text-[9px]"
                                >
                                  Rs.{p.val.toFixed(0)}
                                </text>
                                <text
                                  x={p.x}
                                  y="198"
                                  textAnchor="middle"
                                  className="fill-slate-500 font-sans text-[10px] font-semibold"
                                >
                                  {p.label}
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>

                {/* Category Bars */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="font-sans text-sm font-bold text-white">
                    Revenue by Category
                  </h3>
                  <div className="space-y-4">
                    {analyticsData.categorySummary.map((cat, idx) => {
                      const maxRev = Math.max(
                        ...analyticsData.categorySummary.map((c) => c.revenue),
                        1,
                      );
                      return (
                        <div
                          key={idx}
                          className="space-y-1 text-xs font-semibold"
                        >
                          <div className="flex justify-between text-slate-300">
                            <span>{cat.name}</span>
                            <span className="font-mono text-indigo-400">
                              Rs.{cat.revenue.toFixed(0)}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000"
                              style={{
                                width: `${Math.max((cat.revenue / maxRev) * 100, 3)}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Items Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-3 space-y-4">
                  <h3 className="font-sans text-sm font-bold text-white">
                    Signature Dish Sales Ranking
                  </h3>
                  {analyticsData.productsOrderedSorted.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No order data yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-semibold">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-800/80 uppercase tracking-widest text-[9px]">
                            <th className="py-2.5 px-2">Dish</th>
                            <th className="py-2.5 px-2 text-center">
                              Qty Ordered
                            </th>
                            <th className="py-2.5 px-2 text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {analyticsData.productsOrderedSorted.map(
                            (item, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-slate-800/10 text-slate-300"
                              >
                                <td className="py-3 px-2 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] text-indigo-400 font-mono font-bold">
                                    {idx + 1}
                                  </span>
                                  <span className="font-bold">{item.name}</span>
                                </td>
                                <td className="py-3 px-2 text-center text-slate-400 font-mono">
                                  {item.qty} portions
                                </td>
                                <td className="py-3 px-2 text-right text-indigo-400 font-bold">
                                  Rs.{item.rev.toFixed(2)}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {productModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-sans text-lg font-bold text-white">
                  {productFormType === "create" ? "Add New Item" : "Edit Item"}
                </h3>
                <button
                  onClick={() => setProductModalOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <form
                onSubmit={handleProductSubmit}
                className="space-y-4 text-xs font-semibold"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                      Dish Name
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      placeholder="e.g. Saffron Sea Bass"
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-indigo-500 font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                      Price (Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          price: e.target.value,
                        })
                      }
                      placeholder="e.g. 24.50"
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-indigo-500 font-medium"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                    Category
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-indigo-500 font-medium"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                    Description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the dish..."
                    className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-indigo-500 h-20 resize-none font-medium"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase cursor-pointer"
                  >
                    {actionLoading ? "Saving..." : "Save Dish"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {categoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-sans text-lg font-bold text-white">
                  {categoryFormType === "create"
                    ? "New Category"
                    : "Rename Category"}
                </h3>
                <button
                  onClick={() => setCategoryModalOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <form
                onSubmit={handleCategorySubmit}
                className="space-y-4 text-xs font-semibold"
              >
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={categoryNameInput}
                    onChange={(e) => setCategoryNameInput(e.target.value)}
                    placeholder="e.g. Sparkling Wines"
                    className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-indigo-500 font-medium"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase cursor-pointer"
                  >
                    {actionLoading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
