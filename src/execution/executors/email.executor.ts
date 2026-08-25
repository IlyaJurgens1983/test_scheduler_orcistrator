import { Injectable } from '@nestjs/common';
import { StepExecutor } from '../step-executor.interface';

export interface EmailConfig {
  to?: string;
  subject?: string;
  body?: string;
}

/**
 * Stub executor. In a real deployment it would call an SMTP provider
 * (Nodemailer, AWS SES, Resend, etc.).
 */
@Injectable()
export class EmailExecutor implements StepExecutor {
  async execute(
    config: EmailConfig,
    context: Record<string, unknown>,
  ): Promise<unknown> {
    const to = config.to || 'demo@example.com';
    const subject = config.subject || 'Scheduler orchestrator notification';
    const body =
      config.body || JSON.stringify(context, null, 2);

    console.log(`[email.stub] To: ${to}`);
    console.log(`[email.stub] Subject: ${subject}`);
    console.log(`[email.stub] Body:\n${body}`);

    return {
      to,
      subject,
      sent: true,
      provider: 'stub',
    };
  }
}
