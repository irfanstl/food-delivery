import express from 'express';
import { mysqlDB, mongoDB } from './db.js';
import { syncUser, pool, addRestaurant, getAddresses, addAddress, getRestaurants, getCategories, getFeaturedItems, getPendingRestaurants, approveRestaurant, getAllRestaurantsAdmin, getCart, addToCart, removeFromCart, clearCart, getOrders, placeOrderViaProcedure, addMenuItem, updateMenuItem, deleteMenuItem, getRestaurantMenu } from './mysql-connection.js';

import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getUserId = (req) => {
  const id = parseInt(req.header('X-User-Id'));
  return isNaN(id) ? null : id;
};

// ======================= AUTH =======================

router.post('/auth/sync', async (req, res) => {
  try {
    const { email, name, profilePic, role } = req.body;
    const user = await syncUser(email, name, profilePic, role);
    
    // Send a welcome notification for new users
    if (user.isNew) {
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [user.user_id, '🎉 Welcome to MangoBite!', `Hi ${name}! Your account has been created. Start exploring delicious food around you.`, 'info']
      );
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======================= CATEGORIES =======================

router.get('/categories', async (req, res) => {
  await delay(400);
  const q = (req.query.q || '').toLowerCase();
  let categories = await getCategories();
  if (!categories || categories.length === 0) categories = mysqlDB.categories;
  if (!q) return res.json(categories);
  res.json(categories.filter(c => c.name.toLowerCase().includes(q)));
});

// ======================= RESTAURANTS =======================

router.get('/restaurants', async (req, res) => {
  const q = req.query.q || '';
  let dbRestaurants = await getRestaurants(q);
  if (!dbRestaurants || dbRestaurants.length === 0) {
    const all = mysqlDB.restaurants || [];
    return res.json(q ? all.filter(r => r.name?.toLowerCase().includes(q.toLowerCase())) : all);
  }
  res.json(dbRestaurants);
});

router.get('/restaurants/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const restaurants = await getRestaurants();
    const rest = restaurants.find(r => r.restaurant_id === id);
    if (!rest) return res.status(404).json({ message: "Not found" });
    const dbMenu = await getRestaurantMenu(id);
    const menuItems = dbMenu.map(m => ({
      id: m.item_id, name: m.name,
      price: m.price.toString().startsWith("₹") ? m.price : "₹" + m.price,
      description: m.description,
      img: m.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80",
      time: m.time || "15-20 min", cal: m.cal || "350 kcal",
      categoryId: m.category_id, restaurantId: m.restaurant_id
    }));
    res.json({
      id: rest.restaurant_id, name: rest.name,
      rating: rest.rating || 4.5, reviewsCount: rest.reviews_count || 100,
      deliveryTime: rest.delivery_time || "20-30 min",
      deliveryFee: rest.delivery_fee === "0.00" ? "Free" : "₹" + rest.delivery_fee,
      type: rest.type,
      img: rest.img || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80",
      bannerImg: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
      address: rest.address || "123 Food Street, City",
      coordinates: { lat: 40.7128, lng: -74.0060 },
      isVerified: true, openTime: "10:00 AM - 11:00 PM",
      menu: menuItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/restaurants/:id/reviews', async (req, res) => {
  await delay(600);
  const id = parseInt(req.params.id);
  const reviews = mongoDB.reviews.filter(r => r.restaurantId === id);
  res.json(reviews.length > 0 ? reviews : mongoDB.reviews);
});

router.post('/restaurants/:id/reviews', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, rating, comment } = req.body;
  
  if (!rating || !comment) return res.status(400).json({ error: "Rating and comment are required." });

  const newReview = {
    id: "rev_" + Date.now(),
    restaurantId: id,
    name: name || "Anonymous",
    avatar: (name || "A")[0].toUpperCase(),
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    rating: parseInt(rating),
    comment
  };

  mongoDB.reviews.unshift(newReview);
  res.status(201).json(newReview);
});

router.get('/restaurants/:id/photos', async (req, res) => {
  await delay(400);
  res.json(mysqlDB.photos || []);
});

router.get('/restaurants/:id/menu', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const items = await getRestaurantMenu(id);
    res.json(items.map(m => ({
      id: m.item_id, name: m.name,
      price: m.price.toString().startsWith("₹") ? m.price : "₹" + m.price,
      description: m.description || '',
      img: m.img || '', time: m.time || '', cal: m.cal || ''
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================= PARTNER RESTAURANT =======================

router.get('/my-restaurant', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const [rows] = await pool.execute(
      'SELECT * FROM restaurants WHERE owner_user_id = ? LIMIT 1', [userId]
    );
    if (rows.length === 0) return res.json(null);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/my-restaurant', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { name, type, address, delivery_time, delivery_fee, img } = req.body;
    await pool.execute(
      'UPDATE restaurants SET name=?, type=?, address=?, delivery_time=?, delivery_fee=?, img=? WHERE owner_user_id=?',
      [name, type, address, delivery_time, delivery_fee, img, userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================= MENU MANAGEMENT =======================

router.post('/menu', async (req, res) => {
  try {
    const { name, price, description, img, time, cal, restaurantId } = req.body;
    const result = await addMenuItem(restaurantId, name, parseFloat(price), description, img, time, cal);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/menu/:id', async (req, res) => {
  try {
    const { name, price, description, img, time, cal } = req.body;
    await updateMenuItem(parseInt(req.params.id), name, parseFloat(price), description, img, time, cal);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/menu/:id', async (req, res) => {
  try {
    await deleteMenuItem(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================= FEATURED & BRANDS =======================

router.get('/featured', async (req, res) => {
  try {
    await delay(400);
    const q = (req.query.q || '').toLowerCase();
    let featured = await getFeaturedItems();
    if (!featured || featured.length === 0) featured = mysqlDB.featuredItems || [];
    else featured = featured.map(f => ({
      ...f,
      id: f.item_id,
      price: f.price.toString().startsWith("₹") ? f.price : "₹" + f.price,
      restaurantName: f.restaurantName || "MangoBite Selection",
      time: f.time || "20-30 min", cal: f.cal || "300 kcal", rating: f.rating || 4.5
    }));
    if (!q) return res.json(featured);
    res.json(featured.filter(f => f.name?.toLowerCase().includes(q) || f.restaurantName?.toLowerCase().includes(q)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/brands', async (req, res) => {
  await delay(500);
  const q = (req.query.q || '').toLowerCase();
  const brands = mongoDB.brands || mysqlDB.topBrands || [];
  if (!q) return res.json(brands);
  res.json(brands.filter(b => b.name.toLowerCase().includes(q)));
});

router.get('/food/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [rows] = await pool.execute('SELECT * FROM menu_items WHERE item_id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Food item not found" });
    const f = rows[0];
    res.json({
      ...f,
      id: f.item_id,
      price: f.price.toString().startsWith("₹") ? f.price : "₹" + f.price,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/food/:id/comments', async (req, res) => {
  await delay(500);
  const id = parseInt(req.params.id);
  const comments = (mongoDB.foodComments || []).filter(c => c.foodId === id);
  res.json(comments);
});

// ======================= CART =======================

router.get('/cart', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.json([]);
  const cart = await getCart(userId);
  res.json(cart);
});

router.post('/cart', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { id, quantity } = req.body;
    await addToCart(userId, id, quantity || 1);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/cart/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const id = parseInt(req.params.id);
    const { action } = req.body;
    if (action === 'add') await addToCart(userId, id);
    else if (action === 'sub') await removeFromCart(userId, id);
    const cart = await getCart(userId);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/cart/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const id = parseInt(req.params.id);
    await removeFromCart(userId, id);
    const cart = await getCart(userId);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======================= ORDERS =======================

router.get('/orders', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.json([]);
    const orders = await getOrders(userId);
    res.json(orders);
  } catch (error) {
    res.json([]);
  }
});

router.post('/create-order', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { addressId, deliveryFee, amount } = req.body;

    if (amount) {
      // Razorpay order creation
      const options = { amount, currency: "INR", receipt: "receipt_order_" + Date.now() };
      const order = await razorpay.orders.create(options);
      return res.json(order);
    }

    const orderId = await placeOrderViaProcedure(userId, addressId, deliveryFee || 50);
    
    // Add order notification
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, '🍽️ Order Placed!', `Your order #${orderId} has been placed and is being prepared.`, 'order']
    );

    res.json({ success: true, orderId, message: "Order placed successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to place order", error: error.message });
  }
});

router.post('/confirm-order', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { addressId, deliveryFee } = req.body;

    const orderId = await placeOrderViaProcedure(userId, addressId || 1, deliveryFee || 50);
    
    // Add order notification
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, '🍽️ Order Placed!', `Your order #${orderId} has been confirmed and is being prepared.`, 'order']
    );

    res.json({ success: true, message: "Order confirmed successfully!" });
  } catch (error) {
    console.error("Error confirming order:", error);
    res.status(500).json({ message: "Failed to confirm order", error: error.message });
  }
});

// ======================= ADDRESSES =======================

router.get('/addresses', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.json([]);
    const addresses = await getAddresses(userId);
    res.json(addresses.map(addr => ({
      id: addr.address_id, type: addr.type || 'Home',
      street: addr.street, city: addr.city, zip: addr.zip,
      isDefault: addr.is_Default === 1
    })));
  } catch (error) {
    res.json([]);
  }
});

router.post('/addresses', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { street, city, zip, type } = req.body;
    if (!street || !city || !zip) return res.status(400).json({ message: "Street, city, and zip are required" });
    const result = await addAddress(userId, street, city, zip, type || 'Home', 0);
    res.status(201).json({ message: "Address added successfully", id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: "Failed to add address", error: error.message });
  }
});

// ======================= NOTIFICATIONS =======================

router.get('/notifications', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.json([]);
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    res.json(mongoDB.notifications || []);
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const userId = getUserId(req);
    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?',
      [parseInt(req.params.id), userId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/notifications', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.json([]);
    await pool.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
    res.json([]);
  } catch (error) {
    mongoDB.notifications = [];
    res.json([]);
  }
});

// ======================= ADMIN ROUTES =======================

router.get('/admin/users', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT user_id as id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.json([]);
  }
});

router.get('/admin/stats', async (req, res) => {
  try {
    const [[orderCount]] = await pool.execute('SELECT COUNT(*) as cnt FROM orders');
    const [[userCount]] = await pool.execute('SELECT COUNT(*) as cnt FROM users');
    const [[restCount]] = await pool.execute('SELECT COUNT(*) as cnt FROM restaurants');
    const [[revenue]] = await pool.execute('SELECT COALESCE(SUM(total_amount),0) as total FROM orders');
    res.json({
      orders: orderCount.cnt,
      users: userCount.cnt,
      restaurants: restCount.cnt,
      revenue: '₹' + Number(revenue.total).toLocaleString('en-IN')
    });
  } catch (err) {
    res.json({ orders: 0, users: 0, restaurants: 0, revenue: '₹0' });
  }
});

router.get('/admin/payments', async (req, res) => {
  res.json([
    { id: 'pay_razor_001', method: 'Razorpay', amount: '₹1,200', status: 'success', date: '10m ago' },
    { id: 'pay_razor_002', method: 'Razorpay', amount: '₹850', status: 'failed', date: '1h ago' },
    { id: 'pay_razor_003', method: 'Razorpay', amount: '₹2,400', status: 'success', date: '3h ago' },
  ]);
});

router.get('/admin/restaurants/pending', async (req, res) => {
  try {
    const pending = await getPendingRestaurants();
    res.json(pending.map(r => ({
      id: r.restaurant_id, name: r.name || 'Restaurant ' + r.restaurant_id,
      type: r.type, deliveryTime: r.delivery_time, deliveryFee: r.delivery_fee,
      img: r.img, address: r.address
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/admin/restaurants/all', async (req, res) => {
  try {
    const all = await getAllRestaurantsAdmin();
    res.json(all.map(r => ({
      id: r.restaurant_id, name: r.name, type: r.type,
      deliveryTime: r.delivery_time, deliveryFee: r.delivery_fee,
      img: r.img, address: r.address, isActive: r.is_active
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/admin/restaurants/:id/approve', async (req, res) => {
  try {
    await approveRestaurant(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/partner/register', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { name, type, address, delivery_time, delivery_fee, img, category_id } = req.body;
    const result = await addRestaurant({ name, type, address, delivery_time, delivery_fee, img, category_id, is_active: 0 });
    await pool.execute('UPDATE restaurants SET owner_user_id = ? WHERE restaurant_id = ?', [userId, result.insertId]);
    await pool.execute('UPDATE users SET role = ? WHERE user_id = ?', ['partner', userId]);
    
    // Notification for registration
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, '🏪 Restaurant Registered!', `Your restaurant "${name}" has been submitted for review. We'll notify you once it's approved.`, 'info']
    );

    res.status(201).json({ success: true, restaurantId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
