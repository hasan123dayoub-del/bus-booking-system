/**
 * The core promise of the system: a seat is sold once, even when many people book it at the same moment.
 * Runs the real Express app against a real MongoDB (MONGODB_URI; its database is wiped first).
 *
 *   npm test
 */
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { app } from "../src/app";
import { connectDB, disconnectDB } from "../src/config/db";
import { Booking, Bus, Trip, User } from "../src/models";
import { normalizeSyrianPhone } from "../src/utils/phone";

const PASSWORD = "Test12345";
let server: Server;
let base = "";
let tokens: string[] = [];

async function newTrip() {
  const bus = await Bus.create({ plateNumber: `T-${Date.now()}-${Math.random()}`, busClass: "REGULAR", size: "LARGE" });
  return Trip.create({ busId: bus._id, from: "DAMASCUS", to: "ALEPPO", seatPrice: 85000, departureAt: new Date(Date.now() + 2 * 86400000) });
}

function book(token: string, tripId: string, seatNumbers: number[], i: number) {
  return fetch(`${base}/api/bookings`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ tripId, seats: seatNumbers.map((seatNumber) => ({ seatNumber })), paymentRef: `SC${100000 + i}` }),
  }).then((r) => r.status);
}

const count = (statuses: number[]) => statuses.reduce<Record<number, number>>((m, s) => ({ ...m, [s]: (m[s] ?? 0) + 1 }), {});

before(async () => {
  await connectDB();
  await mongoose.connection.dropDatabase();
  const hash = await bcrypt.hash(PASSWORD, 10);
  const phones = ["0944123456", "0933245118", "0955877340"];
  for (const [i, phone] of phones.entries()) {
    await User.create({ name: `Customer ${i + 1}`, phone: normalizeSyrianPhone(phone), passwordHash: hash, role: "CUSTOMER" });
  }
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  tokens = await Promise.all(
    phones.map(async (phone) => {
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, password: PASSWORD }),
      });
      assert.equal(res.status, 200, "demo customer can log in");
      return (await res.json()).data.token as string;
    }),
  );
});

after(async () => {
  server?.close();
  await disconnectDB();
});

test("50 parallel requests for the same seat: exactly one booking", async () => {
  const trip = await newTrip();
  const statuses = await Promise.all(Array.from({ length: 50 }, (_, i) => book(tokens[i % tokens.length], String(trip._id), [7], i)));

  assert.deepEqual(count(statuses), { 201: 1, 409: 49 });
  const saved = await Trip.findById(trip._id).lean();
  assert.deepEqual(saved?.bookedSeats, [7]);
  assert.equal(await Booking.countDocuments({ tripId: trip._id }), 1);
});

test("overlapping multi-seat requests never share a seat", async () => {
  const trip = await newTrip();
  // Pairs that overlap on one seat: [1,2] [2,3] [3,4] ... raced 3 times each
  const pairs = Array.from({ length: 30 }, (_, i) => [(i % 10) + 1, (i % 10) + 2]);
  const statuses = await Promise.all(pairs.map((seats, i) => book(tokens[i % tokens.length], String(trip._id), seats, i)));

  const saved = await Trip.findById(trip._id).lean();
  const seats = saved?.bookedSeats ?? [];
  assert.equal(new Set(seats).size, seats.length, "no seat is booked twice");
  const won = statuses.filter((s) => s === 201).length;
  assert.equal(seats.length, won * 2, "every successful booking holds exactly its own 2 seats");
  assert.ok(statuses.every((s) => s === 201 || s === 409), `only 201 or 409, got ${JSON.stringify(count(statuses))}`);
});
