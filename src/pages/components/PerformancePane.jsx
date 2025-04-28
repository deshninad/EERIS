import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';

/**
 * Generates n days of fake uptime (%) values.
 * You can replace this with a fetch from your monitoring API.
 */
const makeMockUptime = (n = 14) => {
  const arr = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    // 96-100 % most days, with an occasional dip
    const uptime = +(Math.random() > 0.15
      ? 96 + Math.random() * 4   // normal day
      : 85 + Math.random() * 10  // bad day
    ).toFixed(2);

    arr.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      uptime
    });
  }
  return arr;
};

export default function PerformancePane() {
  // memoize so mock data stays constant across rerenders
  const data = useMemo(() => makeMockUptime(14), []);

  return (
    <div className="perf-pane">
      <h3>Website Uptime – last {data.length} days</h3>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            domain={[80, 100]}
            tickFormatter={v => `${v}%`}
            ticks={[80, 85, 90, 95, 100]}
          />
          <Tooltip formatter={v => `${v}%`} />
          {/* SLA line at 99 % */}
          <ReferenceLine
            y={99}
            label="SLA 99%"
            stroke="#e74c3c"
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="uptime"
            stroke="#27ae60"
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
