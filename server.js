import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // Required for __dirname alternative

// __dirname workaround for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Helper functions to load and save JSON files
const getUsers = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/USERS.json'), 'utf-8'));
const getExpenses = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/DATA.json'), 'utf-8'));
const saveExpenses = (data) => fs.writeFileSync(path.join(__dirname, 'src/data/DATA.json'), JSON.stringify(data, null, 2));
const saveUsers = (data) => fs.writeFileSync(path.join(__dirname, 'src/data/USERS.json'), JSON.stringify(data, null, 2));


// Route to send OTP with role-based verification
app.post('/send-OTP', (req, res) => {
  const { email, otp, role } = req.body; // Extract role from request

  if (!email || !otp || !role) {
    return res.status(400).json({ message: 'Email, role, and OTP are required.' });
  }

  // Load user data
  const users = getUsers();
  if (!users) {
    return res.status(500).json({ message: 'Error loading user data' });
  }

  const isEmployee = users.employees.includes(email);
  const isAdmin = users.admins.includes(email);

  // Check role-based access
  if (role === 'employee' && !isEmployee) {
    return res.status(403).json({ message: 'Access denied: You are not registered as an employee.' });
  }

  if (role === 'admin' && !isAdmin && !isEmployee) {
    return res.status(403).json({ message: 'Access denied: You are not registered as an admin.' });
  }

  // Construct command to run Python script
  const command = `python3 src/backend/OTP_emailer.py ${email} ${otp}`;
  console.log('Executing command:', command);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Error executing script' });
    }
    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
      return res.status(500).json({ success: false, message: 'Script error' });
    }

    console.log(`Script stdout: ${stdout}`);
    res.json({ success: true, message: 'OTP sent successfully' });
  });
});

// Route to fetch USERS.json for frontend role validation
app.get('/get-users', (req, res) => {
  const users = getUsers();
  if (!users) {
    return res.status(500).json({ message: 'Error loading user data' });
  }
  console.log(users)
  res.json(users);
});

//  Get all expenses
app.get('/get-expenses', (req, res) => {
  try {
    res.json(getExpenses());
  } catch (error) {
    res.status(500).json({ message: 'Error loading expenses' });
  }
});

//  Approve an expense
app.post('/approve-expense', (req, res) => {
  const { expenseId } = req.body;
  let expenses = getExpenses();

  const expenseIndex = expenses.findIndex((exp) => exp.id === expenseId);
  if (expenseIndex === -1) return res.status(404).json({ message: 'Expense not found' });

  expenses[expenseIndex].status = 'Approved';
  saveExpenses(expenses);
  
  res.json({ success: true, message: 'Expense approved successfully' });
});

//  Edit an expense field
app.post('/update-expense', (req, res) => {
  const { expenseId, field, newValue } = req.body;
  let expenses = getExpenses();

  const expenseIndex = expenses.findIndex((exp) => exp.id === expenseId);
  if (expenseIndex === -1) return res.status(404).json({ message: 'Expense not found' });

  expenses[expenseIndex][field] = newValue;  // Update the specific field
  saveExpenses(expenses);

  res.json({ success: true, message: `Updated ${field} successfully` });
});

//  Add a new user (Admin or Employee)
app.post('/add-user', (req, res) => {
  const { email, role } = req.body;
  let users = getUsers();

  if (role !== 'admin' && role !== 'employee') {
    return res.status(400).json({ message: 'Invalid role. Must be admin or employee.' });
  }

  if (users[role + 's'].includes(email)) {
    return res.status(409).json({ message: 'User already exists.' });
  }

  users[role + 's'].push(email);
  saveUsers(users);

  res.json({ success: true, message: `${email} added as ${role}` });
});


const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
