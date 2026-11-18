import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PGPORT ?? 5433);
const USER = process.env.PGUSER ?? 'shadtech';
const PASSWORD = process.env.PGPASSWORD ?? 'shadtech';
const DATABASE = process.env.PGDATABASE ?? 'shadtech_platform';
const DATABASE_DIR = path.resolve(__dirname, '..', '.pgdata');

const pg = new EmbeddedPostgres({
  databaseDir: DATABASE_DIR,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
});

async function main(): Promise<void> {
  if (!existsSync(path.join(DATABASE_DIR, 'PG_VERSION'))) {
    console.log(`Initialising PostgreSQL cluster in ${DATABASE_DIR} ...`);
    await pg.initialise();
  }

  await pg.start();
  console.log(`PostgreSQL is running on 127.0.0.1:${PORT} (user: ${USER})`);

  try {
    await pg.createDatabase(DATABASE);
    console.log(`Database "${DATABASE}" created.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists/i.test(message)) {
      throw error;
    }
    console.log(`Database "${DATABASE}" already exists.`);
  }

  console.log('Press Ctrl+C to stop.');

  const shutdown = (): void => {
    console.log('\nStopping PostgreSQL ...');
    void pg.stop().finally(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await new Promise<void>(() => {});
}

main().catch((error: unknown) => {
  console.error('Failed to start the development database:', error);
  process.exitCode = 1;
});
