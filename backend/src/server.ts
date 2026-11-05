import "dotenv/config";
import express from "express";
import mongoose from "mongoose";

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

const PORT = Number(process.env.PORT) || 4000;
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("MONGO_URI is not set (copy .env.example to .env)");

await mongoose.connect(MONGO_URI);
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
