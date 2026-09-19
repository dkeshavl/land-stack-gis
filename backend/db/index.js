const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Auto-load backend/.env if DATABASE_URL is not already set in environment
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [k, ...v] = trimmed.split("=");
        if (k && v.length && !process.env[k.trim()]) {
          process.env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
        }
      }
    });
  }
}

const rawConnectionString = process.env.DATABASE_URL || "";
const connectionString =
  rawConnectionString +
  (rawConnectionString.includes("6543") && !rawConnectionString.includes("pgbouncer=true")
    ? (rawConnectionString.includes("?") ? "&pgbouncer=true" : "?pgbouncer=true")
    : "");

const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === "production" ||
    (connectionString &&
      (connectionString.includes("supabase.co") ||
        connectionString.includes("supabase.com") ||
        connectionString.includes("render.com") ||
        connectionString.includes("neon.tech")))
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 6000,
  maxUses: 7500
});

// Suppress unhandled errors on idle clients so the process doesn't crash on network disconnects
pool.on("error", (err) => {
  console.error("PostgreSQL/PostGIS pool error (idle client):", err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
