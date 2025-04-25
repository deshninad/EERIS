// src/components/AnalyticsPane.jsx
import React from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const COLORS = {
  Pending: '#f1c40f',
  Approved: '#2ecc71',
  Rejected: '#e74c3c'
};

export default function AnalyticsPane({ expenses }) {
  // 1) Status distribution
  const statusCounts = ['Pending','Approved','Rejected'].map(name => ({
    name,
    value: expenses.filter(e => e.status === name).length
  }));

  // 2) Spend by category
  const catAgg = expenses.reduce((acc,e) => {
    acc[e.category] = (acc[e.category]||0) + e.amount;
    return acc;
  }, {});
  const catData = Object.entries(catAgg).map(([name, value])=>({ name, value }));

  return (
    <div className="analytics-pane">
      <h3>Overview</h3>

      <h4>Status</h4>
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={statusCounts}
            dataKey="value"
            nameKey="name"
            outerRadius={60}
            label
          >
            {statusCounts.map(entry=>(
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <h4>Spend by Category</h4>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={catData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={v=>`$${v.toFixed(2)}`} />
          <Bar dataKey="value" fill="#d61dfb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
