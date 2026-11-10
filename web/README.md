# Rihlati web: admin and reception dashboard

Next.js (App Router) + TypeScript, Arabic right-to-left, built from the team's Figma screens (font Cairo, colors in `src/app/globals.css`).

| Page | Who | What |
| :--- | :--- | :--- |
| `/login` | staff | Sign in with phone and password ("remember me" keeps the session) |
| `/dashboard` | admin | Today's numbers, revenue chart, occupancy by route, today's trips, receptionists |
| `/booking` | admin, reception | Search trips, pick seats on the bus map, book with cash or Sham Cash |
| `/bookings` | admin, reception | All bookings, trip passenger list, change seat, cancel, record refund |
| `/buses` | admin | Buses with a live seat map preview |
| `/trips` | admin | Trips (create, edit, cancel, departed/arrived) and recurring schedules |

## Run

```bash
npm install
npm run dev   # http://localhost:3000
```

The API address defaults to `http://localhost:4000/api`. To change it, create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```
