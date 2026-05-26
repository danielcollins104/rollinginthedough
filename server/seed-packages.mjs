#!/usr/bin/env node
/**
 * Seed test coin packages into the database
 * Run with: node server/seed-packages.mjs
 */

import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function seedPackages() {
  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);

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

    // Check if packages already exist
    const [existing] = await connection.execute("SELECT COUNT(*) as count FROM coinPackages");
    if (existing[0].count > 0) {
      console.log("✓ Coin packages already seeded");
      return;
    }

    // Insert packages
    for (const pkg of packages) {
      await connection.execute(
        "INSERT INTO coinPackages (coins, bonus, priceUsd, displayName, isPopular) VALUES (?, ?, ?, ?, ?)",
        [pkg.coins, pkg.bonus, pkg.priceUsd, pkg.displayName, pkg.isPopular ? 1 : 0]
      );
    }

    console.log(`✓ Seeded ${packages.length} test coin packages`);
  } catch (error) {
    console.error("Error seeding packages:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedPackages();
