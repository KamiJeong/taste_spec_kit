import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { randomUUID } from "node:crypto";
import { loadApiEnv } from "./config/load-env";

loadApiEnv();

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (typeof raw !== "string" || raw.trim() === "") return fallback;
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isDocsEnabled(): boolean {
  const defaultEnabled = process.env.NODE_ENV !== "production";
  return envBool("API_DOCS_ENABLED", defaultEnabled);
}

function isDocsProtected(): boolean {
  return envBool("API_DOCS_PROTECTED", false);
}

function setupSwagger(app: Awaited<ReturnType<typeof NestFactory.create>>): void {
  const config = new DocumentBuilder()
    .setTitle("taste_spec_kit API")
    .setDescription("Auth/User API documentation")
    .setVersion("1.0")
    .addCookieAuth("sid", {
      type: "apiKey",
      in: "cookie"
    })
    .addApiKey(
      {
        type: "apiKey",
        in: "header",
        name: "x-csrf-token",
        description: "Required for state-changing requests with sid cookie"
      },
      "csrfToken"
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("/api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true
    },
    jsonDocumentUrl: "/api-json"
  });
}

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  app.use((req: any, res: any, next: () => void) => {
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();
    res.setHeader("X-Request-Id", requestId);
    next();
  });

  if (isDocsEnabled()) {
    if (isDocsProtected()) {
      const rejectDocs = (_req: any, res: any) => {
        res.status(403).json({ success: false, code: "DOCS_ACCESS_DENIED", message: "API docs are protected" });
      };
      app.use("/api/docs", rejectDocs);
      app.use("/api-json", rejectDocs);
    } else {
      setupSwagger(app);
    }
  }

  return app;
}

export async function bootstrap(): Promise<void> {
  const app = await createApp();
  await app.listen(3000);
}

if (require.main === module) {
  void bootstrap();
}
