import { Module } from "@nestjs/common";
import { contractRuntime } from "./contracts.runtime";
import { CsrfGuard } from "./guards/csrf.guard";

@Module({
  providers: [
    {
      provide: "CONTRACT_RUNTIME",
      useValue: contractRuntime
    },
    CsrfGuard
  ],
  exports: ["CONTRACT_RUNTIME", CsrfGuard]
})
export class SharedModule {}
