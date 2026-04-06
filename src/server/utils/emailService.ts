/**
 * Email service for sending transactional emails
 * Uses nodemailer with SMTP configuration from environment variables
 */

import nodemailer from "nodemailer";

const EMAIL_SERVER_HOST = process.env.EMAIL_SERVER_HOST;
const EMAIL_SERVER_PORT = Number(process.env.EMAIL_SERVER_PORT || "587");
const EMAIL_SERVER_USER = process.env.EMAIL_SERVER_USER;
const EMAIL_SERVER_PASSWORD = process.env.EMAIL_SERVER_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@example.com";
const BRAND_NAME = process.env.BRAND_NAME || "Elite Coffee Shop";

// Create email transporter (reuse from auth options)
const transporter =
  EMAIL_SERVER_HOST && EMAIL_SERVER_USER && EMAIL_SERVER_PASSWORD
    ? nodemailer.createTransport({
        host: EMAIL_SERVER_HOST,
        port: EMAIL_SERVER_PORT,
        secure: EMAIL_SERVER_PORT === 465,
        auth: {
          user: EMAIL_SERVER_USER,
          pass: EMAIL_SERVER_PASSWORD,
        },
      })
    : null;

interface OrderSyncFailureEmailParams {
  to: string;
  orderNumber: string;
  customerName?: string;
}

interface OrderStatusUpdateEmailParams {
  to: string;
  orderNumber: string;
  previousStatus: string;
  nextStatus: string;
  customerName?: string;
}

function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Send an apology email to customer when order sync to Odoo fails after retries
 */
export async function sendOrderSyncFailureEmail(
  params: OrderSyncFailureEmailParams,
): Promise<void> {
  if (!transporter) {
    console.warn(
      "[emailService] Email not configured, skipping sync failure notification",
    );
    return;
  }

  const { to, orderNumber, customerName } = params;
  const name = customerName || "Valued Customer";

  const subject = `Order ${orderNumber} - Processing Update`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">${BRAND_NAME}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Hi ${name},</h2>
              
              <p style="margin: 0 0 16px; color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for your order <strong style="color: #333333;">#${orderNumber}</strong>.
              </p>
              
              <p style="margin: 0 0 16px; color: #666666; font-size: 16px; line-height: 1.6;">
                We're experiencing a temporary technical issue with our order processing system. Please don't worry — <strong style="color: #333333;">your order has been received and saved</strong>, and our team is working to resolve this quickly.
              </p>
              
              <div style="margin: 24px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">What this means:</p>
                <ul style="margin: 12px 0 0; padding-left: 20px; color: #666666; font-size: 15px; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">Your order is confirmed and in our system</li>
                  <li style="margin-bottom: 8px;">Our team will manually process it shortly</li>
                  <li style="margin-bottom: 8px;">You'll receive updates as usual</li>
                  <li>No action needed from you</li>
                </ul>
              </div>
              
              <p style="margin: 0 0 16px; color: #666666; font-size: 16px; line-height: 1.6;">
                We sincerely apologize for any inconvenience. If you have any questions or concerns, please don't hesitate to contact us.
              </p>
              
              <p style="margin: 24px 0 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for your patience and understanding!
              </p>
              
              <p style="margin: 16px 0 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                <strong style="color: #333333;">The ${BRAND_NAME} Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 14px;">
                This is an automated message from ${BRAND_NAME}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${name},

Thank you for your order #${orderNumber}.

We're experiencing a temporary technical issue with our order processing system. Please don't worry — your order has been received and saved, and our team is working to resolve this quickly.

What this means:
- Your order is confirmed and in our system
- Our team will manually process it shortly
- You'll receive updates as usual
- No action needed from you

We sincerely apologize for any inconvenience. If you have any questions or concerns, please don't hesitate to contact us.

Thank you for your patience and understanding!

Best regards,
The ${BRAND_NAME} Team

---
This is an automated message from ${BRAND_NAME}
  `.trim();

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    console.log(
      `[emailService] Sync failure notification sent to ${to} for order ${orderNumber}`,
    );
  } catch (error) {
    console.error(
      `[emailService] Failed to send sync failure email to ${to}:`,
      error,
    );
    // Don't throw - email failure shouldn't break the sync retry flow
  }
}

/**
 * Send status change email when order status changes.
 */
export async function sendOrderStatusUpdateEmail(
  params: OrderStatusUpdateEmailParams,
): Promise<void> {
  if (!transporter) {
    console.warn(
      "[emailService] Email not configured, skipping order status notification",
    );
    return;
  }

  const { to, orderNumber, previousStatus, nextStatus, customerName } = params;
  const name = customerName || "Valued Customer";
  const previousLabel = formatStatusLabel(previousStatus);
  const nextLabel = formatStatusLabel(nextStatus);
  const brandName = BRAND_NAME;

  const subject = `Order ${orderNumber} is now ${nextLabel}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 32px 40px 18px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600;">${brandName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 34px 40px;">
              <h2 style="margin: 0 0 18px; color: #333333; font-size: 22px; font-weight: 600;">Hi ${name},</h2>
              <p style="margin: 0 0 14px; color: #666666; font-size: 16px; line-height: 1.6;">
                Your order <strong style="color: #333333;">#${orderNumber}</strong> has a new status.
              </p>
              <div style="margin: 20px 0; padding: 18px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #333333; font-size: 15px;">
                  <strong>Previous:</strong> ${previousLabel}
                </p>
                <p style="margin: 0; color: #333333; font-size: 15px;">
                  <strong>Current:</strong> ${nextLabel}
                </p>
              </div>
              <p style="margin: 0; color: #666666; font-size: 15px; line-height: 1.6;">
                We will keep you updated as your order progresses.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 26px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 14px;">
                This is an automated message from ${brandName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${name},

Your order #${orderNumber} has a new status.

Previous: ${previousLabel}
Current: ${nextLabel}

We will keep you updated as your order progresses.

Best regards,
The ${brandName} Team

---
This is an automated message from ${brandName}
  `.trim();

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    console.log(
      `[emailService] Order status notification sent to ${to} for order ${orderNumber}`,
    );
  } catch (error) {
    console.error(
      `[emailService] Failed to send order status email to ${to}:`,
      error,
    );
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!(EMAIL_SERVER_HOST && EMAIL_SERVER_USER && EMAIL_SERVER_PASSWORD);
}
