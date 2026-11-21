/**
 * Brevo Email Adapter
 * 
 * Re-routes all legacy email invocations through the Centralized Platform Mailer (`@/lib/email/mailer.ts`).
 * This guarantees all outbound emails use the platform mailer pipeline, dynamic settings,
 * unified logging, and branded styling.
 */

import {
  sendPlatformEmail,
  sendOrderConfirmationEmail as mailerOrderConfirmation,
  sendVendorKYCStatusEmail as mailerVendorKYCStatus,
  EmailRecipient,
} from './mailer';

export type { EmailRecipient };

export interface SendEmailParams {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  params?: Record<string, any>;
}

/**
 * Legacy sendBrevoEmail wrapper: passes directly into sendPlatformEmail
 */
export async function sendBrevoEmail({ to, subject, htmlContent, textContent }: SendEmailParams) {
  return sendPlatformEmail({
    to,
    subject,
    html: htmlContent,
    text: textContent,
  });
}

/**
 * Order Confirmation Email
 */
export const sendOrderConfirmationEmail = mailerOrderConfirmation;

/**
 * Vendor KYC Status Email
 */
export const sendVendorKYCStatusEmail = mailerVendorKYCStatus;
