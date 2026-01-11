import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AnalyticsData {
  userName: string;
  userEmail: string;
  period: string;
  totalOrders: number;
  totalSpent: number;
  totalSaved: number;
  averageSavingsPerOrder: number;
  currentPoints: number;
  totalPointsEarned: number;
  tier: string;
  savingsByMonth: { month: string; amount: number }[];
  pointsByMonth: { month: string; points: number }[];
  topOrders?: {
    date: string;
    amount: number;
    saved: number;
    points: number;
  }[];
}

export function generateAnalyticsPDF(data: AnalyticsData): void {
  const doc = new jsPDF();

  // Elite colors
  const burgundy: [number, number, number] = [128, 0, 32];
  const cream: [number, number, number] = [245, 245, 220];
  const black: [number, number, number] = [0, 0, 0];

  // Header
  doc.setFillColor(...burgundy);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(...cream);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Elite Coffee Analytics", 15, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.userName} (${data.userEmail})`, 15, 28);
  doc.text(`Period: ${data.period}`, 15, 34);

  // Reset text color
  doc.setTextColor(...black);

  let yPos = 50;

  // Summary Section
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 15, yPos);
  yPos += 10;

  const summaryData = [
    ["Total Orders", data.totalOrders.toString()],
    ["Total Spent", `EGP ${data.totalSpent.toFixed(2)}`],
    ["Total Saved", `EGP ${data.totalSaved.toFixed(2)}`],
    [
      "Average Savings per Order",
      `EGP ${data.averageSavingsPerOrder.toFixed(2)}`,
    ],
    ["Current Points Balance", data.currentPoints.toLocaleString()],
    ["Total Points Earned", data.totalPointsEarned.toLocaleString()],
    ["Tier", data.tier.toUpperCase()],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: summaryData,
    theme: "grid",
    headStyles: {
      fillColor: burgundy,
      textColor: cream,
      fontSize: 10,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 240],
    },
  });

  yPos =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 15;

  // Savings by Month
  if (data.savingsByMonth && data.savingsByMonth.length > 0) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Savings by Month", 15, yPos);
    yPos += 5;

    const savingsData = data.savingsByMonth.map((item) => [
      item.month,
      `EGP ${item.amount.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Month", "Savings"]],
      body: savingsData,
      theme: "grid",
      headStyles: {
        fillColor: burgundy,
        textColor: cream,
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 240],
      },
    });

    yPos =
      (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 15;
  }

  // New page if needed
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // Points by Month
  if (data.pointsByMonth && data.pointsByMonth.length > 0) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Points Earned by Month", 15, yPos);
    yPos += 5;

    const pointsData = data.pointsByMonth.map((item) => [
      item.month,
      item.points.toLocaleString(),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Month", "Points"]],
      body: pointsData,
      theme: "grid",
      headStyles: {
        fillColor: burgundy,
        textColor: cream,
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 240],
      },
    });

    yPos =
      (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 15;
  }

  // Top Orders
  if (data.topOrders && data.topOrders.length > 0) {
    // New page for top orders
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Top Orders", 15, yPos);
    yPos += 5;

    const ordersData = data.topOrders.map((order) => [
      order.date,
      `EGP ${order.amount.toFixed(2)}`,
      `EGP ${order.saved.toFixed(2)}`,
      order.points.toLocaleString(),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Date", "Amount", "Saved", "Points"]],
      body: ordersData,
      theme: "grid",
      headStyles: {
        fillColor: burgundy,
        textColor: cream,
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 240],
      },
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
      15,
      290,
    );
    doc.text("Elite Coffee Analytics Report", 140, 290);
  }

  // Save PDF
  const fileName = `elite-analytics-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

export async function fetchAndExportAnalytics(): Promise<void> {
  try {
    // Fetch all analytics data
    const [savingsRes, pointsRes, historyRes] = await Promise.all([
      fetch("/api/user/savings"),
      fetch("/api/user/points"),
      fetch("/api/user/points/history?limit=10"),
    ]);

    if (!savingsRes.ok || !pointsRes.ok || !historyRes.ok) {
      throw new Error("Failed to fetch analytics data");
    }

    const savingsData = await savingsRes.json();
    const pointsData = await pointsRes.json();
    const historyData = await historyRes.json();

    // Prepare data for PDF
    const analyticsData: AnalyticsData = {
      userName: "User", // You'd get this from session
      userEmail: "user@example.com", // You'd get this from session
      period: "All Time",
      totalOrders: savingsData.totalOrders || 0,
      totalSpent: savingsData.totalSpent || 0,
      totalSaved: savingsData.totalSaved || 0,
      averageSavingsPerOrder: savingsData.averageSavingsPerOrder || 0,
      currentPoints: pointsData.currentBalance || 0,
      totalPointsEarned: pointsData.totalEarned || 0,
      tier: pointsData.tier || "bronze",
      savingsByMonth:
        savingsData.savingsByMonth
          ?.slice(0, 6)
          .map((item: { month: string; amount: number }) => ({
            month: item.month,
            amount: Number(item.amount),
          })) || [],
      pointsByMonth:
        historyData.byMonth
          ?.slice(0, 6)
          .map((item: { month: string; points: number }) => ({
            month: item.month,
            points: item.points,
          })) || [],
      topOrders:
        savingsData.topSavingOrders
          ?.slice(0, 10)
          .map(
            (order: {
              date: string;
              total: number;
              saved: number;
              points?: number;
            }) => ({
              date: new Date(order.date).toLocaleDateString(),
              amount: order.total,
              saved: order.saved,
              points: order.points || 0,
            }),
          ) || [],
    };

    // Generate PDF
    generateAnalyticsPDF(analyticsData);
  } catch (error) {
    console.error("Error exporting analytics:", error);
    throw error;
  }
}
