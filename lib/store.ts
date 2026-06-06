// lib/store.ts

export type OrderStatus = 'Pending' | 'Accepted' | 'Preparing' | 'Out For Delivery' | 'Delivered' | 'Cancelled';

export interface Category {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string; // matches Category.name (Breakfast, Lunch, Dinner, Drinks, Desserts)
  image: string;
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
  createdAt: string; // ISO timestamp
}

// In Next.js, HMR causes module reloads. We store database state in globalThis to persist during dev.
interface GlobalDbStore {
  categories: Category[];
  menuItems: MenuItem[];
  orders: Order[];
  initialized: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Breakfast' },
  { id: '2', name: 'Lunch' },
  { id: '3', name: 'Dinner' },
  { id: '4', name: 'Drinks' },
  { id: '5', name: 'Desserts' }
];

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  // Breakfast
  {
    id: 'b1',
    name: 'Royal Eggs Benedict',
    description: 'Perfectly poached organic eggs, house-cured smoked salmon, rich hollandaise, on a toasted artisan English muffin.',
    price: 24.00,
    category: 'Breakfast',
    image: 'https://picsum.photos/seed/benedict/600/400',
    available: true
  },
  {
    id: 'b2',
    name: 'Belgian Waffle Tower',
    description: 'Golden, crispy Belgian waffles topped with fresh mountain berries, organic pure maple syrup, and vanilla bean chantilly cream.',
    price: 18.00,
    category: 'Breakfast',
    image: 'https://picsum.photos/seed/waffles/600/400',
    available: true
  },
  {
    id: 'b3',
    name: 'Smashed Avocado Sourdough',
    description: 'Crushed Hass avocado, heirloom cherry tomatoes, French feta cheese, pickled radishes, and a soft-poached egg on rustic sourdough toast.',
    price: 20.00,
    category: 'Breakfast',
    image: 'https://picsum.photos/seed/avotoast/600/400',
    available: true
  },
  // Lunch
  {
    id: 'l1',
    name: 'Augustus Caesar Salad',
    description: 'Crisp baby romaine hearts, rosemary grilled chicken breast, fresh herb sourdough croutons, Parmigiano-Reggiano shavings, and Caesar dressing.',
    price: 22.00,
    category: 'Lunch',
    image: 'https://picsum.photos/seed/caesar/600/400',
    available: true
  },
  {
    id: 'l2',
    name: 'Palace Wagyu Burger',
    description: 'Aged white cheddar, sweet caramelized onions, black truffle aioli, baby arugula, on toasted brioche. Served with gold-dusted sea salt fries.',
    price: 28.00,
    category: 'Lunch',
    image: 'https://picsum.photos/seed/burger/600/400',
    available: true
  },
  {
    id: 'l3',
    name: 'Wild Mushroom Risotto',
    description: 'Slow-simmered Carnaroli rice with forest chanterelle and porcini mushrooms, dry white wine, truffle butter, and aged pecorino.',
    price: 26.00,
    category: 'Lunch',
    image: 'https://picsum.photos/seed/risotto/600/400',
    available: true
  },
  // Dinner
  {
    id: 'd1',
    name: 'Prime Filet Mignon',
    description: '8oz tender center-cut beef filet, garlic potato puree, grilled asparagus spears, finished with a classic Bordelaise red wine reduction.',
    price: 45.00,
    category: 'Dinner',
    image: 'https://picsum.photos/seed/steak/600/400',
    available: true
  },
  {
    id: 'd2',
    name: 'Pan-Seared Chilean Sea Bass',
    description: 'Delicate white sea bass fillet, seasonal local asparagus spears, Meyer lemon saffron emulsion, and heirloom baby tomato confit.',
    price: 38.00,
    category: 'Dinner',
    image: 'https://picsum.photos/seed/seabass/600/400',
    available: true
  },
  {
    id: 'd3',
    name: 'Hand-Cut Black Truffle Pasta',
    description: 'Artisanal tagliatelle tossed with fresh black summer truffle tapenade, mountain butter cream sauce, and grated Reggiano.',
    price: 32.00,
    category: 'Dinner',
    image: 'https://picsum.photos/seed/trufflepasta/600/400',
    available: true
  },
  // Drinks
  {
    id: 'dr1',
    name: 'Imperial Smoked Old Fashioned',
    description: 'Premium rye whiskey, bitters, raw sugar cube, express orange oils, wood-smoke presentation inside a crystal decanter.',
    price: 18.00,
    category: 'Drinks',
    image: 'https://picsum.photos/seed/oldfashioned/600/400',
    available: true
  },
  {
    id: 'dr2',
    name: 'Organic Cold-Pressed Elixir',
    description: 'Invigorating blend of sweet kale, organic spinach, crisp ginger root, lemon juice, green apple, and cucumber.',
    price: 11.00,
    category: 'Drinks',
    image: 'https://picsum.photos/seed/greenjuice/600/400',
    available: true
  },
  {
    id: 'dr3',
    name: 'Grand Reserve Signature Espresso',
    description: 'House-roasted arabica single-origin espresso, served with warm milk foam and a piece of Belgian dark chocolate.',
    price: 8.00,
    category: 'Drinks',
    image: 'https://picsum.photos/seed/espresso/600/400',
    available: true
  },
  // Desserts
  {
    id: 'ds1',
    name: '24K Gold Chocolate Lava Cake',
    description: 'Decadent chocolate sponge cake filled with molten Madagascar dark chocolate ganache, topped with genuine edible gold leaf and Tahitian vanilla gelato.',
    price: 16.00,
    category: 'Desserts',
    image: 'https://picsum.photos/seed/lavacake/600/400',
    available: true
  },
  {
    id: 'ds2',
    name: 'Vanilla Crème Brûlée',
    description: 'Rich, smooth egg-yoke custard flavored with organic vanilla bean pod and caramelized brown sugar topping.',
    price: 14.00,
    category: 'Desserts',
    image: 'https://picsum.photos/seed/cremebrulee/600/400',
    available: true
  },
  {
    id: 'ds3',
    name: 'Classic Venetian Tiramisu',
    description: 'Layers of espresso-infused Italian ladyfinger cookies, delicate sweet mascarpone sabayon, and finished with organic raw cocoa powder dusting.',
    price: 14.00,
    category: 'Desserts',
    image: 'https://picsum.photos/seed/tiramisu/600/400',
    available: true
  }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ORD-1001',
    roomNumber: '402',
    items: [
      { id: 'b1', name: 'Royal Eggs Benedict', price: 24.00, quantity: 2 },
      { id: 'dr2', name: 'Organic Cold-Pressed Elixir', price: 11.00, quantity: 2 }
    ],
    notes: 'No onions. Hollandaise sauce on the side please.',
    subtotal: 70.00,
    total: 70.00,
    status: 'Delivered',
    createdAt: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString() // 3.5 hrs ago
  },
  {
    id: 'ORD-1002',
    roomNumber: '108',
    items: [
      { id: 'l2', name: 'Palace Wagyu Burger', price: 28.00, quantity: 1 },
      { id: 'dr1', name: 'Imperial Smoked Old Fashioned', price: 18.00, quantity: 1 }
    ],
    notes: 'Extra crispy fries.',
    subtotal: 46.00,
    total: 46.00,
    status: 'Preparing',
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString() // 40 mins ago
  },
  {
    id: 'ORD-1003',
    roomNumber: '515',
    items: [
      { id: 'd1', name: 'Prime Filet Mignon', price: 45.00, quantity: 2 },
      { id: 'dr1', name: 'Imperial Smoked Old Fashioned', price: 18.00, quantity: 2 },
      { id: 'ds1', name: '24K Gold Chocolate Lava Cake', price: 16.00, quantity: 1 }
    ],
    notes: 'Steaks medium rare. Celebrate anniversary dinner.',
    subtotal: 142.00,
    total: 142.00,
    status: 'Pending',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 mins ago
  },
  {
    id: 'ORD-1004',
    roomNumber: '320',
    items: [
      { id: 'l1', name: 'Augustus Caesar Salad', price: 22.00, quantity: 1 },
      { id: 'ds2', name: 'Vanilla Crème Brûlée', price: 14.00, quantity: 1 }
    ],
    notes: 'Dressing on the side.',
    subtotal: 36.00,
    total: 36.00,
    status: 'Accepted',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString() // 25 mins ago
  }
];

// Reference pointer for state
let db: GlobalDbStore;

const globalRef = globalThis as unknown as { __hotel_ordering_db__?: GlobalDbStore };

if (!globalRef.__hotel_ordering_db__) {
  globalRef.__hotel_ordering_db__ = {
    categories: [...DEFAULT_CATEGORIES],
    menuItems: [...DEFAULT_MENU_ITEMS],
    orders: [...DEFAULT_ORDERS],
    initialized: true
  };
}

db = globalRef.__hotel_ordering_db__;

export function getCategories(): Category[] {
  return db.categories;
}

export function saveCategories(categories: Category[]) {
  db.categories = [...categories];
}

export function addCategory(name: string): Category {
  const newCat: Category = {
    id: 'cat_' + Date.now(),
    name: name.trim()
  };
  db.categories.push(newCat);
  return newCat;
}

export function updateCategory(id: string, name: string): Category | null {
  const cat = db.categories.find(c => c.id === id);
  if (cat) {
    const oldName = cat.name;
    cat.name = name.trim();
    // Cascade update to menu items category field
    db.menuItems = db.menuItems.map(item => {
      if (item.category === oldName) {
        return { ...item, category: cat.name };
      }
      return item;
    });
    return cat;
  }
  return null;
}

export function deleteCategory(id: string): boolean {
  const idx = db.categories.findIndex(c => c.id === id);
  if (idx !== -1) {
    db.categories.splice(idx, 1);
    return true;
  }
  return false;
}

export function getMenuItems(): MenuItem[] {
  return db.menuItems;
}

export function saveMenuItems(items: MenuItem[]) {
  db.menuItems = [...items];
}

export function addMenuItem(item: Omit<MenuItem, 'id'>): MenuItem {
  const newItem: MenuItem = {
    ...item,
    id: 'item_' + Date.now()
  };
  db.menuItems.push(newItem);
  return newItem;
}

export function updateMenuItem(id: string, updated: Partial<MenuItem>): MenuItem | null {
  const idx = db.menuItems.findIndex(item => item.id === id);
  if (idx !== -1) {
    db.menuItems[idx] = {
      ...db.menuItems[idx],
      ...updated
    };
    return db.menuItems[idx];
  }
  return null;
}

export function deleteMenuItem(id: string): boolean {
  const idx = db.menuItems.findIndex(item => item.id === id);
  if (idx !== -1) {
    db.menuItems.splice(idx, 1);
    return true;
  }
  return false;
}

export function getOrders(): Order[] {
  return db.orders;
}

export function createOrder(roomNumber: string, items: OrderItem[], notes: string): Order {
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal; // room service tax/fee can be included but keeping it simple as total = subtotal
  
  // Generate high-end order number ID
  const latestNum = db.orders.length > 0
    ? parseInt(db.orders[0].id.replace('ORD-', ''))
    : 1000;
  
  const nextNum = Math.max(latestNum, 1004) + 1;
  const newId = `ORD-${nextNum}`;

  const newOrder: Order = {
    id: newId,
    roomNumber,
    items,
    notes,
    subtotal,
    total,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };
  
  // Insert at front so list is sorted newest first
  db.orders.unshift(newOrder);
  return newOrder;
}

export function updateOrderStatus(id: string, status: OrderStatus): Order | null {
  const order = db.orders.find(o => o.id === id);
  if (order) {
    order.status = status;
    return order;
  }
  return null;
}
