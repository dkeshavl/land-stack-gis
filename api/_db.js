import pg from "pg";

const DEFAULT_DATABASE_URL =
  "postgresql://postgres.yuekikfcikvkddamazdi:Keshav%40LandStack%402026%23Gis@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";
const rawConnectionString = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
const connectionString =
  rawConnectionString +
  (rawConnectionString.includes("6543") && !rawConnectionString.includes("pgbouncer=true")
    ? (rawConnectionString.includes("?") ? "&pgbouncer=true" : "?pgbouncer=true")
    : "");

// Cache pool across serverless function invocations in same container
let pool = globalThis.__postgis_pool;
if (!pool) {
  pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 7000
  });

  pool.on("error", (err) => {
    console.warn("Vercel PostGIS pool warning (idle client):", err.message);
  });

  globalThis.__postgis_pool = pool;
}

export const query = (text, params) => pool.query(text, params);
export default { query, pool };
