#!/usr/bin/env node
/**
 * Seed coin packages into the database (PostgreSQL / Supabase).
 * Run with: node server/seed-packages.pg.mjs
 *
 * Postgres port of the original mysql2-based seed script.
 */

import "dotenv/config";
import pg from "pg";

const { Client } = pg;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const packages = [
  { coins: 500, bonus: 50, priceUsd: 499, displayName: "Starter Pack", isPopular: 0 },
  { coins: 2000, bonus: 200, priceUsd: 1499, displayName: "Value Pack", isPopular: 0 },
  { coins: 5000, bonus: 750, priceUsd: 3499, displayName: "Popular Pack", isPopular: 1 },
  { coins: 15000, bonus: 3000, priceUsd: 9999, displayName: "Premium Pack", isPopular: 0 },
  { coins: 50000, bonus: 10000, priceUsd: 99999, displayName: "VIP Mega Pack", isPopular: 0 },
];

async function seedPackages() {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();

    const existing = await client.query('SELECT COUNT(*)::int AS count FROM "coinPackages"');
    if (existing.rows[0].count > 0) {
      console.log("\u2713 Coin packages already seeded (" + existing.rows[0].count + " rows)");
      return;
    }

    for (const pkg of packages) {
      await client.query(
        'INSERT INTO "coinPackages" (coins, bonus, "priceUsd", "displayName", "isPopular") VALUES ($1, $2, $3, $4, $5)',
        [pkg.coins, pkg.bonus, pkg.priceUsd, pkg.displayName, pkg.isPopular]
      );
    }

    console.log("\u2713 Seeded " + packages.length + " coin packages");
  } catch (error) {
    console.error("Error seeding packages:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedPackages();
