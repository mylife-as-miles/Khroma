import { getDb, runQuery } from '../src/lib/clients';

async function main() {
  try {
    const db = await getDb();
    console.log('Successfully connected to the database.');

    await runQuery(`
      CREATE TABLE IF NOT EXISTS chats (
        id VARCHAR(255) PRIMARY KEY,
        data JSON
      )
    `);
    console.log('`chats` table created or already exists.');

    await runQuery(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        id VARCHAR(255),
        timestamp DATETIME,
        PRIMARY KEY (id, timestamp)
      )
    `);
    console.log('`rate_limits` table created or already exists.');

    console.log('Database migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Database migration failed', err);
    process.exit(1);
  }
}

main();
