// Vercel runs the API as one serverless function: vercel.json sends every path here.
// dist/ is the compiled API from `npm run build`. The long-running server (src/server.ts) keeps
// its node-cron jobs; here the same jobs run per request (throttled) and from Vercel Cron.
const { app } = require("../dist/app");
const { connectDB } = require("../dist/config/db");
const { generateAllTrips } = require("../dist/services/schedule.service");
const { markDepartedTrips } = require("../dist/services/trip.service");
const { seedDemo } = require("../dist/scripts/seed-demo");

const WEB_URL = process.env.WEB_URL || "https://rihlati-dashboard-hasan.vercel.app";
const APP_URL = process.env.APP_URL || "https://rihlati-hasan.vercel.app";
const REPO_URL = "https://github.com/hasan123dayoub-del/bus-booking-system";

let ready = null;
function connect() {
  ready ??= connectDB().catch((err) => {
    ready = null; // try again on the next request
    throw err;
  });
  return ready;
}

// Trips whose departure time has passed become DEPARTED (the server does this every 5 minutes)
let lastDepartedCheck = 0;
async function markDeparted() {
  if (Date.now() - lastDepartedCheck < 60_000) return;
  lastDepartedCheck = Date.now();
  await markDepartedTrips().catch((err) => console.error("[job] mark departed failed", err));
}

// Vercel Cron, every night: reset the public demo, then keep 30 days of trips ahead
async function nightly(req, res) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }
  if (process.env.DEMO_MODE === "true") await seedDemo();
  const created = await generateAllTrips();
  res.json({ data: { reset: process.env.DEMO_MODE === "true", tripsCreated: created } });
}

const home = (day) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Rihlati API</title>
<style>body{font-family:system-ui,sans-serif;max-width:760px;margin:48px auto;padding:0 20px;line-height:1.6;color:#10251d}
h1{color:#0E6B50;margin-bottom:0}code{background:#eef4f1;padding:2px 6px;border-radius:6px}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #d5e2dc;padding:8px;text-align:left}a{color:#0E6B50}</style></head><body>
<h1>Rihlati API</h1><p>Bus booking between Syrian cities: one API for the customer app, the reception desk and the admin dashboard.
Every seat can be sold only once, wherever the booking comes from.</p>
<h2>Live demo</h2><ul>
<li>Customer app (web build of the React Native app): <a href="${APP_URL}">${APP_URL.replace("https://", "")}</a></li>
<li>Reception and admin dashboard: <a href="${WEB_URL}">${WEB_URL.replace("https://", "")}</a></li>
<li>Source code: <a href="${REPO_URL}">${REPO_URL.replace("https://", "")}</a></li></ul>
<h2>Demo accounts</h2><p>Password for all: <code>Rihlati123</code>. The demo data resets every night.</p>
<table><tr><th>Role</th><th>Phone</th><th>Where</th></tr>
<tr><td>Admin</td><td><code>0900000000</code></td><td>Dashboard</td></tr>
<tr><td>Reception</td><td><code>0944120981</code></td><td>Dashboard</td></tr>
<tr><td>Customer</td><td><code>0944123456</code></td><td>Customer app</td></tr></table>
<h2>Try it</h2><ul><li><a href="/api/health">GET /api/health</a></li><li><a href="/api/cities">GET /api/cities</a></li>
<li><a href="/api/trips?from=DAMASCUS&amp;to=ALEPPO&amp;date=${day}">GET /api/trips?from=DAMASCUS&amp;to=ALEPPO&amp;date=${day}</a></li></ul>
</body></html>`;

module.exports = async function handler(req, res) {
  const path = (req.url || "/").split("?")[0];
  if (path === "/" || path === "") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    // Tomorrow in Syria, so the sample search always finds trips that have not left yet
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Damascus" }).format(new Date(Date.now() + 86_400_000));
    return res.end(home(day));
  }
  try {
    await connect();
    if (path === "/api/cron/nightly") return await nightly(req, res);
    await markDeparted();
  } catch (err) {
    console.error(err);
    return res.status(503).json({ code: "UNAVAILABLE", message: "Service unavailable, try again" });
  }
  return app(req, res);
};
