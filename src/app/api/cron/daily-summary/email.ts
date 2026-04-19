import nodemailer from "nodemailer";

const EMAIL_SERVER_HOST = process.env.EMAIL_SERVER_HOST;
const EMAIL_SERVER_PORT = Number(process.env.EMAIL_SERVER_PORT || "587");
const EMAIL_SERVER_USER = process.env.EMAIL_SERVER_USER;
const EMAIL_SERVER_PASSWORD = process.env.EMAIL_SERVER_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@example.com";

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

interface DailySummary {
  date: string;
  orderNow: Array<{
    nameAr: string;
    name: string;
    totalQty: number;
    unitAr: string;
    unit: string;
  }>;
  todayCounts: number;
  todayTransfers: number;
  todayWaste: number;
}

function formatArabicDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function sendDailySummaryEmail(
  to: string,
  summary: DailySummary,
): Promise<void> {
  if (!transporter) {
    console.warn("[daily-summary] Email not configured, skipping");
    return;
  }

  const arabicDate = formatArabicDate(summary.date);
  const hasOrderNow = summary.orderNow.length > 0;

  const orderRows = summary.orderNow
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0e6d0; font-size: 14px; color: #2c2c2c;">${item.nameAr}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0e6d0; font-size: 14px; color: ${item.totalQty <= 0 ? "#dc2626" : "#d97706"}; font-weight: 600; text-align: center;">${item.totalQty}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0e6d0; font-size: 14px; color: #666; text-align: center;">${item.unitAr}</td>
    </tr>`,
    )
    .join("");

  const subject = hasOrderNow
    ? `🚨 ${summary.orderNow.length} صنف محتاج يتطلب — ${arabicDate}`
    : `✅ ملخص اليوم — ${arabicDate}`;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8f0d2; direction: rtl;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" style="width: 520px; max-width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(139,38,53,0.08);">
          <tr>
            <td style="padding: 24px 24px 16px; background-color: #8b2635; text-align: center;">
              <h1 style="margin: 0; color: #f8f0d2; font-size: 22px; font-weight: 700;">Elite Coffee</h1>
              <p style="margin: 6px 0 0; color: #f8f0d2cc; font-size: 13px;">${arabicDate}</p>
            </td>
          </tr>

          ${
            hasOrderNow
              ? `
          <tr>
            <td style="padding: 20px 24px 12px;">
              <h2 style="margin: 0 0 12px; color: #dc2626; font-size: 16px; font-weight: 700;">🚨 لازم يتطلب (${summary.orderNow.length} صنف)</h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef2f2; border-radius: 12px; overflow: hidden;">
                <tr style="background-color: #fee2e2;">
                  <th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #991b1b; font-weight: 600;">الصنف</th>
                  <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #991b1b; font-weight: 600;">الكمية</th>
                  <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #991b1b; font-weight: 600;">الوحدة</th>
                </tr>
                ${orderRows}
              </table>
            </td>
          </tr>`
              : `
          <tr>
            <td style="padding: 20px 24px 12px;">
              <div style="background-color: #ecfdf5; border-radius: 12px; padding: 16px; text-align: center;">
                <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600;">✅ كل الأصناف متوفرة — مفيش حاجة محتاجة تتطلب</p>
              </div>
            </td>
          </tr>`
          }

          <tr>
            <td style="padding: 12px 24px 20px;">
              <h2 style="margin: 0 0 10px; color: #8b2635; font-size: 15px; font-weight: 700;">📊 نشاط اليوم</h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666;">جرد مقدم</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #2c2c2c; font-weight: 600; text-align: left;">${summary.todayCounts}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666; border-top: 1px solid #f0e6d0;">تحويلات</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #2c2c2c; font-weight: 600; text-align: left; border-top: 1px solid #f0e6d0;">${summary.todayTransfers}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666; border-top: 1px solid #f0e6d0;">هالك</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #2c2c2c; font-weight: 600; text-align: left; border-top: 1px solid #f0e6d0;">${summary.todayWaste}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 16px 24px; background-color: #f8f0d2; text-align: center;">
              <p style="margin: 0; color: #8b2635aa; font-size: 12px;">رسالة تلقائية من Elite Coffee</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const orderList = summary.orderNow
    .map((item) => `  • ${item.nameAr}: ${item.totalQty} ${item.unitAr}`)
    .join("\n");

  const text = `Elite Coffee — ملخص يومي
${arabicDate}

${
  hasOrderNow
    ? `🚨 لازم يتطلب (${summary.orderNow.length} صنف):
${orderList}`
    : "✅ كل الأصناف متوفرة"
}

📊 نشاط اليوم:
  جرد مقدم: ${summary.todayCounts}
  تحويلات: ${summary.todayTransfers}
  هالك: ${summary.todayWaste}

---
رسالة تلقائية من Elite Coffee`;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}
