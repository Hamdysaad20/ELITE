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
    section: string;
    preferredSupplier: string | null;
    minimumStock: number;
    targetStock: number;
    suggestedOrderQty: number;
    backupThreshold: number;
    daysRemaining: number | null;
    auditWarnings: string[];
    reason: "minimum_stock" | "backup_threshold" | "empty";
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

function reasonLabel(reason: DailySummary["orderNow"][number]["reason"]) {
  if (reason === "empty") return "نفد تمامًا / Empty";
  if (reason === "minimum_stock")
    return "عند أو تحت الحد الأدنى / Below minimum";
  return "قاعدة احتياطية / Backup rule";
}

function sectionTitle(reason: DailySummary["orderNow"][number]["reason"]) {
  if (reason === "empty") return "نفد تمامًا / Empty";
  if (reason === "minimum_stock") return "تحت الحد الأدنى / Below Minimum";
  return "خطة احتياطية / Backup Rule";
}

function warningLabel(warning: string) {
  const labels: Record<string, string> = {
    negative_stock: "مخزون بالسالب / Negative stock",
    missing_minimum: "الحد الأدنى غير مضبوط / Missing minimum",
    alert_below_minimum: "حد التنبيه أقل من الحد الأدنى / Alert below minimum",
    target_below_minimum: "الهدف أقل من الحد الأدنى / Target below minimum",
    never_counted: "لم يتم جرده / Never counted",
    stale_count: "الجرد قديم / Stale count",
  };
  return labels[warning] ?? warning;
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

  const rowsForReason = (reason: DailySummary["orderNow"][number]["reason"]) =>
    summary.orderNow
      .filter((item) => item.reason === reason)
      .map(
        (item) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0e6d0; font-size: 14px; color: #2c2c2c;">
        <strong>${item.nameAr}</strong><br>
        <span style="font-size: 12px; color: #666;">${item.name}</span>
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0e6d0; font-size: 14px; color: ${item.totalQty <= 0 ? "#dc2626" : "#d97706"}; font-weight: 600; text-align: center;">${item.totalQty}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0e6d0; font-size: 13px; color: #666; text-align: center;">${item.unitAr}<br><span style="font-size: 11px;">${item.unit}</span></td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0e6d0; font-size: 13px; color: #2c2c2c; text-align: center;">${item.suggestedOrderQty}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0e6d0; font-size: 12px; color: #444; text-align: center;">${reasonLabel(item.reason)}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0e6d0; font-size: 11px; color: #666; text-align: center;">${item.preferredSupplier || "عام / General"}</td>
    </tr>`,
      )
      .join("");

  const sectionTables = (
    ["empty", "minimum_stock", "backup_threshold"] as const
  )
    .map((reason) => {
      const rows = rowsForReason(reason);
      if (!rows) return "";
      return `
              <h3 style="margin: 14px 0 8px; color: #991b1b; font-size: 14px; font-weight: 700;">${sectionTitle(reason)}</h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef2f2; border-radius: 12px; overflow: hidden;">
                <tr style="background-color: #fee2e2;">
                  <th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #991b1b; font-weight: 600;">الصنف / Item</th>
                  <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #991b1b; font-weight: 600;">المتاح / Current</th>
                  <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #991b1b; font-weight: 600;">الوحدة / Unit</th>
                  <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #991b1b; font-weight: 600;">اطلب / Order</th>
                  <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #991b1b; font-weight: 600;">السبب / Reason</th>
                  <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #991b1b; font-weight: 600;">المورد / Supplier</th>
                </tr>
                ${rows}
              </table>`;
    })
    .join("");

  const warningRows = summary.orderNow
    .filter((item) => item.auditWarnings.length > 0)
    .map(
      (item) => `
      <li style="margin-bottom: 6px;"><strong>${item.nameAr} / ${item.name}:</strong> ${item.auditWarnings
        .map(warningLabel)
        .join("، ")}</li>`,
    )
    .join("");

  const subject = hasOrderNow
    ? `🚨 ${summary.orderNow.length} shortage items / أصناف محتاجة طلب — ${arabicDate}`
    : `✅ Daily summary / ملخص اليوم — ${arabicDate}`;

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
              <h2 style="margin: 0 0 12px; color: #dc2626; font-size: 16px; font-weight: 700;">🚨 لازم يتطلب / Needs Ordering (${summary.orderNow.length})</h2>
              ${sectionTables}
              ${
                summary.orderNow.some((i) => i.reason === "backup_threshold")
                  ? `<div style="margin-top: 12px; background-color: #f5f3ff; border: 1px solid #e9d5ff; border-radius: 10px; padding: 12px;">
                <p style="margin: 0; font-size: 13px; color: #6b21a8; font-weight: 700;">📌 خطة احتياطية مؤقتة / Temporary backup rule</p>
                <p style="margin: 6px 0 0; font-size: 12px; color: #6b21a8;">لو الحد الأدنى مش متسجل، النظام يستخدم حد احتياطي قابل للتعديل لكل صنف. If minimum stock is missing, the configured backup threshold decides whether to order.</p>
              </div>`
                  : ""
              }
              ${
                warningRows
                  ? `<div style="margin-top: 12px; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 12px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #9a3412; font-weight: 700;">⚠️ مراجعة إعدادات / Setup warnings</p>
                <ul style="margin: 0; padding-right: 18px; color: #9a3412; font-size: 12px; line-height: 1.6;">${warningRows}</ul>
              </div>`
                  : ""
              }
            </td>
          </tr>`
              : `
          <tr>
            <td style="padding: 20px 24px 12px;">
              <div style="background-color: #ecfdf5; border-radius: 12px; padding: 16px; text-align: center;">
                <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600;">✅ كل الأصناف متوفرة — مفيش حاجة محتاجة تتطلب<br>All stock levels are healthy.</p>
              </div>
            </td>
          </tr>`
          }

          <tr>
            <td style="padding: 12px 24px 20px;">
              <h2 style="margin: 0 0 10px; color: #8b2635; font-size: 15px; font-weight: 700;">👥 مسؤوليات الفريق / Team Responsibilities</h2>
              <ul style="margin: 0 0 12px; padding-right: 18px; color: #4b5563; font-size: 13px; line-height: 1.7;">
                <li><strong>البارستا / Baristas:</strong> يسجلوا النواقص الفعلية أول بأول ويأكدوا الكميات قبل نهاية الشيفت. Log real shortages and confirm quantities before shift end.</li>
                <li><strong>الإدارة / Management:</strong> تراجع الأصناف المطلوبة وتعتمد طلب الشراء في نفس اليوم. Review suggested orders and approve purchases the same day.</li>
              </ul>
              <h2 style="margin: 0 0 10px; color: #8b2635; font-size: 15px; font-weight: 700;">📊 نشاط اليوم / Today's Activity</h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666;">جرد مقدم / Submitted counts</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #2c2c2c; font-weight: 600; text-align: left;">${summary.todayCounts}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666; border-top: 1px solid #f0e6d0;">تحويلات / Transfers</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #2c2c2c; font-weight: 600; text-align: left; border-top: 1px solid #f0e6d0;">${summary.todayTransfers}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666; border-top: 1px solid #f0e6d0;">هالك / Waste</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #2c2c2c; font-weight: 600; text-align: left; border-top: 1px solid #f0e6d0;">${summary.todayWaste}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 16px 24px; background-color: #f8f0d2; text-align: center;">
              <p style="margin: 0; color: #8b2635aa; font-size: 12px;">رسالة تلقائية من Elite Coffee / Automated message</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const orderList = summary.orderNow
    .map(
      (item) =>
        `  • ${item.nameAr} / ${item.name}: current ${item.totalQty} ${item.unitAr}/${item.unit}, order ${item.suggestedOrderQty}, reason: ${reasonLabel(item.reason)}`,
    )
    .join("\n");

  const text = `Elite Coffee — ملخص يومي / Daily Summary
${arabicDate}

${
  hasOrderNow
    ? `🚨 لازم يتطلب / Needs ordering (${summary.orderNow.length}):
${orderList}`
    : "✅ كل الأصناف متوفرة / All stock levels are healthy"
}

👥 مسؤوليات الفريق / Team responsibilities:
  • البارستا / Baristas: تسجيل النواقص وتأكيد الكميات.
  • الإدارة / Management: مراجعة واعتماد الطلبات.

📊 نشاط اليوم / Today's activity:
  جرد مقدم / Submitted counts: ${summary.todayCounts}
  تحويلات / Transfers: ${summary.todayTransfers}
  هالك / Waste: ${summary.todayWaste}

---
رسالة تلقائية من Elite Coffee / Automated message`;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}
