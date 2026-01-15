import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import client from "prom-client";

// Routes
import userRouter from "./routes/userRoute.js";
import foodRouter from "./routes/foodRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";

dotenv.config();

const app = express();
app.use(express.json());


// =======================
// Prometheus Metrics
// =======================
const register = new client.Registry();

// Default Node.js metrics (CPU, memory, event loop…)
client.collectDefaultMetrics({ register });

// HTTP request duration
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDuration);

// HTTP requests counter
const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});
register.registerMetric(httpRequestsTotal);

// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.path,
        status_code: res.statusCode,
      },
      duration
    );

    httpRequestsTotal.inc({
      method: req.method,
      route: req.path,
      status_code: res.statusCode,
    });
  });

  next();
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});


// Health endpoint (for tests & monitoring)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// API routes (REQUIRED for integration tests)
app.use("/api/user", userRouter);
app.use("/api/food", foodRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

// Root
app.get("/", (req, res) => {
  res.send("API Working");
});

// Start server only if not testing
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
      app.listen(process.env.PORT || 4000, () =>
        console.log("Server running")
      );
    })
    .catch(err => console.error(err));
}

export default app;
