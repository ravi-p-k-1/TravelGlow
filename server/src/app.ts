import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/healthRoutes.js";
import { tripRouter } from "./routes/tripRoutes.js";
import { environmentRouter } from "./routes/environmentRoutes.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/health", healthRouter);
app.use("/api/trips", tripRouter);
app.use("/api/trips/:id/environment", environmentRouter);

app.use(notFoundHandler);
app.use(errorHandler);
