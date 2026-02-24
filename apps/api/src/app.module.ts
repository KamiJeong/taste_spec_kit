import { Module } from "@nestjs/common";
import { ModulesRoot } from "./modules";

@Module({
  imports: [ModulesRoot]
})
export class AppModule {}
