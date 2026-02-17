const express = require("express");
const { connectDB, pool } = require("./config/db");
const { PORT, DOMAIN, NODE_ENV, CORS_ORIGIN } = require("./config/config.js");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const routes = require("./routes/index.routes.js");
const helmet = require("helmet");
const { errorHandler } = require("./middlewares/errorHandler");
const { xssSanitizer } = require("./middlewares/sanitization");

const app = express();

app.set("trust proxy", true);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cookies
app.use(cookieParser());

// CORS
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  }),
);

// XSS Protection
app.use(xssSanitizer);

// Routes
app.use("/", routes);

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to PostgreSQL
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`🔌 Port: ${PORT}`);

      if (NODE_ENV === "production") {
        console.log(`🚀 Server running at: ${DOMAIN}`);
      } else {
        console.log(`🚀 Server running at: ${DOMAIN}:${PORT}`);
      }
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    console.error("💡 Check your PostgreSQL connection string in .env");
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Close PostgreSQL pool
    await pool.end();
    console.log("✅ PostgreSQL pool closed");

    console.log("👋 Server shut down gracefully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err.message);
    process.exit(1);
  }
};

// Shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  gracefulShutdown("uncaughtException");
});

// Unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  gracefulShutdown("unhandledRejection");
});
