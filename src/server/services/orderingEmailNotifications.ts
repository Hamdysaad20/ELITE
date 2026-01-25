import { prisma } from "@/server/db/client";
import { orderingResumedEmail } from "@/server/auth/emailTemplates";
import nodemailer from "nodemailer";

const EMAIL_SERVER_HOST = process.env.EMAIL_SERVER_HOST;
const EMAIL_SERVER_PORT = Number(process.env.EMAIL_SERVER_PORT || "587");
const EMAIL_SERVER_USER = process.env.EMAIL_SERVER_USER;
const EMAIL_SERVER_PASSWORD = process.env.EMAIL_SERVER_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@example.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://officieleliteeg.com";

// Create email transporter
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

/**
 * Send ordering resumed emails to all users who requested notifications
 * Groups items by user and sends one email per user
 */
export async function sendOrderingResumedEmails(): Promise<void> {
  if (!transporter) {
    console.warn(
      "[orderingEmailNotifications] Email not configured, skipping notifications",
    );
    return;
  }

  // Fetch all pending notifications with user and product info
  const pending = await prisma.itemAvailabilityNotification.findMany({
    where: { notified: false },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (pending.length === 0) {
    console.log("[orderingEmailNotifications] No pending notifications");
    return;
  }

  // Group by user and collect product IDs
  const byUser = new Map<
    string,
    {
      email: string;
      name?: string;
      productIds: string[];
    }
  >();

  for (const row of pending) {
    if (!row.user?.email) {
      console.warn(
        `[orderingEmailNotifications] Skipping notification for user ${row.userId} (no email)`,
      );
      continue;
    }

    if (!byUser.has(row.userId)) {
      byUser.set(row.userId, {
        email: row.user.email,
        name: row.user.name ?? undefined,
        productIds: [],
      });
    }

    byUser.get(row.userId)!.productIds.push(row.productId);
  }

  // Fetch product names from database
  const allProductIds = Array.from(
    new Set(pending.map((p) => p.productId)),
  );
  const products = await prisma.product.findMany({
    where: {
      id: { in: allProductIds },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p.name]));

  // Send emails
  const emailPromises: Promise<void>[] = [];

  for (const [userId, { email, name, productIds }] of byUser.entries()) {
    // Get product names (fallback to productId if not found)
    const itemNames = productIds.map(
      (id) => productMap.get(id) || `Product ${id}`,
    );

    const template = orderingResumedEmail({
      userName: name,
      items: itemNames,
      siteUrl: SITE_URL,
    });

    const emailPromise = transporter
      .sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })
      .then(() => {
        console.log(
          `[orderingEmailNotifications] Email sent to ${email} for ${productIds.length} items`,
        );
      })
      .catch((error) => {
        console.error(
          `[orderingEmailNotifications] Failed to send email to ${email}:`,
          error,
        );
        // Don't throw - continue with other users
      });

    emailPromises.push(emailPromise);
  }

  // Wait for all emails to be sent (or fail)
  await Promise.allSettled(emailPromises);

  // Mark all as notified (even if some emails failed, we don't want to spam)
  const updateResult = await prisma.itemAvailabilityNotification.updateMany({
    where: { notified: false },
    data: { notified: true },
  });

  console.log(
    `[orderingEmailNotifications] Marked ${updateResult.count} notifications as sent`,
  );
}
