import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/error";
import routes from "./routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",") }));
app.use(express.json({ limit: "100kb" }));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);
