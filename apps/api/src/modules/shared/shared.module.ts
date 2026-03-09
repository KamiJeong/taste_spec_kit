import { Module } from "@nestjs/common";
import { TokenModule } from "../token/token.module";
import { contractRuntime } from "./contracts.runtime";
import { AuthGuard } from "./guards/auth.guard";
import { CsrfGuard } from "./guards/csrf.guard";

@Module({
  imports: [TokenModule],
  providers: [
    {
      provide: "CONTRACT_RUNTIME",
      useValue: contractRuntime
    },
    AuthGuard,
    CsrfGuard
  ],
  exports: ["CONTRACT_RUNTIME", AuthGuard, CsrfGuard]
})
export class SharedModule {}
