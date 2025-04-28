import React from 'react';

// Basic styling for the policies pane (can be expanded in AdminDashboard.css)
const paneStyle = {
  padding: '1rem', // Add some internal padding
  maxWidth: '800px', // Limit width for readability
  // Use theme variables if available, otherwise fallback
  color: 'var(--text-primary, #212529)',
  lineHeight: '1.6'
};

const headingStyle = {
  color: 'var(--accent-primary, #0056b3)',
  borderBottom: '1px solid var(--border-color, #e9ecef)',
  paddingBottom: '0.5rem',
  marginBottom: '1rem'
};

const subHeadingStyle = {
  marginTop: '1.5rem',
  marginBottom: '0.5rem',
  color: 'var(--text-primary, #212529)',
  fontWeight: '600'
};

const PoliciesPane = () => {
  return (
    <div className="policies-pane" style={paneStyle}>
      <h2 style={headingStyle}>System Policies & Guidelines</h2>

      <p>
        Welcome to the EERIS Admin Dashboard. This section outlines the key policies
        and procedures governing the expense reimbursement system.
      </p>

      <h3 style={subHeadingStyle}>Expense Submission & Receipt Requirements</h3>
      <ul>
        <li>All expense reimbursement requests must be submitted via the Employee Dashboard.</li>
        <li>A clear, legible digital copy (scan or photo) of the original receipt must be attached to each expense item.</li>
        <li>Receipts must clearly show the vendor name, date of purchase, itemized list of goods/services, and the total amount paid.</li>
        <li>Expenses submitted without valid receipts or with illegible receipts may be rejected or require clarification.</li>
      </ul>

      <h3 style={subHeadingStyle}>Approval Workflow</h3>
      <ol>
        <li>Employee submits an expense request with attached receipts.</li>
        <li>The request status is initially set to "Pending".</li>
        <li>Admins review the request details and receipt(s) in the Admin Dashboard.</li>
        <li>Admins can take one of the following actions:
          <ul>
            <li><strong>Approve:</strong> The request is valid and meets policy requirements.</li>
            <li><strong>Reject:</strong> The request is invalid, violates policy, or lacks sufficient documentation (a comment is required).</li>
            <li><strong>Request Clarification:</strong> More information or a better receipt is needed from the employee (a comment specifying the required information is mandatory). The status changes, notifying the employee.</li>
          </ul>
        </li>
         <li>Approved expenses are processed for reimbursement according to the company's payment schedule.</li>
      </ol>

      <h3 style={subHeadingStyle}>Spending Limits & Policies</h3>
      <ul>
        <li><strong>Individual Expense Limit:</strong> Employees may request reimbursement for a single expense item up to <strong>$500.00</strong> without requiring secondary approval. Expenses exceeding this amount must be pre-approved by management.</li>
        <li><strong>Categorization:</strong> Please ensure expenses are categorized correctly (e.g., Travel, Meals, Software, Office Supplies) to aid reporting.</li>
        <li><strong>Timeliness:</strong> Expenses should ideally be submitted within 30 days of incurring the cost. Submissions older than 90 days may be rejected unless prior exception is granted.</li>
        <li><strong>Non-Reimbursable Items:</strong> Personal items, commuting costs, fines/penalties, and expenses not directly related to business operations are generally not reimbursable. Refer to the full Employee Handbook for details.</li>
      </ul>

       <p>
        <em>
          Note: These policies are subject to change. Please refer to the official
          company documentation for the most up-to-date information. If you have
          questions, please contact the Finance department or your administrator.
        </em>
      </p>
    </div>
  );
};

export default PoliciesPane;