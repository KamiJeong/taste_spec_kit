import { Module } from "@nestjs/common";
import { contractRuntime } from "./contracts.runtime";

@Module({
  providers: [
    {
      provide: "CONTRACT_RUNTIME",
      useValue: contractRuntime
    }
  ],
  exports: ["CONTRACT_RUNTIME"]
})
export class SharedModule {}
