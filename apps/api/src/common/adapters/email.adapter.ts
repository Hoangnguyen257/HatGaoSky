import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  htmlContent: string;
}

export abstract class EmailAdapter {
  abstract sendEmail(options: SendEmailOptions): Promise<boolean>;
}

@Injectable()
export class ConsoleAndDbEmailAdapter implements EmailAdapter {
  private readonly logger = new Logger('EmailAdapter');

  constructor(private readonly prisma: PrismaService) {}

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    this.logger.log(`📧 [MOCK EMAIL DISPATCH] To: ${options.to} | Subject: "${options.subject}" [Template: ${options.template}]`);

    try {
      await this.prisma.sentEmail.create({
        data: {
          recipientEmail: options.to,
          subject: options.subject,
          template: options.template,
          contentHtml: options.htmlContent,
          status: 'SENT',
        },
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to record sent email to DB:`, error);
      return false;
    }
  }
}
