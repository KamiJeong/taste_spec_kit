import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { randomUUID } from "node:crypto";
import { loadApiEnv } from "./config/load-env";

loadApiEnv();

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  app.use((req: any, res: any, next: () => void) => {
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();
    res.setHeader("X-Request-Id", requestId);
    next();
  });
  return app;
}

export async function bootstrap(): Promise<void> {
  const app = await createApp();
  await app.listen(3000);
}

if (require.main === module) {
  void bootstrap();
}
