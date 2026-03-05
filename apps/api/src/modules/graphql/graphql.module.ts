import { Module } from "@nestjs/common";
import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import { GraphQLModule } from "@nestjs/graphql";
import type { Request, Response } from "express";
import { GraphqlUiController } from "./graphql-ui.controller";

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (typeof raw !== "string" || raw.trim() === "") return fallback;
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isGraphqlEnabled(): boolean {
  return envBool("API_GRAPHQL_ENABLED", true);
}

function isGraphqlPlaygroundEnabled(): boolean {
  return envBool("API_GRAPHQL_PLAYGROUND", process.env.NODE_ENV !== "production");
}

function isGraphqlIntrospectionEnabled(): boolean {
  return envBool("API_GRAPHQL_INTROSPECTION", process.env.NODE_ENV !== "production");
}

@Module({
  controllers: [GraphqlUiController],
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      path: "/graphql",
      autoSchemaFile: true,
      sortSchema: true,
      playground: isGraphqlEnabled() ? isGraphqlPlaygroundEnabled() : false,
      introspection: isGraphqlEnabled() ? isGraphqlIntrospectionEnabled() : false,
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res })
    })
  ]
})
export class ApiGraphqlModule {}
