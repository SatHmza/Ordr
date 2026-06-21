# MenuQR — Digital Menu & Table Ordering System

**Live demo:** [ordr-rose.vercel.app](https://ordr-rose.vercel.app)

---

## What is MenuQR?

MenuQR is a QR code-based digital menu and ordering system built for cafés, bars, and restaurants. It replaces physical menus and verbal ordering with a seamless digital experience — customers scan a QR code on their table, browse the menu, and place orders directly from their phone. Orders appear instantly on the kitchen screen.

No app download required. No friction. No paper menus.

---

## How It Works

```
Customer scans QR code on table
        ↓
Full menu loads instantly on their phone
(photos, prices, descriptions in Arabic, French, or English)
        ↓
Customer builds their order and places it
        ↓
Order appears in real time on the kitchen display
        ↓
Kitchen staff confirm, prepare, and mark as ready
        ↓
Waiter serves the order
```

---

## Features

### For Customers
- Scan QR code — no app download, no login needed
- Full menu with photos, prices, and descriptions
- Arabic, French, and English language support
- Add items to cart, adjust quantities
- Leave notes for the kitchen (e.g. "no onions")
- Place order in one tap
- Instant confirmation on screen

### For Kitchen Staff
- Real-time order display on any tablet or screen
- Orders appear the second they are placed
- One-tap status updates: Pending → Confirmed → Preparing → Ready → Served
- Color-coded cards by status
- Notification on new orders

### For Restaurant Owners
- Clean dashboard with today's orders and revenue at a glance
- Full menu editor — add, edit, and delete categories and items
- Toggle items as available or unavailable in real time
- Table management — create tables, generate and download QR codes instantly
- Multi-language menu (Arabic, French, English per item)
- Direct link to kitchen display

---

## Built For Morocco

- Works on cheap Android phones (optimized for low-end devices)
- Supports Arabic with right-to-left layout
- Prices in MAD (Moroccan Dirham)
- French-first interface, switchable to Arabic or English
- Fast loading on slow mobile connections

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend & Backend | Next.js 16 (React) |
| Database | Supabase (PostgreSQL) |
| Real-time orders | Supabase Realtime |
| Authentication | Supabase Auth |
| Styling | Tailwind CSS |
| QR Generation | qrcode |
| Hosting | Vercel |

---

## Pricing Model (SaaS)

MenuQR is a multi-tenant SaaS platform. Each restaurant gets their own account, menu, tables, and QR codes.

| Plan | Price | Features |
|---|---|---|
| Starter | Free | 1 restaurant, up to 3 tables |
| Pro | 199 MAD/month | Unlimited tables, analytics, priority support |
| Business | 499 MAD/month | Multiple branches, custom branding, API access |

---

## Getting Started (For Restaurants)

1. Create an account at [ordr-rose.vercel.app](https://ordr-rose.vercel.app)
2. Set up your menu — add categories and items with photos and prices
3. Create your tables — download a QR code for each one
4. Print the QR codes and place them on your tables
5. Open the kitchen display on a tablet in the kitchen
6. Start receiving orders

Setup takes less than 30 minutes.

---

## Security

- All restaurant data is fully isolated — owners can only see their own data
- Row-Level Security enforced at the database level
- Anonymous ordering — no customer data is collected or stored
- HTTPS everywhere

---

## Contact

Built by SatHmza — [hamzast2003@gmail.com](mailto:hamzast2003@gmail.com)
