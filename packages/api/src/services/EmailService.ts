/**
 * Email service interface and console stub for development.
 * Replace ConsoleEmailService with a real implementation (e.g., SES, Resend)
 * when email delivery is configured.
 */

export interface EmailService {
  sendRegistrationEmail(to: string, token: string, name: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string, name: string): Promise<void>;
  sendAdminNotification(subject: string, body: string): Promise<void>;
}

export class ConsoleEmailService implements EmailService {
  private appUrl: string;

  constructor(appUrl?: string) {
    this.appUrl = appUrl ?? process.env.APP_URL ?? "http://localhost:4000";
  }

  async sendRegistrationEmail(to: string, token: string, name: string): Promise<void> {
    const link = `${this.appUrl}/signup?token=${token}`;
    console.info(`[EMAIL] Registration email to ${to} (${name})`);
    console.info(`[EMAIL] Signup link: ${link}`);
  }

  async sendPasswordResetEmail(to: string, token: string, name: string): Promise<void> {
    const link = `${this.appUrl}/reset-password?token=${token}`;
    console.info(`[EMAIL] Password reset email to ${to} (${name})`);
    console.info(`[EMAIL] Reset link: ${link}`);
  }

  async sendAdminNotification(subject: string, body: string): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@localhost";
    console.info(`[EMAIL] Admin notification to ${adminEmail}: ${subject}`);
    console.info(`[EMAIL] ${body}`);
  }
}
