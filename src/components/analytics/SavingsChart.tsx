"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useFormatter, useTranslations } from "next-intl";

interface SavingsChartProps {
  data: { month: string; savings: number; spending: number }[];
}

export function SavingsChart({ data }: SavingsChartProps) {
  const t = useTranslations("analyticsCharts");
  const format = useFormatter();

  const formatCurrency = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    });

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-6">
        <h3 className="font-calistoga text-xl mb-6 text-elite-black">
          {t("savings.title")}
        </h3>
        <div className="h-[300px] flex items-center justify-center text-elite-black/50 font-cabin">
          {t("empty")}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-6">
      <h3 className="font-calistoga text-xl mb-6 text-elite-black">
        {t("savings.title")}
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F5F5DC" />
          <XAxis
            dataKey="month"
            style={{ fontFamily: "Cabin", fontSize: 12, fill: "#000" }}
            stroke="#800020"
          />
          <YAxis
            style={{ fontFamily: "Cabin", fontSize: 12, fill: "#000" }}
            stroke="#800020"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#800020",
              border: "none",
              borderRadius: "12px",
              color: "#F5F5DC",
              fontFamily: "Cabin",
              padding: "12px",
            }}
            formatter={(value: number) => [formatCurrency(value), ""]}
            labelStyle={{
              color: "#F5F5DC",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          />
          <Legend
            wrapperStyle={{ fontFamily: "Cabin", fontSize: 14 }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="savings"
            stroke="#800020"
            strokeWidth={3}
            dot={{ fill: "#800020", r: 5 }}
            name={t("savings.lineLabel")}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
