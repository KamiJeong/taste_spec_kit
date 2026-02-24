import { Module } from "@nestjs/common";
import { LogMailService } from "./log-mail.service";
import { MAIL_SERVICE } from "./mail.service";
import { SmtpMailService } from "./smtp-mail.service";

@Module({
  providers: [
    LogMailService,
    SmtpMailService,
    {
      provide: MAIL_SERVICE,
      useFactory: (logMailer: LogMailService, smtpMailer: SmtpMailService) => {
        const mode = (process.env.MAIL_TRANSPORT ?? "log").toLowerCase();
        return mode === "smtp" ? smtpMailer : logMailer;
      },
      inject: [LogMailService, SmtpMailService]
    }
  ],
  exports: [MAIL_SERVICE]
})
export class MailModule {}
