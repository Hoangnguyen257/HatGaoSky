import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
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
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly prisma: PrismaService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.replace(/\s+/g, '').trim();

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false,
        },
      });
      this.logger.log(`SMTP Transporter initialized for real email sending (${host}:${port}, user: ${user})`);
    } else {
      this.logger.warn(
        `SMTP credentials not provided in environment (SMTP_USER, SMTP_PASS). Emails will be recorded to DB and logged in console. Set SMTP_USER and SMTP_PASS to send real emails to inboxes.`
      );
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    this.logger.log(`📧 [EMAIL DISPATCH] To: ${options.to} | Subject: "${options.subject}" [Template: ${options.template}]`);

    // Dynamically re-attempt initialization if environment variables were injected after boot
    if (!this.transporter) {
      this.initTransporter();
    }

    let sentViaSmtp = false;
    let smtpError: string | null = null;

    if (this.transporter) {
      try {
        const fromAddress = process.env.SMTP_FROM || `"Hạt Gạo Sky" <${process.env.SMTP_USER}>`;
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.htmlContent,
        });
        sentViaSmtp = true;
        this.logger.log(`✅ [REAL EMAIL DELIVERED] Successfully sent to ${options.to} (MessageId: ${info.messageId})`);
      } catch (err: any) {
        smtpError = err.message || String(err);
        this.logger.error(`❌ [SMTP ERROR] Failed sending real email to ${options.to}: ${smtpError}`);
      }
    }

    try {
      await this.prisma.sentEmail.create({
        data: {
          recipientEmail: options.to,
          subject: options.subject,
          template: options.template,
          contentHtml: options.htmlContent,
          status: sentViaSmtp ? 'SENT_REAL' : smtpError ? 'FAILED' : 'SENT_MOCK',
        },
      });
      return sentViaSmtp || !this.transporter;
    } catch (error) {
      this.logger.error(`Failed to record sent email to DB:`, error);
      return false;
    }
  }
}
