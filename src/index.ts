import { pool } from './db/pool';
import { ensureSchema } from './db/schema';
import { env } from './lib/env';
import { createApp } from './server';

async function main() {
  await ensureSchema(pool);

  const app = createApp({ pool });
  app.listen(env.PORT, () => {
    console.log(`${env.APP_NAME} listening on port ${env.PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
