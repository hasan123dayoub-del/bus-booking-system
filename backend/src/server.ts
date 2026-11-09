import { app } from "./app";
import { connectDB, disconnectDB } from "./config/db";
import { env } from "./config/env";

async function main() {
  await connectDB();
  const server = app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}/api`);
  });

  const shutdown = async () => {
    server.close();
    await disconnectDB();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
