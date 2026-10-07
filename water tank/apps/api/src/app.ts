import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { apiRoutes } from "./routes/index.js";

export const app = express();

app.set("trust proxy", 1);
app.use(
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500
  })
);
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "watertank-api" });
});

app.use("/api", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
