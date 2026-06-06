-- schema.sql
-- Run this once against your MySQL database to create tables and seed default data.
-- Usage: mysql -u root -p hotel_ordering < schema.sql

CREATE DATABASE IF NOT EXISTS hotel_ordering
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hotel_ordering;

-- ─── Categories ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- ─── Menu Items ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS menu_items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200)   NOT NULL,
  description TEXT           NOT NULL,
  price       DECIMAL(10,2)  NOT NULL,
  category    VARCHAR(100)   NOT NULL,
  available   TINYINT(1)     NOT NULL DEFAULT 1,
  INDEX idx_category (category)
);

-- ─── Orders ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(50)   NOT NULL,
  notes       TEXT,
  subtotal    DECIMAL(10,2) NOT NULL,
  total       DECIMAL(10,2) NOT NULL,
  status      ENUM(
    'Pending','Accepted','Preparing','Out For Delivery','Delivered','Cancelled'
  ) NOT NULL DEFAULT 'Pending',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room   (room_number),
  INDEX idx_status (status)
);

-- ─── Order Items ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS order_items (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id     INT UNSIGNED NOT NULL,
  menu_item_id VARCHAR(50)  NOT NULL,   -- stores original menu item id as string
  name         VARCHAR(200) NOT NULL,
  price        DECIMAL(10,2) NOT NULL,
  quantity     INT UNSIGNED  NOT NULL DEFAULT 1,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order (order_id)
);

-- ─── Seed: Categories ────────────────────────────────────────────────────────

INSERT IGNORE INTO categories (name) VALUES
  ('Breakfast'),
  ('Lunch'),
  ('Dinner'),
  ('Drinks'),
  ('Desserts');

-- ─── Seed: Menu Items ────────────────────────────────────────────────────────

INSERT IGNORE INTO menu_items (name, description, price, category, available) VALUES
-- Breakfast
('Royal Eggs Benedict',
 'Perfectly poached organic eggs, house-cured smoked salmon, rich hollandaise, on a toasted artisan English muffin.',
 24.00, 'Breakfast', 1),

('Belgian Waffle Tower',
 'Golden, crispy Belgian waffles topped with fresh mountain berries, organic pure maple syrup, and vanilla bean chantilly cream.',
 18.00, 'Breakfast', 1),

('Smashed Avocado Sourdough',
 'Crushed Hass avocado, heirloom cherry tomatoes, French feta cheese, pickled radishes, and a soft-poached egg on rustic sourdough toast.',
 20.00, 'Breakfast', 1),

-- Lunch
('Augustus Caesar Salad',
 'Crisp baby romaine hearts, rosemary grilled chicken breast, fresh herb sourdough croutons, Parmigiano-Reggiano shavings, and Caesar dressing.',
 22.00, 'Lunch', 1),

('Palace Wagyu Burger',
 'Aged white cheddar, sweet caramelized onions, black truffle aioli, baby arugula, on toasted brioche. Served with gold-dusted sea salt fries.',
 28.00, 'Lunch', 1),

('Wild Mushroom Risotto',
 'Slow-simmered Carnaroli rice with forest chanterelle and porcini mushrooms, dry white wine, truffle butter, and aged pecorino.',
 26.00, 'Lunch', 1),

-- Dinner
('Prime Filet Mignon',
 '8oz tender center-cut beef filet, garlic potato puree, grilled asparagus spears, finished with a classic Bordelaise red wine reduction.',
 45.00, 'Dinner', 1),

('Pan-Seared Chilean Sea Bass',
 'Delicate white sea bass fillet, seasonal local asparagus spears, Meyer lemon saffron emulsion, and heirloom baby tomato confit.',
 38.00, 'Dinner', 1),

('Hand-Cut Black Truffle Pasta',
 'Artisanal tagliatelle tossed with fresh black summer truffle tapenade, mountain butter cream sauce, and grated Reggiano.',
 32.00, 'Dinner', 1),

-- Drinks
('Imperial Smoked Old Fashioned',
 'Premium rye whiskey, bitters, raw sugar cube, express orange oils, wood-smoke presentation inside a crystal decanter.',
 18.00, 'Drinks', 1),

('Organic Cold-Pressed Elixir',
 'Invigorating blend of sweet kale, organic spinach, crisp ginger root, lemon juice, green apple, and cucumber.',
 11.00, 'Drinks', 1),

('Grand Reserve Signature Espresso',
 'House-roasted arabica single-origin espresso, served with warm milk foam and a piece of Belgian dark chocolate.',
 8.00, 'Drinks', 1),

-- Desserts
('24K Gold Chocolate Lava Cake',
 'Decadent chocolate sponge cake filled with molten Madagascar dark chocolate ganache, topped with genuine edible gold leaf and Tahitian vanilla gelato.',
 16.00, 'Desserts', 1),

('Vanilla Crème Brûlée',
 'Rich, smooth egg-yoke custard flavored with organic vanilla bean pod and caramelized brown sugar topping.',
 14.00, 'Desserts', 1),

('Classic Venetian Tiramisu',
 'Layers of espresso-infused Italian ladyfinger cookies, delicate sweet mascarpone sabayon, and finished with organic raw cocoa powder dusting.',
 14.00, 'Desserts', 1);