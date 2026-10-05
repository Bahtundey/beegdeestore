# E-commerce App

A simple, realistic e-commerce application with a vanilla HTML/CSS/JavaScript
frontend and a Node.js + Express + MongoDB backend. Product images are stored
on Cloudinary.

## Stack

- Frontend: plain HTML, CSS, and JavaScript (no framework)
- Backend: Node.js + Express
- Database: MongoDB (via Mongoose)
- Image storage: Cloudinary

## Project structure

```
ecommerce-app/
├── frontend/          # HTML, CSS, JS (served as static files)
│   ├── *.html         # public pages
│   ├── admin/         # admin pages (dashboard, products, add/edit product)
│   ├── css/           # stylesheets
│   ├── js/            # api.js + page scripts
│   └── assets/        # static images/icons
├── backend/           # Express API
│   ├── server.js
│   ├── config/        # db.js, cloudinary.js
│   ├── models/        # User, Product, Cart
│   ├── controllers/   # auth, user, product, cart
│   ├── routes/        # auth, users, products, cart
│   ├── middleware/    # auth, admin, error
│   └── services/      # paystackService (later batch)
└── package.json       # root — runs backend + frontend together
```

## Setup

### 1. Prerequisites

- Node.js (v18+)
- A running MongoDB instance (local or MongoDB Atlas)

### 2. Install dependencies

```bash
npm run install:all
```

This installs the root dev dependency (`concurrently`) and the backend
dependencies. The frontend is served by a small dependency-free Node script
(`serve.js`).

### 3. Configure environment variables

Create `backend/.env` (a template exists at `backend/.env.example`). You must
provide these values — they are NOT in the repository:

| Variable                  | Where to get it                                        |
| ------------------------- | ------------------------------------------------------ |
| `MONGODB_URI`             | Your MongoDB connection string (Atlas dashboard, or `mongodb://127.0.0.1:27017/ecommerce` for local) |
| `JWT_SECRET`              | Any long random string you generate yourself            |
| `CLOUDINARY_CLOUD_NAME`   | Cloudinary dashboard → Account details                  |
| `CLOUDINARY_API_KEY`      | Cloudinary dashboard → API Keys                         |
| `CLOUDINARY_API_SECRET`   | Cloudinary dashboard → API Keys                         |
| `PAYSTACK_SECRET_KEY`     | Paystack dashboard → API Keys (used in a later batch)   |

Example:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/ecommerce
JWT_SECRET=some_long_random_secret
CLOUDINARY_CLOUD_NAME=mycloud
CLOUDINARY_API_KEY=1234567890
CLOUDINARY_API_SECRET=abcdefghijklmnop
PAYSTACK_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:5500
PORT=5050
```

> Never commit `backend/.env`. It is already listed in `.gitignore`.

### 4. Run the app

```bash
npm run dev
```

This starts both servers together:

- Backend API → http://localhost:5050
- Frontend → http://localhost:5500

> Note for macOS: the "AirPlay Receiver" service occupies port 5000, which is
> why the backend defaults to 5050. If you disable AirPlay Receiver in
> System Settings → General → AirDrop & Handoff, you can set `PORT=5000` in
> `backend/.env` (and update `frontend/js/api.js` to match).

## Creating an admin user

Registration always creates a normal `user`. There is intentionally no way to
self-register as an admin. To create an admin, run this one-off script from the
`backend/` directory after the server has started (or via `mongosh`):

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const existing = await User.findOne({ email: 'admin@example.com' });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
  } else {
    await User.create({ name: 'Store Admin', email: 'admin@example.com', password: 'changeme123', role: 'admin' });
  }
  console.log('Admin ready: admin@example.com');
  await mongoose.disconnect();
})();
"
```

## API overview

| Method | Endpoint          | Access        | Description                                   |
| ------ | ----------------- | ------------- | --------------------------------------------- |
| POST   | `/auth/login`     | Public        | Login (users AND admins) → JWT                |
| GET    | `/auth/me`        | Authenticated | Current user from the database                |
| POST   | `/users`          | Public        | Register (always creates a `user`)            |
| GET    | `/users`          | Admin         | List users (no passwords)                     |
| GET    | `/users/:id`      | Self/admin    | A user's safe profile                         |
| PUT    | `/users/:id`      | Self/admin    | Update profile (role changes are admin-only)  |
| DELETE | `/users/:id`      | Admin         | Delete a user                                 |
| GET    | `/products`       | Public        | List products (`?category=` filter)           |
| GET    | `/products/:id`   | Public        | Single product                                |
| POST   | `/products`       | Admin         | Create product (multipart, image)             |
| PUT    | `/products/:id`   | Admin         | Update product (optional new image)           |
| DELETE | `/products/:id`   | Admin         | Delete product + Cloudinary image             |
| GET    | `/carts`          | Authenticated | Current user's cart (subtotals + total)       |
| POST   | `/carts`          | Authenticated | Add product to cart (stock-checked)           |
| GET    | `/carts/:id`      | Owner         | A cart (owner only)                           |
| PUT    | `/carts/:id`      | Owner         | Replace cart items (owner only)               |
| DELETE | `/carts/:id`      | Owner         | Clear/delete own cart                         |
| POST   | `/payments/initialize`       | Authenticated | Initiate a Paystack payment (amount from cart) |
| GET    | `/payments/verify/:reference` | Authenticated | Verify payment with Paystack → create order   |
| GET    | `/orders`          | Authenticated | Customer's own orders                         |
| GET    | `/orders/:id`      | Owner         | A single order (owner only)                   |
| GET    | `/admin/dashboard` | Admin         | Business statistics (products, orders, revenue) |
| GET    | `/admin/orders`    | Admin         | All orders                                    |
| GET    | `/admin/orders/:id`| Admin         | A single order                                |
| PUT    | `/admin/orders/:id`| Admin         | Update orderStatus only                       |

Authorization flow: the frontend sends the JWT in the `Authorization: Bearer
<token>` header. The backend verifies the token, reloads the user from MongoDB,
and checks `role === "admin"` before any admin-only operation. The role is never
trusted from the client.

## What's implemented

- Project scaffolding and dual-server `npm run dev`
- MongoDB connection (Atlas) and Cloudinary image upload flow
- User model + registration (normal users only) + password hashing (bcrypt)
- Login with JWT for both users and admins
- Auth + admin middleware (role comes from MongoDB)
- Product model + full CRUD (public read, admin write)
- Cloudinary image upload/replace/delete on products
- Cart: add/update/remove items, quantity controls, stock validation, and
  totals computed server-side from real product prices (per-user ownership)
- User profile: view + update name/email/password; role escalation blocked
- Checkout + Paystack: server-side payment initialization (amount always
  computed from the cart), server-side verification (Paystack is the authority),
  order creation with item snapshots, stock reduction, and cart clearing
- Orders: customer order history/details; admin order list/details + status
  updates (paymentStatus is never writable — only Paystack sets it)
- Currency: single configured currency (PAYSTACK_CURRENCY) used consistently
  across products, cart, checkout, orders, and admin
- Frontend: home (featured + categories), product listing with search/filter,
  product details with quantity selector, cart page, checkout, payment
  success/failure pages, order history/details, profile, login/register, and
  admin dashboard/products/orders/add/edit pages

All three batches are complete: browse → cart → checkout → Paystack → order,
plus admin product and order management.

## Architecture

```
Customer browser (vanilla HTML/CSS/JS)
        │  fetch() with Authorization: Bearer <JWT>
        ▼
Express REST API  (backend/)
        │
        ├── controllers → models → MongoDB (Atlas)
        ├── middleware  (auth + admin + error handling)
        └── services
              ├── paystackService  →  Paystack (payments)
              └── config/cloudinary →  Cloudinary (product images)
```

Key rules:

- The frontend is a presentation layer and API consumer. It never talks to
  MongoDB directly.
- The backend owns all business logic and security: it validates every request,
  calculates prices/totals from the database, and verifies payments with
  Paystack.
- The frontend never has access to MongoDB credentials, the Cloudinary API
  secret, the Paystack secret key, or the JWT secret. Those live only in
  `backend/.env`.

Request flow examples:

- Product image: admin form → FormData → Express → multer → Cloudinary →
  secure URL → MongoDB. The frontend later displays the Cloudinary URL from
  `GET /products`.
- Payment: "Pay Now" → `POST /payments/initialize` → backend computes the total
  from the cart → Paystack returns an authorization URL → customer pays → the
  backend verifies the reference with Paystack → creates the order → reduces
  stock → clears the cart.

## Deployment

The frontend and backend can be deployed separately.

1. **Backend** (e.g. Render, Railway, a VPS): run `node server.js` (or
   `npm --prefix backend start`) with the environment variables from
   `backend/.env.example` set to production values:
   - `MONGODB_URI` — your production MongoDB (Atlas) connection string
   - `JWT_SECRET`, `CLOUDINARY_*`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_CURRENCY`
   - `FRONTEND_URL` — your deployed frontend URL (this controls CORS and the
     Paystack callback)
   - `PORT` — the port the API listens on

2. **Frontend** (e.g. Netlify, Vercel, GitHub Pages, or any static host):
   deploy the `frontend/` folder as static files. Change one line in
   `frontend/js/api.js` — `API_BASE_URL` — to point at your deployed backend
   URL (e.g. `https://api.yourstore.com`). Also update the `CURRENCY` value in
   `frontend/js/auth.js` if your store currency differs.

3. The Paystack callback URL uses `FRONTEND_URL`, so once `FRONTEND_URL` points
   at the deployed frontend, customers are returned there after payment.

No localhost URLs are baked into production logic beyond these two documented
configuration points (`API_BASE_URL` in the frontend and the `.env` variables
in the backend).
