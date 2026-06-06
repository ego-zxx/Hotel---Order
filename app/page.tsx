// app/page.tsx
'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  HelpCircle, 
  Moon, 
  Sun, 
  Lock,
  Compass,
  Soup,
  Coffee,
  Sparkles,
  DollarSign
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Inline TypeScript schemas matching lib/store.ts
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
  image: string;
  available: boolean;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface Order {
  id: string;
  roomNumber: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  notes: string;
  subtotal: number;
  total: number;
  status: 'Pending' | 'Accepted' | 'Preparing' | 'Out For Delivery' | 'Delivered' | 'Cancelled';
  createdAt: string;
}

export default function GuestOrderingApp() {
  // Navigation & State
  const [roomInput, setRoomInput] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guest_room_number') || '';
    }
    return '';
  });
  const [roomNumber, setRoomNumber] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guest_room_number');
    }
    return null;
  });
  const [screen, setScreen] = useState<'welcome' | 'menu' | 'cart' | 'checkout' | 'tracking'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guest_room_number') ? 'menu' : 'welcome';
    }
    return 'welcome';
  });
  
  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Order Tracking
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guest_active_order_id');
    }
    return null;
  });
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  
  // Controls & Loading
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guest_dark_mode') === 'true';
    }
    return false;
  });

  const fetchInitialData = async (showLoadingState = false) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      }
      const [catRes, menuRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/menu')
      ]);

      if (catRes.ok && menuRes.ok) {
        const cats: Category[] = await catRes.json();
        const items: MenuItem[] = await menuRes.json();
        setCategories(cats);
        setMenuItems(items);
      } else {
        setErrorMsg('Failed to load menu. Please try reloading.');
      }
    } catch (err) {
      setErrorMsg('Network error. Unable to load menu.');
    } finally {
      setLoading(false);
    }
  };

  // Sync dark mode class
  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem('guest_dark_mode', String(nextDark));
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Initialize from LocalStorage
  useEffect(() => {
    // Set Dark Mode class on DOM
    const savedDark = localStorage.getItem('guest_dark_mode');
    if (savedDark === 'true') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Fetch initial menu data
    fetchInitialData();
  }, []);

  // Poll active order if tracking
  useEffect(() => {
    if (!activeOrderId) return;

    const pollOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(activeOrderId)}`);
        if (res.ok) {
          const data: Order = await res.json();
          setTrackingOrder(data);
        }
      } catch (err) {
        console.error('Error polling order:', err);
      }
    };

    pollOrder();
    const interval = setInterval(pollOrder, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [activeOrderId]);

  // Save room number
  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) {
      setErrorMsg('Please enter a valid room number to proceed.');
      return;
    }
    setErrorMsg(null);
    const sanitizedRoom = roomInput.trim();
    setRoomNumber(sanitizedRoom);
    localStorage.setItem('guest_room_number', sanitizedRoom);
    setScreen('menu');
  };

  // Switch Room / Exit
  const handleSignOut = () => {
    if (window.confirm('Do you want to clear your room session? Your cart will be cleared.')) {
      localStorage.removeItem('guest_room_number');
      localStorage.removeItem('guest_active_order_id');
      setRoomNumber(null);
      setRoomInput('');
      setCart([]);
      setActiveOrderId(null);
      setTrackingOrder(null);
      setScreen('welcome');
    }
  };

  // Add Item to Cart
  const addToCart = (item: MenuItem) => {
    if (!item.available) return;
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
    showSuccessToast(`${item.name} added to cart`);
  };

  // Quantity control
  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.item.id === itemId) {
          const newQ = i.quantity + delta;
          return newQ > 0 ? { ...i, quantity: newQ } : i;
        }
        return i;
      }).filter(i => i.quantity > 0);
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.item.id !== itemId));
  };

  // Notification Toast Helper
  const showSuccessToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Calculate totals
  const cartTotals = useMemo(() => {
    const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);
    const subtotal = cart.reduce((acc, i) => acc + (i.item.price * i.quantity), 0);
    return { totalItems, subtotal, total: subtotal };
  }, [cart]);

  // Filter and Search Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Handle Checkout submission
  const handlePlaceOrder = async () => {
    if (!roomNumber) return;
    if (cart.length === 0) return;

    try {
      setActionLoading(true);
      setErrorMsg(null);

      const itemsPayload = cart.map(item => ({
        id: item.item.id,
        name: item.item.name,
        price: item.item.price,
        quantity: item.quantity
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber,
          items: itemsPayload,
          notes: specialInstructions
        })
      });

      if (res.ok) {
        const data: Order = await res.json();
        setActiveOrderId(data.id);
        setTrackingOrder(data);
        localStorage.setItem('guest_active_order_id', data.id);
        
        // Reset Cart
        setCart([]);
        setSpecialInstructions('');
        
        // Go to tracking screen
        setScreen('tracking');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Network error while placing order.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Dynamic Success Toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity:0, y:-30, scale:0.9 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-20, scale:0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-medium"
          >
            <Sparkles size={18} />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Navbar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-600 rounded-lg shadow-sm">
              <Utensils className="h-5 w-5 text-white" />
            </span>
            <div>
              <h1 className="font-sans text-base tracking-tight font-bold text-slate-900 dark:text-white leading-none">L&apos;Atelier</h1>
              <span className="text-[10px] tracking-wider text-slate-400 font-medium uppercase mt-0.5 block">Grand Palais Hotel</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              aria-label="Toggle dark mode"
              id="theme-toggler"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {roomNumber && (
              <span className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1 rounded-full font-semibold">
                Room {roomNumber}
              </span>
            )}
            {activeOrderId && screen !== 'tracking' && (
              <button
                onClick={() => setScreen('tracking')}
                className="text-xs bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-105 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 transition-all font-semibold"
                id="view-tracking-btn"
              >
                <Clock size={12} className="animate-spin" style={{ animationDuration: '4s' }} />
                <span>Track Order</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 md:p-6">
        
        {/* Error Announcement */}
        {errorMsg && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center justify-between">
            <p>{errorMsg}</p>
            <button onClick={() => setErrorMsg(null)} className="text-xs underline ml-2 font-medium">Dismiss</button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="relative w-16 h-16">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-500 text-sm font-medium">Preparing the menu...</p>
          </div>
        )}

        {/* Guest Screen Controller */}
        {!loading && (
          <AnimatePresence mode="wait">
            
            {/* SCREEN: WELCOME / ROOM ENTRY */}
            {screen === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col items-center justify-center py-8 md:py-16 animate-in fade-in duration-300"
              >
                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-8 md:p-10 shadow-sm border border-slate-200 dark:border-slate-800 text-center">
                  <div className="mx-auto w-16 h-16 bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Compass className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  
                  <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                    In-Room Dining
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                    Exquisite culinary creations, direct from our kitchen to your door. Welcome to L&apos;Atelier.
                  </p>

                  <form onSubmit={handleRoomSubmit} className="space-y-4">
                    <div className="text-left">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                        Enter Room or Suite Number
                      </label>
                      <input
                        type="text"
                        pattern="[A-Za-z0-9-]+"
                        placeholder="e.g. 402, Penthouse"
                        value={roomInput}
                        onChange={e => setRoomInput(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-lg font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-slate-900 dark:text-white"
                        required
                        id="room-number-input"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold tracking-wide flex items-center justify-center gap-2 transition-all shadow-sm group cursor-pointer"
                      id="continue-ordering-btn"
                    >
                      <span>Explore In-Room Menu</span>
                      <ChevronRight size={16} className="translate-y-[0.5px] group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-slate-150 dark:border-slate-800/80 flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <Lock size={13} />
                    <Link href="/admin" className="text-xs font-medium" id="staff-portal-link">
                      Administrative Staff Portal
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SCREEN: MENU VIEW */}
            {screen === 'menu' && (
              <motion.div
                key="menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Search Bar & Switch Room */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-2">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search menu..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-indigo-600/90 dark:text-indigo-400/90">● Active</span>
                    <span>In-Room Dining</span>
                    <span>•</span>
                    <button 
                      onClick={handleSignOut}
                      className="text-slate-500 dark:text-slate-400 underline hover:text-red-500 font-medium cursor-pointer"
                    >
                      Change Room
                    </button>
                  </div>
                </div>

                {/* Horizontal Category Pill Scroll */}
                <div className="overflow-x-auto no-scrollbar -mx-4 px-4 flex items-center gap-2 py-1">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide border transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === 'All'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-semibold'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-850 hover:border-indigo-400'
                    }`}
                  >
                    All Culinary Crafts
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide border transition-all whitespace-nowrap cursor-pointer ${
                        selectedCategory === cat.name
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-semibold'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-850 hover:border-indigo-400'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Menu Item Grill */}
                {filteredMenuItems.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <Soup className="mx-auto w-12 h-12 text-slate-300" />
                    <h3 className="mt-4 font-sans text-lg font-bold text-slate-800 dark:text-slate-200">No items found</h3>
                    <p className="text-slate-400 text-xs mt-1">Please try clearing your filters or searches.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredMenuItems.map(item => (
                      <motion.div
                        layout
                        key={item.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-800 flex flex-col h-full hover:shadow-md transition-shadow"
                        id={`item-${item.id}`}
                      >
                        <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-950">
                          <Image
                            src={item.image || 'https://picsum.photos/seed/placeholder/600/400'}
                            alt={item.name}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            referrerPolicy="no-referrer"
                          />
                          {!item.available && (
                            <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center backdrop-blur-xs">
                              <span className="bg-slate-900/90 text-amber-500 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
                                Unavailable Tonight
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-sans text-base font-bold text-slate-900 dark:text-white leading-tight">
                                {item.name}
                              </h3>
                              <span className="font-sans text-base font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                                ${item.price.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-3">
                              {item.description}
                            </p>
                          </div>

                          <button
                            onClick={() => addToCart(item)}
                            disabled={!item.available}
                            className={`w-full py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all uppercase cursor-pointer ${
                              item.available
                                ? 'bg-transparent border border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-slate-950 text-center font-bold'
                                : 'bg-slate-100 dark:bg-slate-950 text-slate-450 dark:text-slate-600 line-through cursor-not-allowed border-transparent'
                            }`}
                            id={`add-to-cart-${item.id}`}
                          >
                            {item.available ? 'Add to Cart' : 'Sold Out'}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Sticky/Floating Cart bar */}
                {cart.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 max-w-lg z-30"
                  >
                    <button
                      onClick={() => setScreen('cart')}
                      className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-indigo-500/20 flex items-center justify-between transition-all cursor-pointer"
                      id="floating-cart-view-btn"
                    >
                      <div className="flex items-center gap-3">
                        <span className="relative p-2 bg-slate-800 dark:bg-slate-900 rounded-xl">
                          <ShoppingBag size={18} className="text-indigo-450 dark:text-indigo-400" />
                          <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                            {cartTotals.totalItems}
                          </span>
                        </span>
                        <div className="text-left">
                          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">View Order Basket</p>
                          <p className="text-xs text-indigo-455 dark:text-indigo-300 font-medium">{cartTotals.totalItems} selection{cartTotals.totalItems > 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-sans text-base font-bold text-indigo-200">${cartTotals.total.toFixed(2)}</span>
                        <ChevronRight size={18} className="text-slate-400" />
                      </div>
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* SCREEN: CART PAGE */}
            {screen === 'cart' && (
              <motion.div
                key="cart"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Header Back Button */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <button
                    onClick={() => setScreen('menu')}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors uppercase tracking-wider cursor-pointer"
                    id="cart-back-to-menu-btn"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Culinary Crafts</span>
                  </button>
                  <h2 className="font-sans text-base font-bold text-slate-900 dark:text-white">Your Basket</h2>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                    <ShoppingBag className="mx-auto w-12 h-12 text-slate-300" />
                    <h3 className="font-sans text-lg font-bold text-slate-800 dark:text-slate-200">Your basket is empty</h3>
                    <p className="text-xs text-slate-400">Discover premium selections on our main dining menu.</p>
                    <button
                      onClick={() => setScreen('menu')}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider mt-2 cursor-pointer"
                    >
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Cart Items List */}
                    <div className="lg:col-span-2 space-y-4">
                      {cart.map(({ item, quantity }) => (
                        <div 
                          key={item.id}
                          className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 flex gap-4 shadow-xs"
                        >
                          <div className="relative w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
                            <Image 
                              src={item.image} 
                              alt={item.name} 
                              fill 
                              className="object-cover"
                              sizes="80px"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between gap-2">
                                <h4 className="font-sans text-sm font-bold text-slate-900 dark:text-slate-100">{item.name}</h4>
                                <span className="text-sm font-bold font-sans text-indigo-600 dark:text-indigo-400">${(item.price * quantity).toFixed(2)}</span>
                              </div>
                              <p className="text-slate-400 text-[10px] mt-0.5 uppercase tracking-wider font-semibold">{item.category}</p>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              {/* Quantity selection */}
                              <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="p-1 px-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-white transition-colors cursor-pointer"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="px-2 text-xs text-slate-900 dark:text-slate-200 font-bold">{quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="p-1 px-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-white transition-colors cursor-pointer"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={11} />
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                                aria-label="Remove item"
                                id={`remove-item-${item.id}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order summary card */}
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                        <h3 className="font-sans text-xs font-bold tracking-wider uppercase border-b border-slate-200 dark:border-slate-800 pb-2.5 text-slate-800 dark:text-slate-200">
                          Order Summary
                        </h3>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-slate-500">
                            <span>Room Service Subtotal</span>
                            <span>${cartTotals.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Delivery to Suite</span>
                            <span className="text-emerald-650 dark:text-emerald-400 font-bold">Complimentary</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Service Surcharge</span>
                            <span className="text-emerald-650 dark:text-emerald-400 font-bold">Included</span>
                          </div>
                          <div className="border-t border-slate-150 dark:border-slate-800 pt-3 flex justify-between font-sans text-base font-bold text-slate-900 dark:text-white">
                            <span>Total Due</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">${cartTotals.total.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Special Instructions text area */}
                        <div className="space-y-1.5 pt-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Culinary notes / Instructions
                          </label>
                          <textarea
                            placeholder="e.g. No onions, dressing on the side, extra ice..."
                            value={specialInstructions}
                            onChange={e => setSpecialInstructions(e.target.value)}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-slate-900 dark:text-white min-h-[80px] resize-none"
                            id="special-instructions-textarea"
                          />
                        </div>

                        <button
                          onClick={() => setScreen('checkout')}
                          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                          id="proceed-to-checkout-btn"
                        >
                          <span>Proceed to Checkout</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* SCREEN: CHECKOUT SUMMARY */}
            {screen === 'checkout' && (
              <motion.div
                key="checkout"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-xl mx-auto space-y-6"
              >
                {/* Back button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScreen('cart')}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors uppercase tracking-wider cursor-pointer"
                    id="checkout-back-to-cart-btn"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to basket</span>
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
                  <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-5">
                    <h2 className="font-sans text-xl font-bold text-slate-900 dark:text-white mb-1">Confirm Order Delivery</h2>
                    <p className="text-xs text-slate-400 font-medium">Please review your culinary request before scheduling.</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Delivery Room Info */}
                    <div className="flex justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl">
                      <div>
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Suite Destination</p>
                        <p className="text-sm font-sans font-bold text-slate-800 dark:text-white">Suite Room {roomNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Surcharge Scheme</p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Complimentary Service</p>
                      </div>
                    </div>

                    {/* Ordered items listing */}
                    <div className="space-y-2">
                      <p className="font-bold uppercase tracking-wider text-[9px] text-indigo-650 dark:text-indigo-400">Gourmet Selections</p>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {cart.map(({ item, quantity }) => (
                          <div key={item.id} className="flex justify-between items-center text-slate-600 dark:text-slate-350 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="font-sans text-xs text-slate-500 bg-slate-100 dark:bg-slate-850 border dark:border-slate-800 rounded-md px-1.5 py-0.5">{quantity}x</span>
                              <span className="font-semibold text-slate-805 dark:text-slate-100">{item.name}</span>
                            </div>
                            <span className="font-bold font-sans">${(item.price * quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Special Instructions Review */}
                    {specialInstructions && (
                      <div className="space-y-1">
                        <p className="font-bold uppercase tracking-wider text-[9px] text-slate-400">Preparation Directives</p>
                        <p className="bg-indigo-50/40 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 p-3 rounded-lg text-slate-650 dark:text-indigo-200 font-medium italic">
                          &ldquo;{specialInstructions}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Total */}
                    <div className="border-t border-slate-150 dark:border-slate-800 pt-4 flex justify-between font-sans text-base font-bold text-slate-900 dark:text-white items-baseline">
                      <span>Total Invoice</span>
                      <span className="text-indigo-600 dark:text-indigo-455 text-2xl font-bold">${cartTotals.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={actionLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    id="submit-order-checkout-btn"
                  >
                    {actionLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-white dark:border-t-indigo-300 rounded-full animate-spin" />
                        <span>Transmitting Order...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Place Order</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN: ORDER TRACKING */}
            {screen === 'tracking' && (
              <motion.div
                key="tracking"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-xl mx-auto space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm relative overflow-hidden">
                  
                  {/* Decorative Indigo Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
                  
                  <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-5">
                    <span className="inline-flex items-center p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full mb-3">
                      <CheckCircle2 size={30} className="animate-pulse" />
                    </span>
                    <h2 className="font-sans text-xl font-bold text-slate-900 dark:text-white mb-1">Your order has been received.</h2>
                    <p className="text-xs text-slate-400 font-medium">Order is registered. Tracking details are synchronized below.</p>
                  </div>

                  {/* Tracking info cards */}
                  {trackingOrder ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-center">
                          <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Order Number</p>
                          <p className="text-sm font-mono font-bold text-slate-800 dark:text-white">{trackingOrder.id}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-center">
                          <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Suite Room</p>
                          <p className="text-sm font-sans font-bold text-slate-800 dark:text-white">Suite {trackingOrder.roomNumber}</p>
                        </div>
                      </div>

                      {/* Timeline status indicator */}
                      <div className="space-y-4 border border-slate-200/60 dark:border-slate-850 p-5 rounded-2xl bg-white dark:bg-slate-900 w-full animate-fadeIn">
                        <p className="font-bold uppercase tracking-wider text-[9px] text-indigo-600 dark:text-indigo-400 text-center pb-2 border-b border-slate-100 dark:border-slate-800/60">Progress Timeline</p>
                        
                        <div className="relative pl-10 space-y-6 py-2.5 border-l border-slate-150 dark:border-slate-800 ml-4">
                          {[
                            { name: 'Pending', label: 'Order Transmitted', desc: 'Our chef is reviewing your request.' },
                            { name: 'Accepted', label: 'Order Accepted', desc: 'Acknowledged and approved for fulfillment.' },
                            { name: 'Preparing', label: 'In the Kitchen', desc: 'Ingredients are being expertly crafted.' },
                            { name: 'Out For Delivery', label: 'Transit Status', desc: 'Your warm tray is heading to your floor.' },
                            { name: 'Delivered', label: 'Delivered', desc: 'Bon appétit! Enjoy your custom room service.' }
                          ].map((step, idx, arr) => {
                            // Find active order status index
                            const getStatusIndex = (stat: string) => {
                              const indices: Record<string, number> = {
                                'Pending': 0,
                                'Accepted': 1,
                                'Preparing': 2,
                                'Out For Delivery': 3,
                                'Delivered': 4,
                                'Cancelled': -1
                              };
                              return indices[stat] !== undefined ? indices[stat] : -1;
                            };

                            const currentIdx = getStatusIndex(trackingOrder.status);
                            const isFulfilled = idx <= currentIdx;
                            const isCurrent = idx === currentIdx;
                            const isCancelled = trackingOrder.status === 'Cancelled';

                            return (
                              <div key={idx} className="relative">
                                {/* Dot Indicator */}
                                <div className={`absolute -left-[45px] top-0 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                                  isCancelled
                                    ? 'bg-red-500 border-red-500'
                                    : isCurrent
                                      ? 'bg-slate-900 border-indigo-650 ring-4 ring-indigo-500/20 dark:ring-indigo-500/10 animate-pulse'
                                      : isFulfilled
                                        ? 'bg-indigo-600 border-indigo-600'
                                        : 'bg-slate-55 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                }`}>
                                  {isFulfilled && !isCancelled && idx < currentIdx && (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                  )}
                                </div>

                                <div className={`${isCurrent ? 'opacity-100 scale-[1.01]' : 'opacity-60'} transition-all`}>
                                  <h4 className="text-xs font-sans font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{step.label}</span>
                                    {isCurrent && <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{step.desc}</p>
                                </div>
                              </div>
                            );
                          })}

                          {trackingOrder.status === 'Cancelled' && (
                            <div className="p-3 bg-red-100/30 border border-red-500/20 text-red-650 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full" />
                              <span>This order was cancelled by the Administration.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Details dropdown style */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 p-4 rounded-xl text-xs space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-850 pb-2">
                          <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Order Synopsis</p>
                          <span className="font-sans font-bold text-indigo-600 dark:text-indigo-400">${trackingOrder.total.toFixed(2)}</span>
                        </div>
                        <div className="space-y-1 text-slate-500 dark:text-slate-400 max-h-[100px] overflow-y-auto pr-1">
                          {trackingOrder.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between font-medium">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="font-sans font-bold text-slate-600 dark:text-slate-350">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-center text-slate-400 text-xs font-medium">
                      Synchronizing active trace...
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setScreen('menu')}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-center rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      id="order-more-btn"
                    >
                      Order More Food
                    </button>
                    <button
                      onClick={async () => {
                        if (!activeOrderId) return;
                        setLoading(true);
                        try {
                          const res = await fetch(`/api/orders/${encodeURIComponent(activeOrderId)}`);
                          if (res.ok) {
                            const data = await res.json();
                            setTrackingOrder(data);
                            showSuccessToast('Checking updates...');
                          }
                        } catch (err) {
                          setErrorMsg('Failed to fetch refresh.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="py-3 px-5 border border-slate-250 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-center rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                      id="refresh-order-btn"
                    >
                      Refresh Realtime
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 py-8 text-center text-xs mt-12 shrink-0">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <p className="font-sans font-bold tracking-tight text-white text-sm">L&apos;Atelier Gourmand</p>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none">In-suite gourmet dining experiences • 24/7 dedicated service</p>
          <p className="text-[9px] text-slate-500 mt-2">&copy; {new Date().getFullYear()} Grand Palais Luxury Hospitality. All culinary rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
