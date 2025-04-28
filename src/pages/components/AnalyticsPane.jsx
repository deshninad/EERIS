// src/components/AnalyticsPane.jsx

import React, { useMemo } from 'react'; // Ensure useMemo is imported
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'; // Ensure recharts is installed

// Define theme colors using CSS Variables with fallbacks
// Ensure these variables are defined in your loaded CSS (e.g., ESummaryPage.css)
const STATUS_CHART_COLORS = {
  Pending: 'var(--status-pending-text, #7a5f00)',
  Approved: 'var(--status-approved-text, #1d7b41)',
  Rejected: 'var(--status-rejected-text, #b52439)',
};
const BAR_CHART_FILL = 'var(--accent-primary, #0056b3)'; // Use theme accent color

export default function AnalyticsPane({ expenses, isLoading, error }) {

  // Handle Loading State
  if (isLoading) {
    return <div>Loading analytics data...</div>;
  }

  // Handle Error State
  if (error) {
    // Use the error class defined in admindashboard.css or global css
    return <div className="error">Could not load analytics data. {error}</div>;
  }

  // Defensive check for expenses prop
  if (!Array.isArray(expenses)) {
    console.error("AnalyticsPane received invalid 'expenses' prop:", expenses);
    return <div className="error">Invalid data received for analytics.</div>;
  }

  // --- Calculations (Memoized) ---
  const statusCounts = useMemo(() => {
    const validStatuses = ['Pending', 'Approved', 'Rejected'];
    const counts = validStatuses.reduce((acc, status) => { acc[status] = 0; return acc; }, {});
    expenses.forEach(e => {
        if (e && validStatuses.includes(e.status)) { // Added check for e existing
            counts[e.status]++;
        }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0); // Only include statuses with counts > 0
  }, [expenses]);

  const categorySpending = useMemo(() => {
    const agg = expenses.reduce((acc, e) => {
      if (e && typeof e.amount === 'number') { // Check e and e.amount
        const amount = e.amount;
        const category = e.category || 'Uncategorized'; // Group null/empty categories
        acc[category] = (acc[category] || 0) + amount;
      }
      return acc;
    }, {});
    return Object.entries(agg)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0) // Exclude categories with zero spending
      .sort((a, b) => b.value - a.value); // Sort descending
  }, [expenses]);


  // --- Render ---
  return (
    <div className="analytics-pane">
      <h2>Analytics Overview</h2>

      {expenses.length === 0 ? (
           <p>No expense data available to generate analytics.</p>
      ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            {/* Status Distribution Pie Chart */}
            <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
              <h4>Status Distribution</h4>
              {statusCounts.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusCounts}
                      dataKey="value"
                      nameKey="name"
                      cx="50%" cy="50%"
                      outerRadius={80}
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {statusCounts.map((entry) => (
                        // Use fallback color if variable not found
                        <Cell key={`cell-${entry.name}`} fill={STATUS_CHART_COLORS[entry.name] ?? '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} requests`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : ( <p>No status data to display.</p> )}
            </div>

            {/* Spend by Category Bar Chart */}
            <div style={{ flex: '2 1 400px', minWidth: '400px' }}>
              <h4>Spend by Category</h4>
              {categorySpending.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categorySpending} margin={{ top: 5, right: 5, left: 5, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={"var(--border-color)"} />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} fontSize="0.8rem"/>
                    <YAxis tickFormatter={(value) => `$${value}`} allowDecimals={false} fontSize="0.8rem"/>
                    <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Amount"]} />
                    <Legend wrapperStyle={{paddingTop: '20px'}}/>
                    <Bar dataKey="value" fill={BAR_CHART_FILL} />
                  </BarChart>
                </ResponsiveContainer>
              ) : ( <p>No category spending data yet.</p> )}
            </div>
          </div>
        )}
    </div>
  );
}
