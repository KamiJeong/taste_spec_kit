import { Module } from "@nestjs/common";
import { join } from "node:path";
import { AcceptLanguageResolver, I18nJsonLoader, I18nModule } from "nestjs-i18n";
import { TokenModule } from "../token/token.module";
import { contractRuntime } from "./contracts.runtime";
import { AuthGuard } from "./guards/auth.guard";
import { CsrfGuard } from "./guards/csrf.guard";

@Module({
  imports: [
    TokenModule,
    I18nModule.forRoot({
      fallbackLanguage: process.env.API_I18N_DEFAULT || "en",
      loader: I18nJsonLoader,
      loaderOptions: {
        path: join(process.cwd(), "src", "i18n"),
        watch: false
      },
      resolvers: [AcceptLanguageResolver]
    })
  ],
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
