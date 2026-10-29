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

// Clean quotes and backslashes that often get accidentally added in hosting dashboards
function cleanEnvValue(val?: string): string {
  if (!val) return '';
  return val
    .trim()
    .replace(/^["']|["']$/g, '') // strip outer quotes
    .replace(/\\"/g, '"')         // unescape \" to "
    .trim();
}

// Fallback credentials for Gmail SMTP
const DEFAULT_SMTP_USER = Buffer.from('ZnVrazIyMzM0NUBnbWFpbC5jb20=', 'base64').toString('utf8'); // fukk223345@gmail.com
const DEFAULT_SMTP_PASS = Buffer.from('emlzZWxtdGpzbmRqcWF6eg==', 'base64').toString('utf8'); // ziselmtjsndjqazz

@Injectable()
export class ConsoleAndDbEmailAdapter implements EmailAdapter {
  private readonly logger = new Logger('EmailAdapter');
  private transporter: nodemailer.Transporter | null = null;
  public lastDispatchStatus: string = 'NO_DISPATCH_YET';
  public lastDispatchError: string | null = null;
  public lastDispatchTime: string | null = null;

  constructor(private readonly prisma: PrismaService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = cleanEnvValue(process.env.SMTP_HOST) || 'smtp.gmail.com';
    const port = parseInt(cleanEnvValue(process.env.SMTP_PORT) || '587', 10);
    const secure = cleanEnvValue(process.env.SMTP_SECURE) === 'true';
    const user = cleanEnvValue(process.env.SMTP_USER) || DEFAULT_SMTP_USER;
    const pass = (cleanEnvValue(process.env.SMTP_PASS) || DEFAULT_SMTP_PASS).replace(/\s+/g, '');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false,
        },
        // Strict timeouts (5-8s) prevent Render Free from freezing when outbound SMTP ports 25/465/587 are blocked
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
      });
      this.logger.log(`SMTP Transporter configured (${host}:${port}, user: ${user})`);
    } else {
      this.logger.warn(
        `SMTP credentials not set. Set SMTP_USER and SMTP_PASS or BREVO_API_KEY to send real emails.`
      );
    }
  }

  /**
   * Send email using HTTP REST API (Brevo / Sendinblue) over HTTPS Port 443
   * This completely bypasses Render Free's SMTP port firewall block!
   */
  private async sendViaBrevo(apiKey: string, options: SendEmailOptions): Promise<boolean> {
    try {
      const fromName = cleanEnvValue(process.env.SMTP_SENDER_NAME) || 'Hạt Gạo Sky';
      const fromEmail =
        cleanEnvValue(process.env.BREVO_SENDER_EMAIL) ||
        cleanEnvValue(process.env.SMTP_USER) ||
        DEFAULT_SMTP_USER;

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email: options.to }],
          subject: options.subject,
          htmlContent: options.htmlContent,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.lastDispatchStatus = `BREVO_ERROR_${res.status}`;
        this.lastDispatchError = errText;
        this.logger.error(`❌ [BREVO API ERROR] (${res.status}): ${errText}`);
        return false;
      }

      const data = await res.json();
      this.lastDispatchStatus = 'BREVO_SUCCESS';
      this.lastDispatchError = null;
      this.logger.log(`✅ [BREVO EMAIL DELIVERED] Sent to ${options.to} (MessageId: ${data.messageId})`);
      return true;
    } catch (err: any) {
      this.lastDispatchStatus = 'BREVO_EXCEPTION';
      this.lastDispatchError = err.message || String(err);
      this.logger.error(`❌ [BREVO API EXCEPTION] ${this.lastDispatchError}`);
      return false;
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    this.logger.log(`📧 [EMAIL DISPATCH] To: ${options.to} | Subject: "${options.subject}" [Template: ${options.template}]`);
    this.lastDispatchTime = new Date().toISOString();

    let sentReal = false;
    let failureReason: string | null = null;

    // 1. Priority 1: Check Brevo API Key (HTTP REST API via HTTPS 443 - 100% works on Render Free)
    const brevoApiKey = cleanEnvValue(process.env.BREVO_API_KEY);
    if (brevoApiKey) {
      sentReal = await this.sendViaBrevo(brevoApiKey, options);
      if (sentReal) {
        await this.recordEmail(options, 'SENT_REAL_BREVO');
        return true;
      } else {
        // When Brevo API key is present, do NOT fall back to SMTP!
        // Render Free blocks SMTP ports (25, 465, 587), causing a 5s connection timeout that overwrites Brevo's real error.
        await this.recordEmail(options, 'FAILED_BREVO');
        return false;
      }
    }

    // 2. Priority 2: Nodemailer SMTP (Gmail / Custom SMTP)
    if (!this.transporter) {
      this.initTransporter();
    }

    if (this.transporter) {
      try {
        const user = cleanEnvValue(process.env.SMTP_USER) || DEFAULT_SMTP_USER;
        let fromHeader = cleanEnvValue(process.env.SMTP_FROM);
        if (!fromHeader) {
          fromHeader = `"Hạt Gạo Sky" <${user}>`;
        } else if (!fromHeader.includes('<')) {
          fromHeader = `"Hạt Gạo Sky" <${fromHeader}>`;
        }

        const info = await this.transporter.sendMail({
          from: fromHeader,
          to: options.to,
          subject: options.subject,
          html: options.htmlContent,
        });

        sentReal = true;
        this.lastDispatchStatus = 'SMTP_SUCCESS';
        this.lastDispatchError = null;
        this.logger.log(`✅ [SMTP EMAIL DELIVERED] Successfully sent to ${options.to} (MessageId: ${info.messageId})`);
      } catch (err: any) {
        failureReason = err.message || String(err);
        this.lastDispatchStatus = 'SMTP_FAILED';
        this.lastDispatchError = failureReason;
        this.logger.error(`❌ [SMTP ERROR] Failed sending to ${options.to}: ${failureReason}`);
      }
    }

    await this.recordEmail(options, sentReal ? 'SENT_REAL' : failureReason ? 'FAILED' : 'SENT_MOCK');
    return sentReal;
  }

  private async recordEmail(options: SendEmailOptions, status: string) {
    try {
      await this.prisma.sentEmail.create({
        data: {
          recipientEmail: options.to,
          subject: options.subject,
          template: options.template,
          contentHtml: options.htmlContent,
          status,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to record sent email to DB:`, error);
    }
  }

  getLastDiagnostic() {
    const brevoKey = cleanEnvValue(process.env.BREVO_API_KEY);
    return {
      hasBrevoApiKey: !!brevoKey,
      brevoApiKeyPrefix: brevoKey ? brevoKey.slice(0, 10) + '...' : 'NOT_SET',
      senderEmail:
        cleanEnvValue(process.env.BREVO_SENDER_EMAIL) ||
        cleanEnvValue(process.env.SMTP_USER) ||
        DEFAULT_SMTP_USER,
      smtpConfigured: !!this.transporter,
      lastDispatchStatus: this.lastDispatchStatus,
      lastDispatchError: this.lastDispatchError,
      lastDispatchTime: this.lastDispatchTime,
    };
  }
}
