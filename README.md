# Bus Booking System

Full-stack booking system for an intercity bus company in Syria: trips and recurring schedules, seat-map booking, cash and Sham Cash payments, and three roles.

> **Status: work in progress.** The backend, web and mobile projects are set up; the features are being built.

---

## The Problem

The company runs buses between Syrian cities, but customers can't easily see which trips exist, their prices, or which seats are free. Booking happens only at the office.

This system gives:

- **Admin:** a dashboard to manage buses, create trips, and set recurring schedules (daily, weekly, monthly).
- **Receptionist:** a fast screen to book seats for walk-in customers and confirm payments.
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
- **Payments.** Cash at the office, or Sham Cash: the customer enters the transfer number and a receptionist verifies it.
- **Fixed data.** The 14 Syrian governorates and the 6 bus types are constants, not editable tables.
- **Arabic first.** Right-to-left UI.

## Roles

| Action | Admin | Receptionist | Customer |
| :--- | :---: | :---: | :---: |
| Manage buses, trips, schedules, receptionists | ✅ | ❌ | ❌ |
| View trips and seat maps | ✅ | ✅ | ✅ |
| Book for a walk-in customer | ✅ | ✅ | ❌ |
| Book for themselves (app) | ❌ | ❌ | ✅ |
| Confirm payment | ✅ | ✅ | ❌ |
| Cancel a booking | ✅ any | ✅ any | ✅ own |
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

## Getting Started

Needs Node.js 20+ and MongoDB (local, or a MongoDB Atlas connection string).

```bash
# Backend: http://localhost:4000/api/health
cd backend
npm install
cp .env.example .env
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
