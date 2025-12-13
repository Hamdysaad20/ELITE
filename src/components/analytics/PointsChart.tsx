"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PointsChartProps {
  data: { month: string; earned: number; redeemed?: number }[];
}

export function PointsChart({ data }: PointsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-6">
        <h3 className="font-calistoga text-xl mb-6 text-elite-black">Points Earned</h3>
        <div className="h-[300px] flex items-center justify-center text-elite-black/50 font-cabin">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-6">
      <h3 className="font-calistoga text-xl mb-6 text-elite-black">Points Earned</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#800020" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#800020" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F5F5DC" />
          <XAxis 
            dataKey="month" 
            style={{ fontFamily: 'Cabin', fontSize: 12, fill: '#000' }}
            stroke="#800020"
          />
          <YAxis 
            style={{ fontFamily: 'Cabin', fontSize: 12, fill: '#000' }}
            stroke="#800020"
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#800020',
              border: 'none',
              borderRadius: '12px',
              color: '#F5F5DC',
              fontFamily: 'Cabin',
              padding: '12px'
            }}
            formatter={(value: number) => [`${value.toLocaleString()} pts`, '']}
            labelStyle={{ color: '#F5F5DC', fontWeight: 'bold', marginBottom: '8px' }}
          />
          <Area 
            type="monotone" 
            dataKey="earned" 
            stroke="#800020" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorEarned)"
            name="Points Earned"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
