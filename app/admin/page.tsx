// app/admin/page.tsx
"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Briefcase,
  Utensils,
  Plus,
  Edit,
  Trash2,
  ListOrdered,
  Eye,
  LogOut,
  Sliders,
  DollarSign,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  ListCollapse,
  AlertTriangle,
  FolderPlus,
  RefreshCw,
  X,
  FileSpreadsheet,
  Check,
  Power,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Core Schema Types matching lib/store.ts
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
  // Authentication State
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_auth_token");
    }
    return null;
  });
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab View
  const [selectedTab, setSelectedTab] = useState<
    "dashboard" | "orders" | "menu" | "categories" | "analytics"
  >("dashboard");

  // Shared Admin Core State
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);

  // Modals & UI Controls
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("admin_auth_token");
    }
    return false;
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // CRUD Product Modal State
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

  // CRUD Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryFormType, setCategoryFormType] = useState<"create" | "edit">(
    "create",
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [categoryNameInput, setCategoryNameInput] = useState("");

  // Selected order details focus (Admin View Modal)
  const [detailedOrder, setDetailedOrder] = useState<Order | null>(null);

  // Set Success notification helper
  const triggerSuccessAlert = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // REST: Fetch Admin Protected Data
  const fetchAdminData = async (activeToken: string) => {
    setLoading(true);
    setErrorMsg(null);
    const headers = { Authorization: `Bearer ${activeToken}` };

    try {
      const [ordRes, catRes, prodRes] = await Promise.all([
        fetch("/api/admin/orders", { headers }),
        fetch("/api/categories"), // public endpt is fine
        fetch("/api/menu"), // public endpt is fine
      ]);

      if (ordRes.ok && catRes.ok && prodRes.ok) {
        const orderData = await ordRes.json();
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        setOrders(orderData);
        setCategories(catData);
        setProducts(prodData);
      } else {
        if (ordRes.status === 401) {
          // Token expired, clear auth
          localStorage.removeItem("admin_auth_token");
          setToken(null);
          setAuthError("Session expired. Please log in again.");
        } else {
          setErrorMsg("Failed to sync database entities correctly.");
        }
      }
    } catch (err) {
      setErrorMsg("Network timeout during data synchronization.");
    } finally {
      setLoading(false);
    }
  };

  // Load Auth Token & Hydrate from LocalStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("admin_auth_token");
    if (savedToken) {
      fetchAdminData(savedToken);
    }
  }, []);

  // REST: Admin login
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
        setAuthError(
          data.error || "Invalid credentials mapping. Please try again.",
        );
      }
    } catch (err) {
      setAuthError("Connection failure while validating credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Clear Session Data
  const handleLogout = () => {
    if (
      window.confirm(
        "Are you sure you want to sign out of the administrator command deck?",
      )
    ) {
      localStorage.removeItem("admin_auth_token");
      setToken(null);
      setOrders([]);
      setCategories([]);
      setProducts([]);
      triggerSuccessAlert("Signed out successfully");
    }
  };

  // REST: Modify Order Status
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
        // Update local state orders list
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? updatedOrd : o)),
        );

        // Also update modal focus order
        if (detailedOrder?.id === orderId) {
          setDetailedOrder(updatedOrd);
        }

        triggerSuccessAlert(`Order ${orderId} updated to ${status}`);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Failure to execute status change.");
      }
    } catch (err) {
      setErrorMsg("Network error updating status.");
    } finally {
      setActionLoading(false);
    }
  };

  // CRUD REST: Products - Add / Edit Action
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);

    try {
      const isEdit = productFormType === "edit";
      const url = isEdit
        ? `/api/admin/products/${encodeURIComponent(selectedProductId || "")}`
        : `/api/admin/products`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
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
          triggerSuccessAlert(
            `MenuItem &quot;${savedItem.name}&quot; modified`,
          );
        } else {
          setProducts((prev) => [...prev, savedItem]);
          triggerSuccessAlert(
            `Product &quot;${savedItem.name}&quot; created successfully`,
          );
        }
        setProductModalOpen(false);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to submit product.");
      }
    } catch (err) {
      setErrorMsg("Network error submitting product data.");
    } finally {
      setActionLoading(false);
    }
  };

  // CRUD REST: Products - Delete
  const handleDeleteProduct = async (prodId: string) => {
    if (
      !token ||
      !window.confirm("Delete this food item permanently from the database?")
    )
      return;
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
    } catch (err) {
      setErrorMsg("Network error deleting item.");
    } finally {
      setActionLoading(false);
    }
  };

  // CRUD REST: Categories - Add / Edit Action
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !categoryNameInput.trim()) return;
    setActionLoading(true);

    try {
      const isEdit = categoryFormType === "edit";
      const url = isEdit
        ? `/api/admin/categories/${encodeURIComponent(selectedCategoryId || "")}`
        : `/api/admin/categories`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
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
          // Cascadely update product local categories list names as well if needed
          triggerSuccessAlert(`Category modified to &quot;${saved.name}&quot;`);
        } else {
          setCategories((prev) => [...prev, saved]);
          triggerSuccessAlert(`Category "${saved.name}" created`);
        }
        setCategoryModalOpen(false);
        setCategoryNameInput("");
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to submit category entry.");
      }
    } catch (err) {
      setErrorMsg("Network error submitting category database.");
    } finally {
      setActionLoading(false);
    }
  };

  // CRUD REST: Categories - Delete
  const handleDeleteCategory = async (catId: string) => {
    if (
      !token ||
      !window.confirm(
        "Removing this category will not delete its associated items but they may require category re-assignment. Proceed?",
      )
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
    } catch (err) {
      setErrorMsg("Network error deleting category.");
    } finally {
      setActionLoading(false);
    }
  };

  // open Product Form Modal
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

  // open Category Form Modal
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

  // STATS COMPILATION: (All calculated dynamically over state lists!)
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    // For robust demo, we can take all orders (which represent today's list)
    const validOrders = orders.filter((o) => o.status !== "Cancelled");
    const totalOrdersCount = orders.length;
    const revenueTodayVal = validOrders.reduce((acc, o) => acc + o.total, 0);
    const pendingCount = orders.filter((o) => o.status === "Pending").length;
    const deliveredCount = orders.filter(
      (o) => o.status === "Delivered",
    ).length;

    return {
      total: totalOrdersCount,
      revenue: revenueTodayVal,
      pending: pendingCount,
      delivered: deliveredCount,
    };
  }, [orders]);

  // ANALYTICS COMPILATION:
  const analyticsData = useMemo(() => {
    // 1. Orders by Category
    const categoryCounts: Record<string, number> = {};
    const categoryRev: Record<string, number> = {};

    categories.forEach((c) => {
      categoryCounts[c.name] = 0;
      categoryRev[c.name] = 0;
    });

    orders.forEach((o) => {
      if (o.status === "Cancelled") return;
      o.items.forEach((itm) => {
        // match menu item category
        const correspondingProduct = products.find(
          (p) => p.id === itm.id || p.name === itm.name,
        );
        const cat = correspondingProduct
          ? correspondingProduct.category
          : "Breakfast";
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

    // 2. Most Ordered Items
    const itemSales: Record<
      string,
      { name: string; qty: number; rev: number }
    > = {};
    orders.forEach((o) => {
      if (o.status === "Cancelled") return;
      o.items.forEach((itm) => {
        if (!itemSales[itm.name]) {
          itemSales[itm.name] = { name: itm.name, qty: 0, rev: 0 };
        }
        itemSales[itm.name].qty += itm.quantity;
        itemSales[itm.name].rev += itm.price * itm.quantity;
      });
    });

    const productsOrderedSorted = Object.values(itemSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // 3. Simulated sales over last 5 days
    // Map existing orders or interpolate
    const dailySalesMap: Record<string, number> = {};
    // Seed standard luxury food days
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((d) => {
      dailySalesMap[d] = 0;
    });

    // Map orders to days
    orders.forEach((o) => {
      try {
        const d = new Date(o.createdAt);
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        dailySalesMap[dayName] = (dailySalesMap[dayName] || 0) + o.total;
      } catch (e) {}
    });

    // Make sure we have some beautiful non-zero background baseline if needed, but display computed values elegantly
    const weekSalesArray = Object.entries(dailySalesMap).map(([day, val]) => ({
      day,
      revenue: val || 0,
    }));

    return {
      categorySummary,
      productsOrderedSorted,
      weekSales: weekSalesArray,
    };
  }, [orders, categories, products]);

  // Logged OUT View -> Admin Credentials Input Form
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl relative overflow-hidden"
        >
          {/* Shimmer line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-750" />

          <div className="text-center mb-8">
            <span className="p-3 bg-slate-800 border border-slate-700 rounded-2xl inline-flex text-center justify-center items-center mb-4 text-indigo-500">
              <Briefcase className="w-8 h-8" />
            </span>
            <h1 className="font-sans text-xl font-bold tracking-tight text-slate-105">
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
                backoffice login
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Username (e.g., admin)"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-650 focus:ring-2 focus:ring-indigo-600/20 text-slate-200 outline-none transition-all font-medium"
                required
                id="admin-username-input"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-bold">
                administrative password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Password (e.g., password123)"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-650 focus:ring-2 focus:ring-indigo-600/20 text-slate-200 outline-none transition-all font-medium"
                required
                id="admin-password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-4"
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
              className="text-slate-500 hover:text-slate-350 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              &larr; Return to Guest View
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // LOGGED IN VIEW -> Admin Dashboard Main Panel Frame
  return (
    <div className="min-h-screen bg-slate-950 text-slate-105 flex flex-col md:flex-row font-sans">
      {/* Global Toast Alert */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold text-xs uppercase cursor-pointer"
          >
            <Check size={13} className="stroke-[3]" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DASHBOARD LATERAL PANEL SIDEBAR */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 shrink-0 flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-800/80">
            <span className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Briefcase size={18} />
            </span>
            <div>
              <h1 className="font-sans text-sm tracking-tight font-bold text-white">
                Backoffice Desk
              </h1>
              <span className="text-[9px] tracking-widest text-indigo-400 font-bold uppercase">
                Command Desk Lounge
              </span>
            </div>
          </div>

          {/* Nav buttons */}
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
                    setSelectedTab(tab.id as any);
                    setErrorMsg(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs font-bold"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                  }`}
                  id={`tab-${tab.id}`}
                >
                  <Icon size={15} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Support controls and admin identity block */}
        <div className="p-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white font-sans text-sm border border-indigo-450/20 shadow-inner">
              A
            </div>
            <div className="text-[10px]">
              <p className="font-bold text-slate-200">Executive Chef</p>
              <button
                onClick={() => fetchAdminData(token)}
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
              className="flex-1 py-1.5 px-3 text-center bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              id="view-guest-from-admin-btn"
            >
              Guest View
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 bg-rose-950/25 text-rose-400 border border-rose-900/20 hover:bg-rose-900/40 rounded-lg transition-colors cursor-pointer"
              title="Logout administrator"
              id="admin-logout-btn"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ADMIN CONTENT WRAPPER */}
      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-x-hidden">
        {/* Core synchronization / action loading state */}
        {actionLoading && (
          <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white rounded-xl px-4 py-2.5 shadow-md flex items-center gap-2 text-xs font-bold uppercase select-none">
            <RefreshCw size={12} className="animate-spin" />
            <span>Fulfilling transaction...</span>
          </div>
        )}

        {/* Global Error Banner */}
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
          {/* TAB VIEW 1: DASHBOARD HOME */}
          {selectedTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Header Title block */}
              <div>
                <h2 className="font-sans text-2xl font-bold tracking-tight text-white">
                  Backoffice Overview
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Realtime room dining operations, catering updates and metrics.
                </p>
              </div>

              {/* Statistic Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: "Total Orders Today",
                    value: stats.total,
                    icon: ListOrdered,
                    color: "text-indigo-400 bg-indigo-500/10",
                  },
                  {
                    title: "Revenue Today",
                    value: `$${stats.revenue.toFixed(2)}`,
                    icon: DollarSign,
                    color: "text-emerald-450 bg-emerald-500/10",
                  },
                  {
                    title: "Pending Orders",
                    value: stats.pending,
                    icon: Clock,
                    color: "text-amber-400 bg-amber-400/10",
                  },
                  {
                    title: "Delivered Orders",
                    value: stats.delivered,
                    icon: CheckCircle,
                    color: "text-sky-400 bg-sky-400/10",
                  },
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs"
                    >
                      <div className="space-y-1.5">
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest leading-none">
                          {stat.title}
                        </p>
                        <p className="font-sans text-2xl font-bold text-white tracking-tight">
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

              {/* Recent Orders table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                  <h3 className="font-sans text-sm font-bold text-white">
                    Active Suite Orders
                  </h3>
                  <button
                    onClick={() => setSelectedTab("orders")}
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-bold transition-all cursor-pointer"
                  >
                    Manage Full Log &rarr;
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    No active orders tracked today yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800/60 font-bold uppercase tracking-widest text-[9px]">
                          <th className="py-3 px-4">Order ID</th>
                          <th className="py-3 px-4">Room</th>
                          <th className="py-3 px-4">Time</th>
                          <th className="py-3 px-4">Selections Summary</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">
                            Total Invoice
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {orders.slice(0, 5).map((o) => (
                          <tr
                            key={o.id}
                            className="hover:bg-slate-800/20 text-slate-300"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-indigo-455">
                              {o.id}
                            </td>
                            <td className="py-3 px-4 font-sans font-bold text-slate-150">
                              Suite {o.roomNumber}
                            </td>
                            <td className="py-3 px-4 text-slate-400 font-medium">
                              {new Date(o.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-3 px-4 text-slate-400 max-w-xs truncate font-medium">
                              {o.items
                                .map((itm) => `${itm.quantity}x ${itm.name}`)
                                .join(", ")}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  o.status === "Pending"
                                    ? "bg-amber-500/10 text-amber-500"
                                    : o.status === "Accepted"
                                      ? "bg-indigo-500/10 text-indigo-400"
                                      : o.status === "Preparing"
                                        ? "bg-orange-500/10 text-orange-400"
                                        : o.status === "Out For Delivery"
                                          ? "bg-cyan-500/10 text-cyan-400"
                                          : o.status === "Delivered"
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "bg-rose-500/10 text-rose-450"
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-sans font-bold text-slate-100">
                              ${o.total.toFixed(2)}
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

          {/* TAB VIEW 2: ORDERS MANAGEMENT */}
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
                    Accept, monitor and dispatch suites food packages.
                  </p>
                </div>
                <button
                  onClick={() => fetchAdminData(token)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-end cursor-pointer text-slate-200"
                >
                  <RefreshCw size={12} />
                  <span>Synchronize List</span>
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs">
                  <ListOrdered className="mx-auto w-12 h-12 text-slate-500" />
                  <h3 className="mt-4 font-sans text-sm font-bold text-slate-250">
                    Fulfilled Queue Empty
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Ready for incoming room orders.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-4 shadow-xs"
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
                          <p className="text-[10px] text-slate-500 font-medium">
                            Time:{" "}
                            {new Date(o.createdAt).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                            Status:
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                              o.status === "Pending"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : o.status === "Accepted"
                                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                  : o.status === "Preparing"
                                    ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                    : o.status === "Out For Delivery"
                                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                      : o.status === "Delivered"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : "bg-rose-500/10 text-rose-450 border-rose-500/20"
                            }`}
                          >
                            {o.status}
                          </span>
                          <span className="text-lg font-sans font-bold text-white shrink-0">
                            ${o.total.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Items and notes summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">
                            Gourmet Selections
                          </p>
                          <div className="space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                            {o.items.map((itm, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between font-medium text-slate-300"
                              >
                                <span>
                                  {itm.quantity}x {itm.name}
                                </span>
                                <span className="font-sans font-bold text-slate-200">
                                  ${itm.price.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            Culinary Directives
                          </p>
                          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 h-full min-h-[50px] font-medium text-slate-400 italic">
                            {o.notes
                              ? `“${o.notes}”`
                              : "No custom food preparation instructions."}
                          </div>
                        </div>
                      </div>

                      {/* Quick Admin Operations */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-805/60 justify-end">
                        {o.status === "Pending" && (
                          <button
                            onClick={() =>
                              updateOrderStatusAction(o.id, "Accepted")
                            }
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase cursor-pointer transition-all"
                          >
                            Accept Order
                          </button>
                        )}
                        {o.status === "Accepted" && (
                          <button
                            onClick={() =>
                              updateOrderStatusAction(o.id, "Preparing")
                            }
                            className="bg-orange-600 hover:bg-orange-550 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase cursor-pointer transition-all"
                          >
                            Mark Preparing
                          </button>
                        )}
                        {o.status === "Preparing" && (
                          <button
                            onClick={() =>
                              updateOrderStatusAction(o.id, "Out For Delivery")
                            }
                            className="bg-cyan-600 hover:bg-cyan-550 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase cursor-pointer transition-all"
                          >
                            Mark Dispatch
                          </button>
                        )}
                        {o.status === "Out For Delivery" && (
                          <button
                            onClick={() =>
                              updateOrderStatusAction(o.id, "Delivered")
                            }
                            className="bg-emerald-600 hover:bg-emerald-555 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase cursor-pointer transition-all"
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
                              className="border border-rose-900/40 hover:bg-rose-950/20 text-rose-400 font-bold px-3 py-2 rounded-xl text-xs uppercase cursor-pointer transition-all"
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

          {/* TAB VIEW 3: MENU MANAGEMENT */}
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
                  className="bg-indigo-600 hover:bg-indigo-755 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase flex items-center gap-1 shadow-xs self-start sm:self-auto cursor-pointer transition-all"
                  id="admin-add-product-btn"
                >
                  <Plus size={13} className="stroke-[3]" />
                  <span>Add Selections</span>
                </button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs">
                  <Utensils className="mx-auto w-12 h-12 text-slate-500" />
                  <h3 className="mt-4 font-sans text-sm font-bold text-slate-250">
                    Catalog Empty
                  </h3>
                  <p className="text-xs text-indigo-400 mt-1 font-semibold">
                    Add your first hotel dish selections today.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 hover:border-slate-700 transition-colors shadow-xs"
                      id={`admin-product-${item.id}`}
                    >
                      <div className="flex-1 flex flex-col justify-between font-medium">
                        <div>
                          <div className="flex justify-between gap-1 items-start">
                            <h4 className="font-sans text-sm font-bold text-slate-100">
                              {item.name}
                            </h4>
                            <span className="text-xs font-bold text-indigo-400 font-sans shrink-0">
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                          <span className="text-[9px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full inline-block mt-1 font-bold uppercase">
                            {item.category}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed line-clamp-2 font-medium">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <button
                            onClick={async () => {
                              // Toggle available state
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
                                    `&ldquo;${item.name}&rdquo; is now ${nextState ? "Available" : "Unavailable"}`,
                                  );
                                }
                              } catch (err) {
                              } finally {
                                setActionLoading(false);
                              }
                            }}
                            className={`text-[9px] font-bold border px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 uppercase cursor-pointer ${
                              item.available
                                ? "border-emerald-900 bg-emerald-950/20 text-emerald-400"
                                : "border-rose-900 bg-rose-950/20 text-rose-400"
                            }`}
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
                              className="p-1 px-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit item"
                              id={`edit-product-${item.id}`}
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(item.id)}
                              className="p-1 px-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                              title="Delete item"
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

          {/* TAB VIEW 4: CATEGORY MANAGEMENT */}
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
                  className="bg-indigo-600 hover:bg-indigo-755 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase flex items-center gap-1 shadow-xs self-start sm:self-auto cursor-pointer transition-all"
                  id="admin-add-category-btn"
                >
                  <Plus size={13} className="stroke-[3]" />
                  <span>New Category</span>
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs">
                  <Layers className="mx-auto w-12 h-12 text-slate-500" />
                  <h3 className="mt-4 font-sans text-sm font-bold text-slate-250">
                    No categories loaded
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Define categories for beautiful filtering.
                  </p>
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
                        className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-colors shadow-xs"
                        id={`category-${cat.id}`}
                      >
                        <div className="space-y-1">
                          <h4 className="font-sans text-base font-bold text-slate-100">
                            {cat.name}
                          </h4>
                          <p className="text-[10px] text-indigo-400 font-bold uppercase">
                            {itemCount} Selections assigned
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openCategoryModal("edit", cat)}
                            className="p-1 px-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Category"
                            id={`edit-category-${cat.id}`}
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 px-2 text-slate-500 hover:text-rose-455 rounded-lg hover:bg-rose-950/20 transition-colors cursor-pointer"
                            title="Delete Category"
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

          {/* TAB VIEW 5: DATA VISUAL ANALYTICS (Fully compliant with D3 style scaling via SVG metrics) */}
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
                  Detailed metric streams and statistical distribution charts.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart 1: Revenue Over Last Week (SVG Line Chart) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-4 shadow-xs">
                  <h3 className="font-sans text-sm font-bold text-white">
                    Weekly Orders Revenue Trend
                  </h3>

                  {/* Custom Line Grid Chart in SVG */}
                  <div className="h-64 w-full relative pt-2">
                    <svg className="w-full h-full" viewBox="0 0 500 220">
                      {/* Grid Lines */}
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

                      {/* Line Paths & Markers */}
                      {(() => {
                        const maxVal = Math.max(
                          ...analyticsData.weekSales.map((d) => d.revenue),
                          100,
                        );
                        const points = analyticsData.weekSales.map(
                          (dayData, idx) => {
                            const x = 30 + idx * 75;
                            const y = 180 - (dayData.revenue / maxVal) * 130;
                            return {
                              x,
                              y,
                              label: dayData.day,
                              val: dayData.revenue,
                            };
                          },
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
                            {/* Area Gradient */}
                            {fillD && (
                              <path
                                d={fillD}
                                fill="url(#indigo-grad)"
                                opacity="0.12"
                              />
                            )}
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

                            {/* Line */}
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

                            {/* Dots and Values */}
                            {points.map((p, idx) => (
                              <g key={idx}>
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r="4.5"
                                  className="fill-indigo-500 stroke-slate-900 stroke-2 hover:r-6 transition-all duration-300 pointer-events-auto cursor-help"
                                />
                                {/* Value annotation */}
                                <text
                                  x={p.x}
                                  y={p.y - 10}
                                  textAnchor="middle"
                                  className="fill-indigo-400 font-mono font-bold text-[9px]"
                                >
                                  ${p.val.toFixed(0)}
                                </text>
                                {/* X-Axis Labels */}
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

                {/* Chart 2: Category distribution revenue shares */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
                  <h3 className="font-sans text-sm font-bold text-white">
                    Revenue by Category
                  </h3>

                  <div className="space-y-4">
                    {analyticsData.categorySummary.map((cat, idx) => {
                      const maxRev = Math.max(
                        ...analyticsData.categorySummary.map((c) => c.revenue),
                        1,
                      );
                      const barWidth = `${Math.max((cat.revenue / maxRev) * 100, 3)}%`;
                      return (
                        <div
                          key={idx}
                          className="space-y-1 text-xs font-semibold"
                        >
                          <div className="flex justify-between items-center text-slate-300">
                            <span>{cat.name}</span>
                            <span className="font-mono font-bold text-indigo-400">
                              ${cat.revenue.toFixed(0)}
                            </span>
                          </div>

                          <div className="w-full h-2 bg-slate-955 rounded-full overflow-hidden border border-slate-800/40">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-455 rounded-full transition-all duration-1000"
                              style={{ width: barWidth }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Table: Item orders frequency */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-3 space-y-4 shadow-xs">
                  <h3 className="font-sans text-sm font-bold text-white">
                    Signature Dish sales ranking
                  </h3>

                  {analyticsData.productsOrderedSorted.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs font-medium">
                      Wait for incoming records to populate ranked orders.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-semibold">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-800/80 pb-2 uppercase tracking-widest text-[9px]">
                            <th className="py-2.5 px-2">Culinary Dish</th>
                            <th className="py-2.5 px-2 text-center font-bold">
                              Quantities Ordered
                            </th>
                            <th className="py-2.5 px-2 text-right font-bold">
                              Invoice Sum
                            </th>
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
                                  <span className="font-bold text-slate-150">
                                    {item.name}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-center text-slate-400 font-mono font-bold">
                                  {item.qty} portions
                                </td>
                                <td className="py-3 px-2 text-right font-sans text-indigo-400 font-bold">
                                  ${item.rev.toFixed(2)}
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

      {/* CRUD Product Management Dialog/Modal */}
      <AnimatePresence>
        {productModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-sans text-lg font-bold text-white">
                  {productFormType === "create"
                    ? "Add Exquisite Plate Selection"
                    : "Refine Recipe Selection"}
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
                      dish title name
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
                      Portion Rate Price ($)
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
                    gourmet classification category
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
                    Flavor notes description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe ingredient origins, presentation style, allergen disclosures, etc..."
                    className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-indigo-500 h-20 resize-none font-medium text-slate-350"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-bold uppercase transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {actionLoading ? "Transmitting" : "Save Dish"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CRUD Category Management Dialog/Modal */}
      <AnimatePresence>
        {categoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-sans text-lg font-bold text-white">
                  {categoryFormType === "create"
                    ? "Draft New Category"
                    : "Rename Category Classification"}
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
                    Classification label
                  </label>
                  <input
                    type="text"
                    value={categoryNameInput}
                    onChange={(e) => setCategoryNameInput(e.target.value)}
                    placeholder="e.g. Sparking Wines"
                    className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-indigo-500 font-medium"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-bold uppercase transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {actionLoading ? "Saving" : "Save Entry"}
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
