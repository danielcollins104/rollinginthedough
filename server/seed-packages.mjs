#!/usr/bin/env node
/**
 * Seed test coin packages into the database
 * Run with: node server/seed-packages.mjs
 */

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function seedPackages() {
  let pool;
  try {
    // Create PostgreSQL connection pool
    pool = new Pool({ connectionString: DATABASE_URL });

    // Test coin packages
    const packages = [
      {
        coins: 500,
        bonus: 50,
        priceUsd: 499,
        displayName: "Starter Pack",
        isPopular: false,
      },
      {
        coins: 2000,
        bonus: 200,
        priceUsd: 1499,
        displayName: "Value Pack",
        isPopular: false,
      },
      {
        coins: 5000,
        bonus: 750,
        priceUsd: 3499,
        displayName: "Popular Pack",
        isPopular: true,
      },
      {
        coins: 15000,
        bonus: 3000,
        priceUsd: 9999,
        displayName: "Premium Pack",
        isPopular: false,
      },
      {
        coins: 50000,
        bonus: 10000,
        priceUsd: 99999,
        displayName: "VIP Mega Pack",
        isPopular: false,
      },
    ];

    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Check if packages already exist (using quoted table name for case sensitivity)
      const { rows: existing } = await client.query('SELECT COUNT(*) as count FROM "coinPackages"');
      if (parseInt(existing[0].count) > 0) {
        console.log("✓ Coin packages already seeded");
        return;
      }

      // Insert packages (using quoted table name and column names for case sensitivity)
      for (const pkg of packages) {
        await client.query(
          'INSERT INTO "coinPackages" ("coins", "bonus", "priceUsd", "displayName", "isPopular") VALUES ($1, $2, $3, $4, $5)',
          [pkg.coins, pkg.bonus, pkg.priceUsd, pkg.displayName, pkg.isPopular ? 1 : 0]
        );
      }

      console.log(`✓ Seeded ${packages.length} test coin packages`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error seeding packages:", error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

seedPackages();