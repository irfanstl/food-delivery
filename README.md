# MangoBite: Food Delivery App

MangoBite is a full-stack food delivery web app. Customers can browse restaurants and menus, place orders, pay online and track order status. The backend is an Express API on top of a MySQL database that does a lot of its business logic in stored procedures, functions and triggers.

## Features

- Browse restaurants and menu items
- User sign-up and login with OTP-based verification and Firebase authentication
- Saved delivery addresses, with the first address set as the default automatically
- Place, view and cancel orders (only orders still in `placed` status can be cancelled)
- Online payments through Razorpay
- Map integration with Google Maps
- Order lifecycle: `placed → confirmed → preparing → out_for_delivery → delivered` (or `cancelled`)
- Audit log of every order status change
- Revenue and order analytics queries for restaurants and users

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, React Router, Lucide icons, React Hot Toast |
| Backend | Node.js, Express 5, CORS, dotenv |
| Database | MySQL 8 (via `mysql2`) |
| Auth | Firebase / Firebase Admin |
| Payments | Razorpay |
| Maps | Google Maps (`@react-google-maps/api`) |
| Tooling | ESLint, PostCSS, Autoprefixer, GitHub Actions |

## Project Structure

```
food-delivery/
├── .github/workflows/     CI workflows
├── backend/               Express server (auth, payment and API routes)
├── database/              Database files
├── public/                Static assets
├── src/                   React frontend
├── mangobite_plsql.sql    Stored procedures, functions, triggers, cursors
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- MySQL 8
- Firebase project, Razorpay account and Google Maps API key (for the features that use them)

### 1. Clone and install

```bash
git clone https://github.com/irfanstl/food-delivery.git
cd food-delivery
npm install
```

### 2. Set up the database

Create a database named `mangobite`, create the base tables, then load the stored logic:

```bash
mysql -u <user> -p mangobite < mangobite_plsql.sql
```

The SQL file expects these tables to exist already: `users`, `addresses`, `restaurants`, `menu_items`, `orders` and `orders_items`. It creates the `order_status_log` table itself.

### 3. Configure environment variables

Create a `.env` file in the project root with your MySQL, Firebase, Razorpay and Google Maps credentials. Keep it out of version control. The exact variable names are read in the files under `backend/`.

### 4. Run the app

Use two terminals.

```bash
# Terminal 1: frontend (Vite dev server)
npm run dev
```

```bash
# Terminal 2: backend (Express API on port 5001)
npm run server
```

Open the URL Vite prints (usually `http://localhost:5173`). The API runs at `http://localhost:5001`.

## Available Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the frontend dev server |
| `npm run server` | Start the Express backend |
| `npm run build` | Build the frontend for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## API Overview

| Prefix | Purpose |
| --- | --- |
| `/api/auth` | Authentication and OTP |
| `/api/payment` | Razorpay payments |
| `/api` | Restaurants, menus, orders and other app data |

## Database Logic (`mangobite_plsql.sql`)

**Stored procedures:** `place_order`, `get_user_orders`, `cancel_order`, `update_order_status`, `summarize_orders` (cursor), `get_restaurant_revenue`, `find_inactive_users` (cursor)

**Functions:** `get_total_items`, `get_order_grand_total`, `is_restaurant_active`, `get_user_total_spend`

**Triggers:**
- `check_item_availability` blocks ordering unavailable items
- `update_order_total` recalculates the order total when items are added
- `prevent_delivered_cancellation` stops delivered orders from being cancelled
- `log_order_status_change` writes status changes to `order_status_log`
- `set_default_address` marks a user's first address as default

The file also includes analytical queries: top-selling items, orders by status, daily revenue and average order value per user.

## Contributing

Pull requests are welcome. For larger changes, open an issue first to discuss what you would like to change.

## License

No license has been specified yet. Add a `LICENSE` file (for example MIT) to state how others may use this code.
