# Bus Booking System

Full-stack booking system for an intercity bus company in Syria: trips and recurring schedules, seat-map booking, cash and Sham Cash payments, and three roles.

> **Status:** the backend API and the web dashboard (admin + reception) are done. The customer mobile app is next.

---

## The Problem

The company runs buses between Syrian cities, but customers can't easily see which trips exist, their prices, or which seats are free. Booking happens only at the office.

This system gives:

- **Admin:** a dashboard to manage buses, create trips, and set recurring schedules (daily, weekly, monthly).
- **Receptionist:** a fast screen to book seats for walk-in customers, change seats, cancel, and record refunds.
- **Customer:** a mobile app to browse trips, pick a seat from the bus layout, and book.

## Features

- **Seat map built from the bus type.** 3 classes × 2 sizes = 6 layouts, generated in code, not drawn by hand:

  | Class | Layout | Large (11 rows) | Medium (9 rows) |
  | :--- | :---: | :---: | :---: |
  | Regular | 2+2 (+1 back middle seat) | 45 | 37 |
  | First class | 2+1 | 33 | 27 |
  | Business | 1+1 | 22 | 18 |

- **No double booking.** Booked seats live on the trip document and are reserved with one atomic MongoDB update that only succeeds if every requested seat is still free; otherwise the API returns `409`.
- **Recurring schedules.** A daily job keeps trips generated 30 days ahead, without creating duplicates.
- **Payments.** The app takes Sham Cash only: the customer enters the transfer number and the booking is confirmed at once (no "pending" state). The office takes cash or Sham Cash.
- **Cancellation and refunds.** Customers cancel from the app up to 2 hours before departure; staff can cancel until departure. Seats go back on sale at once, and reception records the manual refund (`refunded`).
- **Fixed data.** The 14 Syrian governorates and the 6 bus types are constants, not editable tables.
- **Arabic first.** Right-to-left UI.

## Roles

| Action | Admin | Receptionist | Customer |
| :--- | :---: | :---: | :---: |
| Manage buses, trips, schedules, receptionists | ✅ | ❌ | ❌ |
| View trips and seat maps | ✅ | ✅ | ✅ |
| Book for a walk-in customer | ✅ | ✅ | ❌ |
| Book for themselves (app) | ❌ | ❌ | ✅ |
| Take payment at the office, record refunds | ✅ | ✅ | ❌ |
| Cancel a booking | ✅ any | ✅ any | ✅ own, up to 2h before |
| Trip manifest | ✅ | ✅ | ❌ |
| Reports | ✅ | ❌ | ❌ |

## Tech Stack

| Part | Technology |
| :--- | :--- |
| Backend | Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, bcrypt, node-cron, zod |
| Web (Admin + Reception) | Next.js, TypeScript, Tailwind CSS |
| Mobile (Customer) | React Native (Expo), TypeScript |

## Data Model

Five collections: `users`, `buses`, `trips`, `tripschedules`, `bookings`. Passenger seats are embedded in each booking.

## Repository Structure

```
bus-booking-system/
├── backend/     # Express + MongoDB API
├── web/         # Next.js: Admin + Receptionist
└── mobile/      # React Native (Expo): Customer
```

## API

Base URL `/api`. Every success is `{ data }` (paged lists add `{ meta }`); every error is `{ code, message }`.

| Who | Endpoints |
| :--- | :--- |
| Public | `GET /cities` · `GET /bus-types` · `GET /trips?from&to&date&class` · `GET /trips/:id` |
| Auth | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` |
| Customer | `POST /bookings` · `GET /me/bookings` · `POST /bookings/:id/cancel` |
| Reception + admin | `GET /staff/trips?date` · `GET /staff/trips/:id/manifest` · `GET /staff/bookings?q&date&status&refunded&page` · `POST /staff/bookings` · `PATCH /staff/bookings/:id/change-seat` · `POST /staff/bookings/:id/cancel` · `PATCH /staff/bookings/:id/refund` |
| Admin | CRUD `/admin/buses`, `/admin/trips`, `/admin/schedules`, `/admin/receptionists` · `POST /admin/trips/:id/cancel` · `PATCH /admin/trips/:id/status` · `GET /admin/reports/occupancy\|revenue?from&to` · `GET /admin/reports/summary?date` |

Background jobs (node-cron, Damascus time): every night the schedules are filled 30 days ahead, and every 5 minutes trips past their departure time become `DEPARTED`.

## Getting Started

Needs Node.js 20+ and MongoDB (local, or a MongoDB Atlas connection string).

```bash
# Backend: http://localhost:4000/api/health
cd backend
npm install
cp .env.example .env
npm run seed:demo   # optional: demo staff, buses, schedules, two weeks of bookings (deletes the database first)
npm run dev

# Web: http://localhost:3000
cd web
npm install
npm run dev

# Mobile: scan the QR code with Expo Go
cd mobile
npm install
npm start
```

Demo logins after `seed:demo` (password `DEMO_PASSWORD` from `.env.example`): admin `0900000000`, reception `0944120981`.
For a real deployment use `npm run seed:admin` instead, which only creates the admin account.

## Roadmap

- [x] Analysis
- [x] UI design
- [x] Project setup (TypeScript in all three parts)
- [ ] Backend: auth and roles, buses, trips, schedules, bookings
- [ ] Web dashboard (Admin + Receptionist)
- [ ] Mobile app (Customer)
- [ ] Live demo

## License

[MIT](LICENSE)
