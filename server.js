import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

const USERS_FILE   = path.join(__dirname, 'src/data/USERS.json');
const EXPENSES_FILE = path.join(__dirname, 'src/data/data.json');

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ————————————————————————————————
// 1) SEND OTP with role check
app.post('/send-OTP', (req, res) => {
  const { email, otp, role } = req.body;
  if (!email || !otp || !role) {
    return res.status(400).json({ message: 'Email, role and OTP required.' });
  }

  const users = readJSON(USERS_FILE);
  const isEmp  = users.employees.includes(email);
  const isAdm  = users.admins.includes(email);

  if (role === 'employee' && !isEmp) {
    return res.status(403).json({ message: 'Not registered as employee.' });
  }
  if (role === 'admin' && !isAdm && !isEmp) {
    return res.status(403).json({ message: 'Not registered as admin.' });
  }

  // run your OTP script
  exec(`python3 src/backend/OTP_emailer.py ${email} ${otp}`, (err, stdout, stderr) => {
    if (err || stderr) {
      console.error(err || stderr);
      return res.status(500).json({ success: false, message: 'Error sending OTP.' });
    }
    res.json({ success: true, message: 'OTP sent.' });
  });
});

// ————————————————————————————————
// 2) GET USERS
app.get('/get-users', (req, res) => {
  try {
    res.json(readJSON(USERS_FILE));
  } catch {
    res.status(500).json({ message: 'Cannot load users.' });
  }
});

// ————————————————————————————————
// 3) GET EXPENSES
app.get('/get-expenses', (req, res) => {
  const file = EXPENSES_FILE;
  console.log('[get-expenses] looking for file at:', file);
  try {
    if (!fs.existsSync(file)) {
      console.error('[get-expenses] file does not exist:', file);
      return res.status(500).json({ error: 'Expenses file missing on disk' });
    }
    const data = readJSON(file);
    console.log('[get-expenses] loaded', data.length, 'records');
    return res.json(data);
  } catch (err) {
    console.error('[get-expenses] error reading file:', err);
    return res.status(500).json({ error: 'Failed to load expenses' });
  }
});


// ————————————————————————————————
// 4) APPROVE EXPENSE
app.post('/approve-expense', (req, res) => {
  const { expenseId } = req.body;
  const exps = readJSON(EXPENSES_FILE);
  const idx = exps.findIndex(e => e.id === expenseId);
  if (idx === -1) return res.status(404).json({ message: 'Not found.' });
  exps[idx].status = 'Approved';
  writeJSON(EXPENSES_FILE, exps);
  res.json({ success: true });
});

// ————————————————————————————————
// 5) UPDATE EXPENSE
app.post('/update-expense', (req, res) => {
  const { expenseId, field, newValue } = req.body;
  const exps = readJSON(EXPENSES_FILE);
  const idx = exps.findIndex(e => e.id === expenseId);
  if (idx === -1) return res.status(404).json({ message: 'Not found.' });
  exps[idx][field] = newValue;
  writeJSON(EXPENSES_FILE, exps);
  res.json({ success: true });
});

// ————————————————————————————————
// 6) DELETE EXPENSE
app.post('/delete-expense', (req, res) => {
  const { expenseId } = req.body;
  let exps = readJSON(EXPENSES_FILE);
  exps = exps.filter(e => e.id !== expenseId);
  writeJSON(EXPENSES_FILE, exps);
  res.json({ success: true });
});

// ————————————————————————————————
// 7) ADD USER
app.post('/add-user', (req, res) => {
  const { email, role } = req.body;
  if (!email.endsWith('@usf.edu')) {
    return res.status(400).json({ message: 'Email must end in @usf.edu.' });
  }
  if (role !== 'admin' && role !== 'employee') {
    return res.status(400).json({ message: 'Role must be admin or employee.' });
  }

  const users = readJSON(USERS_FILE);
  const list  = role + 's';
  if (users[list].includes(email)) {
    return res.status(409).json({ message: 'User already exists.' });
  }

  users[list].push(email);
  writeJSON(USERS_FILE, users);
  res.json({ success: true, message: `${email} added as ${role}` });
});

// ————————————————————————————————
const PORT = 5001;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
