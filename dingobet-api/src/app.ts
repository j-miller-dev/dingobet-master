import express, { Express } from "express";
import * as Sentry from "@sentry/node";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { globalLimiter } from "./middleware/rateLimiter.js";
import { env } from "./config/env.js";

const app: Express = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());
app.use(globalLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "dingobet-api" });
});

app.use("/api", routes);

Sentry.setupExpressErrorHandler(app);
// Global error handler LAST
app.use(errorHandler);

export default app;
