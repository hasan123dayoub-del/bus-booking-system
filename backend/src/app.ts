import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler, notFound } from "./middleware/error";
import routes from "./routes";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);
